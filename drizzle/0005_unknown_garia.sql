ALTER TABLE `app_settings` ADD `penName` varchar(256);--> statement-breakpoint
ALTER TABLE `app_settings` ADD `authorBio` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `includeAuthorInPrompts` boolean DEFAULT false NOT NULL;