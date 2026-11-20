import { env } from "cloudflare:workers";
import { getProjectMember, isProjectOrganizer } from "@/lib/project-access";
import { kiriePortraits, portraits } from "@/lib/project-portraits";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = env.DB;
  const headers = { "Cache-Control": "private, no-store" };
  if (!db) return Response.json({ error: "unavailable" }, { status: 503, headers });
  const [organizer, member] = await Promise.all([isProjectOrganizer(), getProjectMember(db, request)]);
  if (!organizer && !member) return Response.json({ error: "inviteRequired" }, { status: 403, headers });
  const style = new URL(request.url).searchParams.get("style");
  return Response.json(style === "kirie" ? kiriePortraits : portraits, { headers });
}
