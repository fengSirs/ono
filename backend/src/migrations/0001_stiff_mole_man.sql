CREATE TABLE `christmas_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign` text NOT NULL,
	`wallet` text NOT NULL,
	`player` text NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`contact_key` text NOT NULL,
	`status` text NOT NULL,
	`tracking` text,
	`note` text,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `christmas_claims_wallet_unique` ON `christmas_claims` (`wallet`);--> statement-breakpoint
CREATE UNIQUE INDEX `christmas_claims_contact_key_unique` ON `christmas_claims` (`contact_key`);--> statement-breakpoint
CREATE TABLE `christmas_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet` text NOT NULL,
	`campaign` text NOT NULL,
	`player` text NOT NULL,
	`kind` text NOT NULL,
	`points_delta` integer NOT NULL,
	`feed_delta` integer NOT NULL,
	`fed_delta` integer NOT NULL,
	`wallet_version` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `christmas_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `christmas_wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign` text NOT NULL,
	`player` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`feed` integer DEFAULT 0 NOT NULL,
	`fed` integer DEFAULT 0 NOT NULL,
	`earned` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
