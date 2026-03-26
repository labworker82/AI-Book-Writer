ALTER TABLE `app_settings` MODIFY COLUMN `textModel` varchar(128) NOT NULL DEFAULT 'gpt-4o';--> statement-breakpoint
ALTER TABLE `app_settings` ADD `openrouterApiKey` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `apiProvider` varchar(32) DEFAULT 'openai' NOT NULL;