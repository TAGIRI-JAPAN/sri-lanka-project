CREATE TABLE `project_meeting_respondents` (
	`meeting_id` text NOT NULL,
	`avatar` text NOT NULL,
	`member_id` text,
	PRIMARY KEY(`meeting_id`, `avatar`),
	FOREIGN KEY (`member_id`) REFERENCES `project_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_meeting_respondents_member` ON `project_meeting_respondents` (`member_id`,`meeting_id`);