CREATE TABLE `project_completion_notifications` (
	`meeting_id` text PRIMARY KEY NOT NULL,
	`recipient` text NOT NULL,
	`title` text NOT NULL,
	`candidate_count` integer NOT NULL,
	`all_yes_count` integer NOT NULL,
	`top_slots` text NOT NULL,
	`completed_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `project_proposals` ADD `meeting_id` text;--> statement-breakpoint
CREATE INDEX `project_proposals_meeting` ON `project_proposals` (`meeting_id`);