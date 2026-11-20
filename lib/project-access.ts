import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import type { ProjectRespondent } from "./project";
import { uuid } from "./schedule";

export async function isProjectOrganizer() {
  const user = await getChatGPTUser();
  const owner = env.PROJECT_OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(owner && user?.email.toLowerCase() === owner);
}

export function getProjectMember(db: D1Database, request: Request) {
  const token = request.headers.get("X-Project-Member") ?? "";
  return uuid.test(token)
    ? db.prepare("SELECT id, name FROM project_members WHERE token = ?").bind(token).first<ProjectRespondent>()
    : null;
}
