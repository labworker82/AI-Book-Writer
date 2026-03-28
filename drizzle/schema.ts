import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// App settings (API keys, model preferences) stored per user
export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  openaiApiKey: text("openaiApiKey"),
  openrouterApiKey: text("openrouterApiKey"),
  apiProvider: varchar("apiProvider", { length: 32 }).default("openai").notNull(),
  textModel: varchar("textModel", { length: 128 }).default("gpt-4o").notNull(),
  imageModel: varchar("imageModel", { length: 64 }).default("gpt-image-1").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppSettings = typeof appSettings.$inferSelect;

export type ChapterOutline = {
  chapterNumber: number;
  title: string;
  summary: string;
  type: "preface" | "dedication" | "chapter" | "epilogue" | "acknowledgements";
};

// Books table
export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  genre: varchar("genre", { length: 128 }),
  subgenre: varchar("subgenre", { length: 128 }),
  tone: varchar("tone", { length: 128 }),
  targetAudience: text("targetAudience"),
  authorName: varchar("authorName", { length: 256 }),
  writingStyle: text("writingStyle"),
  customKnowledge: text("customKnowledge"),
  outline: json("outline").$type<ChapterOutline[]>(),
  premise: text("premise"),
  themes: text("themes"),
  coverImageUrl: text("coverImageUrl"),
  status: mysqlEnum("status", ["draft", "generating", "complete"]).default("draft").notNull(),
  wordCount: int("wordCount").default(0),
  totalChapters: int("totalChapters").default(0),
  targetWordCount: int("targetWordCount").default(30000),
  suggestedChapters: int("suggestedChapters").default(15),
  bookStyle: varchar("bookStyle", { length: 64 }),
  includePreface: boolean("includePreface").default(false),
  includeDedication: boolean("includeDedication").default(false),
  includeAcknowledgements: boolean("includeAcknowledgements").default(false),
  includeEpilogue: boolean("includeEpilogue").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

// Chapters table
export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  bookId: int("bookId").notNull(),
  userId: int("userId").notNull(),
  chapterNumber: int("chapterNumber").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  type: mysqlEnum("type", ["preface", "dedication", "chapter", "epilogue", "acknowledgements"]).default("chapter").notNull(),
  content: text("content"),
  summary: text("summary"),
  wordCount: int("wordCount").default(0),
  status: mysqlEnum("status", ["pending", "generating", "complete", "error"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;

// Generated images table
export const bookImages = mysqlTable("book_images", {
  id: int("id").autoincrement().primaryKey(),
  bookId: int("bookId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["cover", "chapter", "illustration"]).default("illustration").notNull(),
  prompt: text("prompt"),
  imageUrl: text("imageUrl"),
  chapterId: int("chapterId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BookImage = typeof bookImages.$inferSelect;