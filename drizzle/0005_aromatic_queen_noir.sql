CREATE TABLE `community_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`hits` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_community_limit_bucket` ON `community_limits` (`bucket`);--> statement-breakpoint
CREATE TABLE `community_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`expires_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_community_room_expiry` ON `community_rooms` (`expires_at`);