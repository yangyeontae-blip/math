CREATE TABLE `expedition_rankings` (
	`player_id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_expedition_rankings_completed` ON `expedition_rankings` (`completed`);
--> statement-breakpoint
PRAGMA optimize;
