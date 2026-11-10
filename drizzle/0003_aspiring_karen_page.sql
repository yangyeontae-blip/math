CREATE TABLE `account_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`hits` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_account_limit_bucket` ON `account_limits` (`bucket`);--> statement-breakpoint
CREATE TABLE `adventure_accounts` (
	`username` text PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`recovery_hash` text NOT NULL,
	`snapshot` text,
	`previous_snapshot` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `adventure_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_adventure_session_expiry` ON `adventure_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_adventure_session_user` ON `adventure_sessions` (`username`);