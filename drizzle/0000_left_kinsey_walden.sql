CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`occurs_at` integer,
	`trip_id` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`url` text,
	`trip_id` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`is_invited` integer DEFAULT false,
	`is_confirmed` integer DEFAULT false,
	`is_owner` integer DEFAULT false,
	`trip_id` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`destination` text,
	`starts_at` integer,
	`ends_at` integer,
	`is_confirmed` integer DEFAULT false,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `links_url_unique` ON `links` (`url`);