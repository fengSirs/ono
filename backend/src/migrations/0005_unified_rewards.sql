ALTER TABLE `christmas_feed_tasks` ADD `reward_rule` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `christmas_ledger` ADD `details` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE INDEX `christmas_ledger_wallet_kind_created_idx` ON `christmas_ledger` (`wallet`,`kind`,`created`);