CREATE TABLE `boss_progress` (
	`class_code` text NOT NULL,
	`week` text NOT NULL,
	`player_id` text NOT NULL,
	`damage` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`class_code`, `week`, `player_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_boss_progress_class_week` ON `boss_progress` (`class_code`,`week`);