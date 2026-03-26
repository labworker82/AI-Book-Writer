import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  books,
  chapters,
  bookImages,
  appSettings,
  InsertBook,
  InsertChapter,
  Book,
  Chapter,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export async function getSettingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(appSettings).where(eq(appSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertSettings(userId: number, data: {
  openaiApiKey?: string;
  textModel?: string;
  imageModel?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const existing = await getSettingsByUserId(userId);
  if (existing) {
    await db.update(appSettings).set(data).where(eq(appSettings.userId, userId));
  } else {
    await db.insert(appSettings).values({ userId, ...data });
  }
}

// ─── Books ────────────────────────────────────────────────────────────────────

export async function getBooksByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(books).where(eq(books.userId, userId)).orderBy(desc(books.updatedAt));
}

export async function getBookById(bookId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createBook(data: InsertBook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(books).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateBook(bookId: number, userId: number, data: Partial<Book>) {
  const db = await getDb();
  if (!db) return;
  await db.update(books).set(data).where(and(eq(books.id, bookId), eq(books.userId, userId)));
}

export async function deleteBook(bookId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chapters).where(eq(chapters.bookId, bookId));
  await db.delete(bookImages).where(eq(bookImages.bookId, bookId));
  await db.delete(books).where(and(eq(books.id, bookId), eq(books.userId, userId)));
}

// ─── Chapters ─────────────────────────────────────────────────────────────────

export async function getChaptersByBookId(bookId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
    .orderBy(chapters.chapterNumber);
}

export async function getChapterById(chapterId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createChapter(data: InsertChapter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chapters).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateChapter(chapterId: number, userId: number, data: Partial<Chapter>) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(chapters)
    .set(data)
    .where(and(eq(chapters.id, chapterId), eq(chapters.userId, userId)));
}

export async function deleteChaptersByBookId(bookId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chapters).where(eq(chapters.bookId, bookId));
}

// ─── Book Images ──────────────────────────────────────────────────────────────

export async function getImagesByBookId(bookId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookImages).where(eq(bookImages.bookId, bookId)).orderBy(desc(bookImages.createdAt));
}

export async function createBookImage(data: {
  bookId: number;
  userId: number;
  type: "cover" | "chapter" | "illustration";
  prompt: string;
  imageUrl: string;
  chapterId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookImages).values(data);
  return (result[0] as any).insertId as number;
}
