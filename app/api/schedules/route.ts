import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isProjectOrganizer } from "@/lib/project-access";
import { choices, DURATIONS, MAX_INVITEES, MAX_NAME_LENGTH, MAX_SLOTS, parseWall, uuid, validZone, type Choice, type Invitee } from "@/lib/schedule";

export const dynamic = "force-dynamic";

type PollRow = {
  id: string; owner: string; title: string; note: string; organizer_zone: string;
  partner_zone: string; duration: number; slots: string; final_slot: number | null; invitees: string;
};
type ResponseRow = { voter: string; name: string; votes: string };

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

function fail(error: string, status: number) {
  return json({ error }, status);
}

async function pollById(id: string) {
  return env.DB!.prepare("SELECT * FROM polls WHERE id = ?").bind(id).first<PollRow>();
}

async function voterHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: Request) {
  if (!await isProjectOrganizer()) return fail("forbidden", 403);
  if (!env.DB) return fail("unavailable", 503);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const user = await getChatGPTUser();

  if (!id) {
    if (!user) return json({ polls: [] });
    const { results } = await env.DB.prepare(
      "SELECT id, title, final_slot AS finalSlot FROM polls WHERE owner = ? ORDER BY created DESC LIMIT 100"
    ).bind(user.userId).all();
    return json({ polls: results });
  }

  if (!uuid.test(id)) return fail("missing", 404);
  const poll = await pollById(id);
  if (!poll) return fail("missing", 404);

  const token = request.headers.get("X-Voter-Token") ?? "";
  const invitees = JSON.parse(poll.invitees) as Invitee[];
  const restricted = invitees.length > 0;
  const managed = user?.userId === poll.owner;
  const guest = invitees.find(invitee => invitee.token === token);
  if (restricted && !managed && !guest) return fail("inviteRequired", 403);

  const voter = uuid.test(token) && (!restricted || guest) ? await voterHash(token) : null;
  const { results } = await env.DB.prepare(
    "SELECT voter, name, votes FROM responses WHERE poll_id = ? ORDER BY created, voter"
  ).bind(id).all<ResponseRow>();
  const own = results.find(row => row.voter === voter);
  const responded = new Set(results.map(row => row.voter));
  const organizerInvitees = managed
    ? await Promise.all(invitees.map(async invitee => ({ ...invitee, responded: responded.has(await voterHash(invitee.token)) })))
    : [];
  const response = (row: ResponseRow) => ({ name: row.name, votes: JSON.parse(row.votes) });

  return json({
    id: poll.id, title: poll.title, note: poll.note, duration: poll.duration,
    organizerZone: poll.organizer_zone, partnerZone: poll.partner_zone,
    slots: JSON.parse(poll.slots), finalSlot: poll.final_slot,
    managed, restricted, invitees: organizerInvitees, guestName: guest?.name ?? null,
    responses: results.map(response),
    ownVote: own ? response(own) : null,
  });
}

function trimmed(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

export async function POST(request: Request) {
  if (!await isProjectOrganizer()) return fail("forbidden", 403);
  if (!env.DB) return fail("unavailable", 503);
  const origin = request.headers.get("Origin");
  if (origin && request.headers.get("Sec-Fetch-Site") !== "same-origin") {
    if (URL.parse(origin)?.host !== new URL(request.url).host) return fail("forbidden", 403);
  }
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return fail("invalid", 400);
  const raw = await request.text();
  if (raw.length > 12000) return fail("invalid", 400);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("invalid", 400);
  }
  if (!body || typeof body !== "object") return fail("invalid", 400);

  if (body.action === "create") {
    const user = await getChatGPTUser();
    if (!user) return fail("signin", 401);
    const { organizerZone, partnerZone, duration, localSlots } = body;
    const title = trimmed(body.title);
    const note = trimmed(body.note);
    const invitedNames = body.invitedNames ?? [];
    if (!Array.isArray(invitedNames) || invitedNames.length > MAX_INVITEES) return fail("invalidInvitees", 400);
    const names = invitedNames.map(trimmed);
    if (names.some(name => !name || name.length > MAX_NAME_LENGTH) || new Set(names).size !== names.length) {
      return fail("invalidInvitees", 400);
    }
    if (!title || title.length > 100 || note.length > 600 || !validZone(organizerZone) ||
        !validZone(partnerZone) || organizerZone === partnerZone || !DURATIONS.includes(duration) ||
        !Array.isArray(localSlots) || localSlots.length < 2 || localSlots.length > MAX_SLOTS) {
      return fail("invalid", 400);
    }
    const slots: number[] = [];
    for (const local of localSlots) {
      const time = typeof local === "string" ? parseWall(local, organizerZone) : null;
      if (time === null || slots.includes(time)) return fail("invalidSlots", 400);
      slots.push(time);
    }
    slots.sort((a, b) => a - b);
    const id = crypto.randomUUID();
    const invitees: Invitee[] = names.map(name => ({ name, token: crypto.randomUUID() }));
    await env.DB.prepare(
      "INSERT INTO polls (id, owner, title, note, organizer_zone, partner_zone, duration, slots, invitees, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, user.userId, title, note, organizerZone, partnerZone, duration, JSON.stringify(slots), JSON.stringify(invitees), Date.now()).run();
    return json({ id }, 201);
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!uuid.test(id)) return fail("missing", 404);
  const poll = await pollById(id);
  if (!poll) return fail("missing", 404);
  const slots = JSON.parse(poll.slots) as number[];

  if (body.action === "vote") {
    const token = request.headers.get("X-Voter-Token") ?? "";
    const invitees = JSON.parse(poll.invitees) as Invitee[];
    const guest = invitees.find(invitee => invitee.token === token);
    if (invitees.length > 0 && !guest) return fail("inviteRequired", 403);
    const name = guest?.name ?? trimmed(body.name);
    const votes: Choice[] = body.votes;
    if (!uuid.test(token) || !name || name.length > MAX_NAME_LENGTH || !Array.isArray(votes) ||
        votes.length !== slots.length || votes.some(vote => !choices.includes(vote))) {
      return fail("invalid", 400);
    }
    const result = await env.DB.prepare(
      `INSERT INTO responses (poll_id, voter, name, votes, created)
       SELECT id, ?, ?, ?, ? FROM polls WHERE id = ? AND final_slot IS NULL
       ON CONFLICT (poll_id, voter) DO UPDATE SET name = excluded.name, votes = excluded.votes`
    ).bind(await voterHash(token), name, JSON.stringify(votes), Date.now(), id).run();
    return result.meta.changes ? json({ saved: true }) : fail("closed", 409);
  }

  if (body.action === "finalize" || body.action === "reopen") {
    const user = await getChatGPTUser();
    if (!user || user.userId !== poll.owner) return fail("forbidden", 403);
    const finalSlot = body.action === "reopen" ? null : body.slot;
    if (body.action === "finalize" && !slots.includes(finalSlot)) return fail("invalid", 400);
    await env.DB.prepare("UPDATE polls SET final_slot = ? WHERE id = ? AND owner = ?")
      .bind(finalSlot, id, user.userId).run();
    return json({ saved: true });
  }
  return fail("invalid", 400);
}
