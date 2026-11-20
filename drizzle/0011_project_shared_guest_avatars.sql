DROP INDEX `project_profiles_avatar_unique`;--> statement-breakpoint
CREATE INDEX `project_profiles_avatar_idx` ON `project_profiles` (`avatar`);