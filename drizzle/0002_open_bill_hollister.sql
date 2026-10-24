CREATE TABLE `feedback_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`hits` integer DEFAULT 1 NOT NULL
);
