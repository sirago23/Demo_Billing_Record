CREATE TABLE `records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`amount_satang` integer NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`merchant` text,
	`note` text,
	`source` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
