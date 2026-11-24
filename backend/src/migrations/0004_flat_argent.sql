CREATE TABLE `christmas_feed_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign` text NOT NULL,
	`wallet` text NOT NULL,
	`player` text NOT NULL,
	`phiz_id` text NOT NULL,
	`phiz_key` text NOT NULL,
	`day` text NOT NULL,
	`task` text NOT NULL,
	`details` text NOT NULL,
	`proofs` text NOT NULL,
	`reward` integer NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`attempts` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `christmas_feed_tasks_wallet_day_idx` ON `christmas_feed_tasks` (`wallet`,`day`);--> statement-breakpoint
CREATE INDEX `christmas_feed_tasks_review_idx` ON `christmas_feed_tasks` (`campaign`,`status`,`updated`);--> statement-breakpoint
CREATE TABLE `christmas_phiz_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign` text NOT NULL,
	`player` text NOT NULL,
	`phiz_id` text NOT NULL,
	`phiz_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `christmas_phiz_profiles_phiz_key_unique` ON `christmas_phiz_profiles` (`phiz_key`);--> statement-breakpoint
CREATE TABLE `christmas_task_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`submission` text NOT NULL,
	`action` text NOT NULL,
	`note` text NOT NULL,
	`created` integer NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `christmas_task_audit_submission_idx` ON `christmas_task_audit` (`submission`,`created`);