import { chatGPTSignInPath } from "./chatgpt-auth";
import { isProjectOrganizer } from "@/lib/project-access";
import { ProjectBoard } from "./project-board";
import { ScheduleApp } from "./schedule-app";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ poll?: string | string[]; view?: string }> }) {
  const query = await searchParams;
  if (typeof query.poll === "string" && query.poll) {
    return <ScheduleApp pollId={query.poll} signedIn={false} />;
  }
  if (query.view === "archive") return <ScheduleApp pollId="" signedIn={await isProjectOrganizer()} />;
  return <ProjectBoard signInPath={chatGPTSignInPath("/")} />;
}
