CREATE TABLE `christmas_pets` (
	`id` text PRIMARY KEY NOT NULL,
	`claimed_at` integer NOT NULL,
	`hatch_at` integer NOT NULL,
	`hatched_at` integer
);

--> statement-breakpoint
INSERT INTO christmas_pets (id,claimed_at,hatch_at,hatched_at)
SELECT id,unixepoch()*1000,unixepoch()*1000,unixepoch()*1000 FROM christmas_wallets WHERE fed>0;
