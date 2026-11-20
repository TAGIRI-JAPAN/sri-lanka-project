import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import type { ProjectRespondent } from "./project";
import { uuid } from "./schedule";

const guestCookie = "sri_lanka_guest";
export const projectGuestTokenPrefix = "guest-";
export const openProjectProposal = `confirmed = 0 AND (meeting_id IS NULL OR NOT EXISTS (
  SELECT 1 FROM project_proposals chosen WHERE chosen.meeting_id = project_proposals.meeting_id AND chosen.confirmed = 1
))`;

export type ProjectAccessMember = ProjectRespondent & { guest?: boolean };

export async function isProjectOrganizer() {
  const user = await getChatGPTUser();
  const owner = env.PROJECT_OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(owner && user?.email.toLowerCase() === owner);
}

export function readProjectGuestToken(request: Request) {
  const cookies = request.headers.get("Cookie")?.split(";") ?? [];
  const token = cookies.map(cookie => cookie.trim()).find(cookie => cookie.startsWith(guestCookie + "="))
    ?.slice(guestCookie.length + 1);
  return token?.startsWith(projectGuestTokenPrefix) && uuid.test(token.slice(projectGuestTokenPrefix.length)) ? token : null;
}

export function newProjectGuestToken() {
  return projectGuestTokenPrefix + crypto.randomUUID();
}

export function projectGuestCookie(request: Request, token: string) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${guestCookie}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000${secure}`;
}

export async function getProjectMember(db: D1Database, request: Request): Promise<ProjectAccessMember | null> {
  const invitation = request.headers.get("X-Project-Member");
  if (invitation !== null) {
    return uuid.test(invitation)
      ? db.prepare("SELECT id, name FROM project_members WHERE token = ?").bind(invitation).first<ProjectAccessMember>()
      : null;
  }
  if (new URL(request.url).searchParams.get("manage") === "1") return null;
  const token = readProjectGuestToken(request);
  if (!token) return null;
  const member = await db.prepare(
    "SELECT id, name FROM project_members WHERE token = ? AND EXISTS (SELECT 1 FROM project_profiles WHERE id = project_members.id)"
  ).bind(token).first<ProjectRespondent>();
  return member ? { ...member, guest: true } : null;
}
