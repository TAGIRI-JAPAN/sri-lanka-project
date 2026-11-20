CREATE TABLE `polls` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`note` text NOT NULL,
	`organizer_zone` text NOT NULL,
	`partner_zone` text NOT NULL,
	`duration` integer NOT NULL,
	`slots` text NOT NULL,
	`final_slot` integer,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `polls_owner_created` ON `polls` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `responses` (
	`poll_id` text NOT NULL,
	`voter` text NOT NULL,
	`name` text NOT NULL,
	`votes` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`poll_id`, `voter`),
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE cascade
);
