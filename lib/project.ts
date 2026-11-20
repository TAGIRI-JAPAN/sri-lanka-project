import { parseWall, type Choice } from "./schedule";

export const PROJECT_TITLE = "Sri Lankaプロジェクト";
export const PROJECT_ORGANIZER_ID = "organizer";
export const PROJECT_ORGANIZER_NAME = "プロジェクト管理者";
export const PROJECT_COMPLETION_EMAIL = "scheduling@example.com";
export const MAX_PROJECT_SLOTS = 200;
export const AVATAR_IDS = ["01", "02", "03", "04", "05", "06", "09", "07", "08"] as const;
export type ProjectAvatar = typeof AVATAR_IDS[number];
export type ProjectAvatarStyle = "wide" | "kirie";
export type ProjectPortraits = Record<ProjectAvatar, string>;

export function customPortrait(id: ProjectAvatar) {
  return id === "07" || id === "08";
}

export type ProjectProfile = { avatar: ProjectAvatar; avatarStyle: ProjectAvatarStyle; displayName: string | null };

export type ProjectMember = {
  id: string;
  name: string;
  token: string;
};

export type ProjectRespondent = Pick<ProjectMember, "id" | "name">;
export type ProjectTargetRespondent = { avatar: ProjectAvatar; member: ProjectRespondent | null };

export type AvailabilityWindow = { start: number; end: number };
export type CandidateWindow = { date: string; from: string; to: string };

export function expandCandidateWindows(windows: CandidateWindow[], zone: string, duration: number) {
  const starts = new Set<number>();
  const step = duration * 60_000;
  for (const { date, from, to } of windows) {
    const start = parseWall(`${date}T${from}`, zone);
    if (start === null) return { error: "invalidTime" as const };
    let end = start + step;
    if (to) {
      const endDate = to < from
        ? new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
        : date;
      const rangeEnd = parseWall(`${endDate}T${to}`, zone);
      if (rangeEnd === null || rangeEnd === start) return { error: "invalidTime" as const };
      if (rangeEnd - start < step) return { error: "shortWindow" as const };
      end = rangeEnd;
    }
    for (let slot = start; slot + step <= end; slot += step) {
      starts.add(slot);
      if (starts.size > MAX_PROJECT_SLOTS) return { error: "tooManySlots" as const };
    }
  }
  return { starts: [...starts].sort((a, b) => a - b) };
}

export type Proposal = {
  id: string;
  meetingId: string | null;
  meetingUrl: string | null;
  title: string;
  proposerName: string | null;
  proposerAvatar: ProjectAvatar | null;
  proposerAvatarStyle: ProjectAvatarStyle | null;
  start: number;
  duration: number;
  confirmed: boolean;
  meetingClosed: boolean;
  canManage: boolean;
  eligible: boolean;
  totalRespondents: number;
  ownChoice: Choice | null;
  ownAvailability: AvailabilityWindow[] | null;
  responses: (ProjectRespondent & {
    choice: Choice;
    avatar: ProjectAvatar | null;
    avatarStyle: ProjectAvatarStyle | null;
    availability: AvailabilityWindow[] | null;
  })[];
  waiting: ProjectRespondent[];
};

export type ProjectBoard = {
  organizer: boolean;
  viewerId: string;
  memberName: string | null;
  profile: ProjectProfile | null;
  takenAvatars: ProjectAvatar[];
  portraitOwners: Partial<Record<ProjectAvatar, ProjectRespondent>>;
  meetingAudience: Record<string, ProjectTargetRespondent[]>;
  legacyAudience?: Record<string, { all: boolean; members: (ProjectRespondent & { avatar: ProjectAvatar | null })[] }>;
  members: ProjectMember[];
  respondents: ProjectRespondent[];
  proposals: Proposal[];
};
