import { env } from "cloudflare:workers";
import { getProjectMember, isProjectOrganizer } from "@/lib/project-access";
import { AVATAR_IDS, customPortrait, expandCandidateWindows, PROJECT_COMPLETION_EMAIL, PROJECT_ORGANIZER_ID, PROJECT_ORGANIZER_NAME, type AvailabilityWindow, type CandidateWindow, type ProjectAvatar, type ProjectAvatarStyle, type ProjectBoard, type ProjectMember, type ProjectRespondent, type ProjectTargetRespondent, type Proposal } from "@/lib/project";
import { choices, DURATIONS, MAX_NAME_LENGTH, parseWall, uuid, validZone, type Choice } from "@/lib/schedule";

export const dynamic = "force-dynamic";

type ProposalRow = Pick<Proposal, "id" | "title" | "start" | "duration"> & {
  meeting_id: string | null; meeting_url: string | null; proposer_id: string | null; respondents: string; confirmed: number;
};
type ResponseRow = { proposal_id: string; member_id: string; choice: Choice; availability: string | null };
type SavedResponse = { choice: Choice; availability: AvailabilityWindow[] | null };
type ProfileRow = { id: string; avatar: ProjectAvatar; avatar_style: ProjectAvatarStyle; display_name: string | null };
type TargetRow = { meeting_id: string; avatar: ProjectAvatar; member_id: string | null };
type ProfileInput = { avatar: ProjectAvatar; avatarStyle: ProjectAvatarStyle | null; name: string | null };
const organizerRespondent = { id: PROJECT_ORGANIZER_ID, name: PROJECT_ORGANIZER_NAME };
const openProposal = `confirmed = 0 AND (meeting_id IS NULL OR NOT EXISTS (
  SELECT 1 FROM project_proposals chosen WHERE chosen.meeting_id = project_proposals.meeting_id AND chosen.confirmed = 1
))`;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

function fail(error: string, status: number) {
  return json({ error }, status);
}

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readMeetingUrl(value: unknown) {
  if (value === undefined || value === null) return { meetingUrl: value };
  if (typeof value !== "string") return { error: "invalidMeetingUrl" as const };

  const text = value.trim();
  if (!text) return { meetingUrl: null };
  const url = /^https:\/\/[^/]/i.test(text) && !/[\s\\]/.test(text) ? URL.parse(text) : null;
  if (!url || url.protocol !== "https:" || !url.hostname || url.username || url.password || url.href.length > 2048) {
    return { error: "invalidMeetingUrl" as const };
  }
  return { meetingUrl: url.href };
}

function canManage(organizer: boolean, member: ProjectRespondent | null, proposerId: string | null) {
  return organizer || Boolean(member && proposerId === member.id);
}

function allowedMember(respondents: string, memberId: string) {
  const ids = JSON.parse(respondents) as string[];
  return ids.length === 0 || ids.includes(memberId);
}

function isCandidateWindow(value: unknown): value is CandidateWindow {
  if (!value || typeof value !== "object") return false;
  const window = value as Record<string, unknown>;
  return typeof window.date === "string" && typeof window.from === "string" && typeof window.to === "string";
}

function readCandidateStarts(localTime: unknown, windows: unknown, zone: string, duration: number) {
  if (windows === undefined) {
    const start = typeof localTime === "string" ? parseWall(localTime, zone) : null;
    return start === null ? { error: "invalidTime" as const } : { starts: [start] };
  }
  if (!Array.isArray(windows) || !windows.length || !windows.every(isCandidateWindow)) {
    return { error: "invalid" as const, starts: undefined };
  }
  return expandCandidateWindows(windows, zone, duration);
}

function readProfile(avatarValue: unknown, nameValue: unknown, styleValue: unknown): ProfileInput | null {
  const avatar = AVATAR_IDS.find(id => id === avatarValue);
  if (!avatar) return null;
  if (styleValue !== undefined && styleValue !== "wide" && styleValue !== "kirie") return null;
  if (avatar === "09" && styleValue === "kirie") return null;
  const name = customPortrait(avatar) ? trimmed(nameValue) : null;
  if (name !== null && (!name || name.length > MAX_NAME_LENGTH)) return null;
  return { avatar, avatarStyle: styleValue ?? null, name };
}

function isMinute(value: unknown): value is number {
  return typeof value === "number" && Math.abs(value) <= 8.64e15 && value % 60_000 === 0;
}

function readAvailability(value: unknown, choice: Choice): AvailabilityWindow[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length === 0) return choice === "no" ? [] : null;
  if (choice !== "yes") return null;

  const windows: AvailabilityWindow[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const { start, end } = entry;
    if (!isMinute(start) || !isMinute(end) || end <= start) return null;
    windows.push({ start, end });
  }
  return windows.sort((left, right) => left.start - right.start || left.end - right.end);
}

function saveProfile(db: D1Database, profileId: string, { avatar, avatarStyle, name }: ProfileInput, proposalId: string | null = null) {
  return db.prepare(
    `INSERT INTO project_profiles (id, avatar, display_name, avatar_style)
     SELECT ?, ?, ?, COALESCE(?, (SELECT avatar_style FROM project_profiles WHERE id = ? AND avatar = ?), 'wide')
     WHERE NOT EXISTS (SELECT 1 FROM project_profiles WHERE avatar = ? AND id <> ?)
       AND (? IS NULL OR EXISTS (SELECT 1 FROM project_proposals WHERE id = ? AND ${openProposal}))
     ON CONFLICT(id) DO UPDATE SET avatar = excluded.avatar, display_name = excluded.display_name, avatar_style = excluded.avatar_style`
  ).bind(profileId, avatar, name, avatarStyle, profileId, avatar, avatar, profileId, proposalId, proposalId);
}

function claimPendingTargets(db: D1Database, memberId: string, avatar: ProjectAvatar) {
  // A filled seat remains tied to its member, even if they later change their profile art.
  return db.prepare(
    `UPDATE project_meeting_respondents SET member_id = ?
     WHERE member_id IS NULL AND avatar = ? AND changes() > 0
       AND NOT EXISTS (
         SELECT 1 FROM project_meeting_respondents assigned
         WHERE assigned.meeting_id = project_meeting_respondents.meeting_id AND assigned.member_id = ?
       )`
  ).bind(memberId, avatar, memberId);
}

function saveResponse(db: D1Database, proposalId: string, memberId: string, response: SavedResponse, profile?: ProfileInput) {
  const avatar = profile?.avatar ?? null;
  const avatarStyle = profile?.avatarStyle ?? null;
  const availability = response.availability === null ? null : JSON.stringify(response.availability);
  return db.prepare(
    `INSERT INTO project_responses (proposal_id, member_id, choice, availability)
     SELECT id, ?, ?, ? FROM project_proposals
     WHERE id = ? AND ${openProposal}
       AND (? IS NULL OR EXISTS (
         SELECT 1 FROM project_profiles WHERE id = ? AND avatar = ? AND display_name IS ? AND (? IS NULL OR avatar_style = ?)
       ))
     ON CONFLICT (proposal_id, member_id) DO UPDATE SET choice = excluded.choice,
       availability = CASE WHEN excluded.availability IS NULL AND project_responses.choice = excluded.choice
         THEN project_responses.availability ELSE excluded.availability END`
  ).bind(memberId, response.choice, availability, proposalId, avatar, memberId, avatar, profile?.name ?? null, avatarStyle, avatarStyle);
}

function queueCompletion(db: D1Database, proposalId: string, meetingId: string | null) {
  // Snapshot at the vote that completes every slot, with one notification per meeting.
  return db.prepare(
    `WITH participants(id) AS (
       SELECT id FROM project_members WHERE id <> ?
       UNION ALL SELECT ?
     ), meeting(id) AS (
       SELECT COALESCE(?, (SELECT meeting_id FROM project_proposals WHERE id = ?))
     ), slots AS (
       SELECT * FROM project_proposals
       WHERE (meeting_id = (SELECT id FROM meeting) OR (meeting_id IS NULL AND id = ?)) AND changes() > 0
     ), expected_responses AS (
       SELECT p.id AS proposal_id, target.member_id
       FROM slots p JOIN project_meeting_respondents target ON target.meeting_id = p.meeting_id
       UNION ALL
       SELECT p.id, m.id
       FROM slots p JOIN participants m ON json_array_length(p.respondents) = 0 OR m.id IN (SELECT value FROM json_each(p.respondents))
       WHERE NOT EXISTS (SELECT 1 FROM project_meeting_respondents target WHERE target.meeting_id = p.meeting_id)
     ), totals AS (
       SELECT p.id, p.start, p.duration, p.title, COUNT(r.choice) AS answered, COUNT(*) AS expected,
         SUM(r.choice = 'yes') AS yes_count, SUM(r.choice = 'maybe') AS maybe_count, SUM(r.choice = 'no') AS no_count
       FROM slots p JOIN expected_responses expected ON expected.proposal_id = p.id
       LEFT JOIN project_responses r ON r.proposal_id = p.id AND r.member_id = expected.member_id
       GROUP BY p.id
     )
     INSERT INTO project_completion_notifications
       (meeting_id, recipient, title, candidate_count, all_yes_count, top_slots, completed_at)
     SELECT COALESCE((SELECT id FROM meeting), ?), ?, MIN(title), COUNT(*), SUM(yes_count = expected),
       (SELECT json_group_array(json_array(start, duration, yes_count, maybe_count, no_count))
        FROM (SELECT * FROM totals ORDER BY no_count ASC, yes_count DESC, start ASC, id ASC LIMIT 5)), ?
     FROM totals
     HAVING COUNT(*) > 0 AND SUM(answered) = SUM(expected)
     ON CONFLICT(meeting_id) DO NOTHING`
  ).bind(PROJECT_ORGANIZER_ID, PROJECT_ORGANIZER_ID, meetingId, proposalId, proposalId, proposalId,
    PROJECT_COMPLETION_EMAIL, Date.now());
}

function registerOrganizerVoter(db: D1Database) {
  // The internal row has no usable invitation token. Only the authenticated
  // organizer can use this identity, and the row is excluded from invite management.
  return db.prepare(
    "INSERT INTO project_members (id, name, token, created) VALUES (?, ?, ?, 0) ON CONFLICT(id) DO NOTHING"
  ).bind(PROJECT_ORGANIZER_ID, "\norganizer", PROJECT_ORGANIZER_ID).run();
}

const meetingSlots = "meeting_id = ? OR (meeting_id IS NULL AND id = ?)";
const existsAnchor = "EXISTS (SELECT 1 FROM project_proposals WHERE id = ? AND (meeting_id = ? OR (meeting_id IS NULL AND id = ?)))";

async function editMeeting(db: D1Database, id: string, meetingId: string, title: string, duration: number, starts: number[], meetingUrl: string | null | undefined) {
  const candidates = JSON.stringify(starts);
  const additions = JSON.stringify(starts.map(start => ({ id: crypto.randomUUID(), start })));
  const sameSlot = "duration = ? AND start IN (SELECT value FROM json_each(?))";
  const anchor = [id, meetingId, meetingId] as const;
  const group = [meetingId, meetingId] as const;
  const urlUpdate = [meetingUrl !== undefined, meetingUrl ?? null] as const;
  const [, update, , , , current] = await db.batch<{ id: string }>([
    db.prepare(`INSERT INTO project_proposals (id, meeting_id, title, proposer_id, start, duration, respondents, meeting_url)
      SELECT json_extract(candidate.value, '$.id'), ?, ?, anchor.proposer_id,
        json_extract(candidate.value, '$.start'), ?, anchor.respondents, CASE WHEN ? THEN ? ELSE anchor.meeting_url END
      FROM project_proposals anchor, json_each(?) candidate
      WHERE anchor.id = ? AND (anchor.meeting_id = ? OR (anchor.meeting_id IS NULL AND anchor.id = ?))
        AND NOT EXISTS (
          SELECT 1 FROM project_proposals
          WHERE (${meetingSlots}) AND duration = ? AND start = json_extract(candidate.value, '$.start')
        )`)
      .bind(meetingId, title, duration, ...urlUpdate, additions, ...anchor, ...group, duration),
    // Promote a legacy single slot to a group without changing its existing link.
    db.prepare(`UPDATE project_proposals SET title = ?, meeting_id = ?, meeting_url = CASE WHEN ? THEN ? ELSE meeting_url END
      WHERE (${meetingSlots}) AND ${sameSlot} AND ${existsAnchor}`)
      .bind(title, meetingId, ...urlUpdate, ...group, duration, candidates, ...anchor),
    db.prepare(`DELETE FROM project_responses WHERE proposal_id IN
      (SELECT id FROM project_proposals WHERE (${meetingSlots}) AND NOT (${sameSlot})) AND ${existsAnchor}`)
      .bind(...group, duration, candidates, ...anchor),
    db.prepare(`DELETE FROM project_proposals WHERE (${meetingSlots}) AND NOT (${sameSlot}) AND ${existsAnchor}`)
      .bind(...group, duration, candidates, ...anchor),
    // Removing an unanswered slot may complete the meeting for the first time.
    // Keep any earlier snapshot to retain one completion notification per meeting.
    queueCompletion(db, id, meetingId),
    db.prepare("SELECT id FROM project_proposals WHERE meeting_id = ? ORDER BY start, id LIMIT 1").bind(meetingId),
  ]);
  return update.meta.changes && current.results[0] ? json({ id: current.results[0].id, meetingId }) : fail("missing", 404);
}

async function deleteMeeting(db: D1Database, id: string, meetingId: string | null) {
  const key = meetingId ?? id;
  const anchor = [id, key, key] as const;
  const [, , , result] = await db.batch([
    db.prepare(`DELETE FROM project_completion_notifications WHERE meeting_id = ? AND ${existsAnchor}`).bind(key, ...anchor),
    db.prepare(`DELETE FROM project_meeting_respondents WHERE meeting_id = ? AND ${existsAnchor}`).bind(key, ...anchor),
    db.prepare(`DELETE FROM project_responses WHERE proposal_id IN
      (SELECT id FROM project_proposals WHERE (${meetingSlots})) AND ${existsAnchor}`).bind(key, key, ...anchor),
    db.prepare(`DELETE FROM project_proposals WHERE (${meetingSlots}) AND ${existsAnchor}`).bind(key, key, ...anchor),
  ]);
  return result.meta.changes ? json({ id, meetingId }) : fail("missing", 404);
}

export async function GET(request: Request) {
  const db = env.DB;
  if (!db) return fail("unavailable", 503);
  const [organizer, member] = await Promise.all([isProjectOrganizer(), getProjectMember(db, request)]);
  if (!organizer && !member) return fail("inviteRequired", 403);

  const [proposals, replies, memberList, profileList, targetList] = await db.batch<ProposalRow | ResponseRow | ProjectMember | ProfileRow | TargetRow>([
    db.prepare("SELECT id, meeting_id, meeting_url, title, proposer_id, start, duration, respondents, confirmed FROM project_proposals ORDER BY start, id"),
    db.prepare("SELECT proposal_id, member_id, choice, availability FROM project_responses"),
    db.prepare("SELECT id, name, token FROM project_members WHERE id <> ? ORDER BY created, name").bind(PROJECT_ORGANIZER_ID),
    db.prepare("SELECT id, avatar, avatar_style, display_name FROM project_profiles"),
    db.prepare("SELECT meeting_id, avatar, member_id FROM project_meeting_respondents ORDER BY avatar"),
  ]);
  const members = (memberList.results ?? []) as ProjectMember[];
  const profiles = new Map((profileList.results as ProfileRow[]).map(profile => [profile.id, profile]));
  const respondents = [...members, organizerRespondent].map(({ id, name }) => ({ id, name: profiles.get(id)?.display_name ?? name }));
  const membersById = new Map(respondents.map(person => [person.id, person]));
  const portraitOwners: ProjectBoard["portraitOwners"] = {};
  for (const person of respondents) {
    const avatar = profiles.get(person.id)?.avatar;
    if (avatar) portraitOwners[avatar] = person;
  }
  const targetsByMeeting = new Map<string, ProjectTargetRespondent[]>();
  for (const { meeting_id, avatar, member_id } of targetList.results as TargetRow[]) {
    const targets = targetsByMeeting.get(meeting_id) ?? [];
    targets.push({ avatar, member: member_id ? membersById.get(member_id) ?? null : null });
    targetsByMeeting.set(meeting_id, targets);
  }
  const profileId = member?.id ?? PROJECT_ORGANIZER_ID;
  const profile = profiles.get(profileId);
  const rows = (replies.results ?? []) as ResponseRow[];
  const proposalRows = proposals.results as ProposalRow[];
  const closedMeetings = new Set(proposalRows.filter(row => row.confirmed).map(row => row.meeting_id ?? row.id));
  const responsesByProposal = new Map<string, Map<string, SavedResponse>>();
  for (const response of rows) {
    const votes = responsesByProposal.get(response.proposal_id) ?? new Map<string, SavedResponse>();
    votes.set(response.member_id, {
      choice: response.choice,
      availability: response.availability === null ? null : JSON.parse(response.availability) as AvailabilityWindow[],
    });
    responsesByProposal.set(response.proposal_id, votes);
  }

  const legacyAudience: NonNullable<ProjectBoard["legacyAudience"]> = {};
  const boardProposals = proposalRows.map(row => {
    const meetingId = row.meeting_id ?? row.id;
    const targets = targetsByMeeting.get(meetingId) ?? [];
    const targetedAvatars = new Map(targets.flatMap(({ avatar, member }) => member ? [[member.id, avatar] as const] : []));
    const invited = new Set(JSON.parse(row.respondents) as string[]);
    const canRespond = (id: string) => targets.length ? targetedAvatars.has(id) : invited.size === 0 || invited.has(id);
    const eligible = respondents.filter(person => canRespond(person.id));
    if (!targets.length && !legacyAudience[meetingId]) {
      const all = invited.size === 0;
      legacyAudience[meetingId] = {
        all,
        members: all ? [] : eligible.map(person => ({ ...person, avatar: profiles.get(person.id)?.avatar ?? null })),
      };
    }
    const votes = responsesByProposal.get(row.id);
    const ownResponse = votes?.get(profileId);
    const manages = canManage(organizer, member, row.proposer_id);
    const viewerEligible = canRespond(profileId);
    const author = profiles.get(row.proposer_id ?? PROJECT_ORGANIZER_ID);
    return {
      id: row.id, meetingId: row.meeting_id, title: row.title, start: row.start, duration: row.duration,
      meetingUrl: manages || (row.confirmed && viewerEligible) ? row.meeting_url : null,
      confirmed: Boolean(row.confirmed), meetingClosed: closedMeetings.has(row.meeting_id ?? row.id),
      proposerName: row.proposer_id ? membersById.get(row.proposer_id)?.name ?? null : author?.display_name ?? null,
      proposerAvatar: author?.avatar ?? null,
      proposerAvatarStyle: author?.avatar_style ?? null,
      canManage: manages,
      eligible: viewerEligible,
      totalRespondents: targets.length || eligible.length,
      ownChoice: ownResponse?.choice ?? null,
      ownAvailability: ownResponse?.availability ?? null,
      responses: eligible.flatMap(person => {
        const response = votes?.get(person.id);
        const responder = profiles.get(person.id);
        return response ? [{ ...person, ...response, avatar: responder?.avatar ?? targetedAvatars.get(person.id) ?? null, avatarStyle: responder?.avatar_style ?? null }] : [];
      }),
      waiting: manages ? eligible.filter(person => !votes?.has(person.id)) : [],
    };
  });
  const data: ProjectBoard = {
    organizer,
    viewerId: profileId,
    memberName: membersById.get(profileId)?.name ?? null,
    profile: profile ? { avatar: profile.avatar, avatarStyle: profile.avatar_style, displayName: profile.display_name } : null,
    takenAvatars: [...profiles.values()].filter(person => person.id !== profileId).map(person => person.avatar),
    portraitOwners,
    meetingAudience: Object.fromEntries(targetsByMeeting),
    legacyAudience,
    members: organizer ? members : [],
    respondents,
    proposals: boardProposals,
  };
  return json(data);
}

export async function POST(request: Request) {
  const db = env.DB;
  if (!db) return fail("unavailable", 503);
  const origin = request.headers.get("Origin");
  if (origin && request.headers.get("Sec-Fetch-Site") !== "same-origin" &&
      URL.parse(origin)?.host !== new URL(request.url).host) return fail("forbidden", 403);
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return fail("invalid", 400);
  const raw = await request.text();
  if (raw.length > 20000) return fail("invalid", 400);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("invalid", 400);
  }
  if (!body || typeof body !== "object") return fail("invalid", 400);

  const [organizer, member] = await Promise.all([isProjectOrganizer(), getProjectMember(db, request)]);
  const actor = member ?? (organizer ? organizerRespondent : null);

  if (body.action === "vote") {
    if (!actor) return fail("inviteRequired", 403);
    if (typeof body.id !== "string" || !uuid.test(body.id) || !choices.includes(body.choice)) return fail("invalid", 400);
    const item = await db.prepare(
      `SELECT respondents, meeting_id,
        EXISTS (SELECT 1 FROM project_meeting_respondents target WHERE target.meeting_id = project_proposals.meeting_id) AS uses_portraits,
        EXISTS (SELECT 1 FROM project_meeting_respondents target WHERE target.meeting_id = project_proposals.meeting_id AND target.member_id = ?) AS selected
       FROM project_proposals WHERE id = ?`
    ).bind(actor.id, body.id).first<Pick<ProposalRow, "respondents" | "meeting_id"> & { uses_portraits: number; selected: number }>();
    if (!item) return fail("missing", 404);
    if (!(item.uses_portraits ? item.selected : allowedMember(item.respondents, actor.id))) return fail("ineligible", 403);
    const availability = body.availability === undefined ? null : readAvailability(body.availability, body.choice);
    if (body.availability !== undefined && availability === null) return fail("invalidAvailability", 400);
    const response: SavedResponse = { choice: body.choice, availability };
    if (body.avatar === undefined) {
      if (body.avatarStyle !== undefined) return fail("invalid", 400);
      if (actor.id === PROJECT_ORGANIZER_ID) await registerOrganizerVoter(db);
      const [result] = await db.batch([
        saveResponse(db, body.id, actor.id, response),
        queueCompletion(db, body.id, item.meeting_id),
      ]);
      return result.meta.changes ? json({ saved: true }) : fail("closed", 409);
    }

    const selectedProfile = readProfile(body.avatar, body.name, body.avatarStyle);
    if (!selectedProfile) return fail("invalid", 400);
    if (actor.id === PROJECT_ORGANIZER_ID) await registerOrganizerVoter(db);
    // D1 runs the batch in one transaction. A closed proposal cannot claim an
    // avatar, and a failed claim cannot save a response with a different profile.
    const [, , result, , state] = await db.batch<{ confirmed: number }>([
      saveProfile(db, actor.id, selectedProfile, body.id),
      claimPendingTargets(db, actor.id, selectedProfile.avatar),
      saveResponse(db, body.id, actor.id, response, selectedProfile),
      queueCompletion(db, body.id, item.meeting_id),
      db.prepare(`SELECT CASE WHEN ${openProposal} THEN 0 ELSE 1 END AS confirmed FROM project_proposals WHERE id = ?`).bind(body.id),
    ]);
    if (result.meta.changes) return json({ saved: true });
    if (!state.results[0]) return fail("missing", 404);
    return fail(state.results[0].confirmed ? "closed" : "avatarTaken", 409);
  }

  if (body.action === "profile") {
    if (!actor) return fail("inviteRequired", 403);
    const selectedProfile = readProfile(body.avatar, body.name, body.avatarStyle);
    if (!selectedProfile) return fail("invalid", 400);
    const [result] = await db.batch([
      saveProfile(db, actor.id, selectedProfile),
      claimPendingTargets(db, actor.id, selectedProfile.avatar),
    ]);
    return result.meta.changes ? json({ saved: true }) : fail("avatarTaken", 409);
  }

  if (body.action === "propose") {
    if (!actor) return fail("inviteRequired", 403);
    const { localTime, windows, zone, duration, respondentAvatars = [] } = body;
    const respondents = body.respondents === undefined && body.respondentAvatars !== undefined ? [] : body.respondents;
    const title = trimmed(body.title);
    if (title.length > 100 || !validZone(zone) ||
        !DURATIONS.includes(duration) || !Array.isArray(respondents) || respondents.some(id => typeof id !== "string" || (id !== PROJECT_ORGANIZER_ID && !uuid.test(id))) ||
        !Array.isArray(respondentAvatars) || respondentAvatars.some(avatar => !AVATAR_IDS.includes(avatar)) ||
        (respondents.length > 0 && respondentAvatars.length > 0)) {
      return fail("invalid", 400);
    }
    const link = readMeetingUrl(body.meetingUrl);
    if (link.error) return fail(link.error, 400);
    const { starts, error } = readCandidateStarts(localTime, windows, zone, duration);
    if (!starts) return fail(error, 400);
    const avatars = [...new Set<ProjectAvatar>(respondentAvatars)];
    const meetingId = windows !== undefined || avatars.length > 0 ? crypto.randomUUID() : null;
    const ids = [...new Set<string>(respondents)];
    if (ids.length) {
      const existing = await db.prepare("SELECT id FROM project_members").all<{ id: string }>();
      const memberIds = new Set(existing.results.map(({ id }) => id));
      memberIds.add(PROJECT_ORGANIZER_ID);
      if (ids.some(id => !memberIds.has(id))) return fail("invalid", 400);
    }
    const slots = starts.map(start => ({ id: crypto.randomUUID(), start }));
    const insertSlots = db.prepare(
      `INSERT INTO project_proposals (id, meeting_id, title, proposer_id, start, duration, respondents, meeting_url)
       SELECT json_extract(value, '$.id'), ?, ?, ?, json_extract(value, '$.start'), ?, ?, ? FROM json_each(?)`
    ).bind(meetingId, title, member?.id ?? null, duration, JSON.stringify(ids), link.meetingUrl ?? null, JSON.stringify(slots));
    if (avatars.length) {
      await db.batch([
        insertSlots,
        db.prepare(
          `INSERT INTO project_meeting_respondents (meeting_id, avatar, member_id)
           SELECT ?, target.value, profile.id FROM json_each(?) target
           LEFT JOIN project_profiles profile ON profile.avatar = target.value`
        ).bind(meetingId, JSON.stringify(avatars)),
      ]);
    } else {
      await insertSlots.run();
    }
    return json({ id: slots[0].id, meetingId }, 201);
  }

  if (body.action === "edit" || body.action === "delete") {
    if (!actor) return fail("inviteRequired", 403);
    const { id } = body;
    if (typeof id !== "string" || !uuid.test(id)) return fail("invalid", 400);
    const anchor = await db.prepare("SELECT proposer_id, meeting_id FROM project_proposals WHERE id = ?")
      .bind(id).first<Pick<ProposalRow, "proposer_id" | "meeting_id">>();
    if (!anchor) return fail("missing", 404);
    if (!canManage(organizer, member, anchor.proposer_id)) return fail("forbidden", 403);
    if (body.action === "delete") return deleteMeeting(db, id, anchor.meeting_id);

    const { duration, windows, zone } = body;
    const title = trimmed(body.title);
    if (title.length > 100 || !validZone(zone) || !DURATIONS.includes(duration) || windows === undefined) {
      return fail("invalid", 400);
    }
    const link = readMeetingUrl(body.meetingUrl);
    if (link.error) return fail(link.error, 400);
    const { starts, error } = readCandidateStarts(undefined, windows, zone, duration);
    if (!starts) return fail(error, 400);
    return editMeeting(db, id, anchor.meeting_id ?? id, title, duration, starts, link.meetingUrl);
  }

  if (body.action === "confirm" || body.action === "reopen") {
    if (!organizer && !member) return fail("inviteRequired", 403);
    if (typeof body.id !== "string" || !uuid.test(body.id)) return fail("invalid", 400);
    const item = await db.prepare("SELECT proposer_id FROM project_proposals WHERE id = ?").bind(body.id).first<{ proposer_id: string | null }>();
    if (!item) return fail("missing", 404);
    if (!canManage(organizer, member, item.proposer_id)) return fail("forbidden", 403);
    if (body.action === "confirm") {
      const result = await db.prepare(`UPDATE project_proposals SET confirmed = 1 WHERE id = ? AND ${openProposal}`).bind(body.id).run();
      if (!result.meta.changes) return fail("closed", 409);
    } else {
      await db.prepare("UPDATE project_proposals SET confirmed = 0 WHERE id = ?").bind(body.id).run();
    }
    return json({ saved: true });
  }

  if (!organizer) return fail("forbidden", 403);

  if (body.action === "member") {
    const name = trimmed(body.name);
    if (!name || name.length > MAX_NAME_LENGTH) return fail("invalid", 400);
    const result = await db.prepare(
      "INSERT INTO project_members (id, name, token, created) VALUES (?, ?, ?, ?) ON CONFLICT(name) DO NOTHING"
    ).bind(crypto.randomUUID(), name, crypto.randomUUID(), Date.now()).run();
    return result.meta.changes ? json({ saved: true }, 201) : fail("duplicateMember", 409);
  }

  return fail("invalid", 400);
}
