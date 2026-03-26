CREATE TABLE `app_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`openaiApiKey` text,
	`textModel` varchar(64) NOT NULL DEFAULT 'gpt-4o',
	`imageModel` varchar(64) NOT NULL DEFAULT 'gpt-image-1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('cover','chapter','illustration') NOT NULL DEFAULT 'illustration',
	`prompt` text,
	`imageUrl` text,
	`chapterId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `book_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`genre` varchar(128),
	`subgenre` varchar(128),
	`tone` varchar(128),
	`targetAudience` text,
	`authorName` varchar(256),
	`writingStyle` text,
	`customKnowledge` text,
	`outline` json,
	`premise` text,
	`themes` text,
	`coverImageUrl` text,
	`status` enum('draft','generating','complete') NOT NULL DEFAULT 'draft',
	`wordCount` int DEFAULT 0,
	`totalChapters` int DEFAULT 0,
	`includePreface` boolean DEFAULT false,
	`includeDedication` boolean DEFAULT false,
	`includeAcknowledgements` boolean DEFAULT false,
	`includeEpilogue` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `books_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookId` int NOT NULL,
	`userId` int NOT NULL,
	`chapterNumber` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`type` enum('preface','dedication','chapter','epilogue','acknowledgements') NOT NULL DEFAULT 'chapter',
	`content` text,
	`summary` text,
	`wordCount` int DEFAULT 0,
	`status` enum('pending','generating','complete','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`)
);
