import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const polls = sqliteTable("polls", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  title: text("title").notNull(),
  note: text("note").notNull(),
  organizerZone: text("organizer_zone").notNull(),
  partnerZone: text("partner_zone").notNull(),
  duration: integer("duration").notNull(),
  slots: text("slots").notNull(),
  invitees: text("invitees").notNull().default("[]"),
  finalSlot: integer("final_slot"),
  created: integer("created").notNull(),
}, table => [index("polls_owner_created").on(table.owner, table.created)]);

export const responses = sqliteTable("responses", {
  pollId: text("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  voter: text("voter").notNull(),
  name: text("name").notNull(),
  votes: text("votes").notNull(),
  created: integer("created").notNull(),
}, table => [primaryKey({ columns: [table.pollId, table.voter] })]);

export const projectMembers = sqliteTable("project_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  token: text("token").notNull().unique(),
  created: integer("created").notNull(),
});

export const proposals = sqliteTable("project_proposals", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id"),
  meetingUrl: text("meeting_url"),
  title: text("title").notNull(),
  proposerId: text("proposer_id").references(() => projectMembers.id),
  start: integer("start").notNull(),
  duration: integer("duration").notNull(),
  respondents: text("respondents").notNull().default("[]"),
  confirmed: integer("confirmed").notNull().default(0),
}, table => [
  index("project_proposals_start").on(table.start),
  index("project_proposals_meeting").on(table.meetingId),
]);

export const projectResponses = sqliteTable("project_responses", {
  proposalId: text("proposal_id").notNull().references(() => proposals.id),
  memberId: text("member_id").notNull().references(() => projectMembers.id),
  choice: text("choice").notNull(),
  availability: text("availability"),
}, table => [primaryKey({ columns: [table.proposalId, table.memberId] })]);

export const projectProfiles = sqliteTable("project_profiles", {
  id: text("id").primaryKey(),
  avatar: text("avatar").notNull(),
  avatarStyle: text("avatar_style", { enum: ["wide", "kirie"] }).notNull().default("wide"),
  displayName: text("display_name"),
}, table => [index("project_profiles_avatar_idx").on(table.avatar)]);

export const projectMeetingRespondents = sqliteTable("project_meeting_respondents", {
  meetingId: text("meeting_id").notNull(),
  avatar: text("avatar").notNull(),
  memberId: text("member_id").references(() => projectProfiles.id),
}, table => [
  primaryKey({ columns: [table.meetingId, table.avatar] }),
  uniqueIndex("project_meeting_respondents_member").on(table.memberId, table.meetingId),
]);

export const projectCompletionNotifications = sqliteTable("project_completion_notifications", {
  meetingId: text("meeting_id").primaryKey().notNull(),
  recipient: text("recipient").notNull(),
  title: text("title").notNull(),
  candidateCount: integer("candidate_count").notNull(),
  allYesCount: integer("all_yes_count").notNull(),
  topSlots: text("top_slots").notNull(),
  completedAt: integer("completed_at").notNull(),
});
