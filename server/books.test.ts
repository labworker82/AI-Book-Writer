import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getSettingsByUserId: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    openaiApiKey: "sk-test-key",
    textModel: "gpt-4o",
    imageModel: "gpt-image-1",
  }),
  upsertSettings: vi.fn().mockResolvedValue(undefined),
  getBooksByUserId: vi.fn().mockResolvedValue([]),
  createBook: vi.fn().mockResolvedValue({ id: 1 }),
  getBookById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    title: "Test Book",
    genre: "Nonfiction",
    outline: [],
    status: "draft",
    wordCount: 0,
    totalChapters: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateBook: vi.fn().mockResolvedValue(undefined),
  deleteBook: vi.fn().mockResolvedValue(undefined),
  getChaptersByBookId: vi.fn().mockResolvedValue([]),
  createChapters: vi.fn().mockResolvedValue(undefined),
  getChapterById: vi.fn().mockResolvedValue(null),
  updateChapter: vi.fn().mockResolvedValue(undefined),
  getImagesByBookId: vi.fn().mockResolvedValue([]),
  createBookImage: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("settings", () => {
  it("returns settings for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.get();
    expect(result).toHaveProperty("hasApiKey");
    expect(result.textModel).toBeDefined();
    expect(result.imageModel).toBeDefined();
  });
});

describe("books", () => {
  it("returns empty book list for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const books = await caller.books.list();
    expect(Array.isArray(books)).toBe(true);
    expect(books.length).toBe(0);
  });

  it("creates a book and returns bookId", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.books.create({
      title: "My Test Book",
      genre: "Nonfiction",
      tone: "Professional",
    });
    expect(result).toHaveProperty("bookId");
    expect(result.bookId).toBeDefined();
  });

  it("gets a book by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const book = await caller.books.get({ bookId: 1 });
    expect(book).toBeDefined();
    expect(book?.title).toBe("Test Book");
  });

  it("deletes a book", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.books.delete({ bookId: 1 });
    expect(result).toHaveProperty("success", true);
  });
});

describe("chapters", () => {
  it("returns empty chapter list for new book", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const chapters = await caller.chapters.list({ bookId: 1 });
    expect(Array.isArray(chapters)).toBe(true);
  });
});
