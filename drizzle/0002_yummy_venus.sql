CREATE TABLE `project_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_members_name_unique` ON `project_members` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_members_token_unique` ON `project_members` (`token`);--> statement-breakpoint
CREATE TABLE `project_responses` (
	`proposal_id` text NOT NULL,
	`member_id` text NOT NULL,
	`choice` text NOT NULL,
	PRIMARY KEY(`proposal_id`, `member_id`),
	FOREIGN KEY (`proposal_id`) REFERENCES `project_proposals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `project_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`start` integer NOT NULL,
	`duration` integer NOT NULL,
	`respondents` text DEFAULT '[]' NOT NULL,
	`confirmed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `project_proposals_start` ON `project_proposals` (`start`);