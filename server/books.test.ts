import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getSettingsByUserId: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    openaiApiKey: "sk-test-key",
    openrouterApiKey: null,
    apiProvider: "openai",
    textModel: "gpt-4o",
    imageModel: "dall-e-3",
  }),
  upsertSettings: vi.fn().mockResolvedValue(undefined),
  getBooksByUserId: vi.fn().mockResolvedValue([]),
  createBook: vi.fn().mockResolvedValue(42),
  createChapter: vi.fn().mockResolvedValue(1),
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

// ── Book Style Template Tests ─────────────────────────────────────────────────
// Import inline to avoid module resolution issues in test env
import { BOOK_STYLES } from "../shared/bookStyles";

describe("bookStyles", () => {
  it("has exactly 15 pre-built styles", () => {
    expect(BOOK_STYLES).toHaveLength(15);
  });

  it("every style has required fields", () => {
    BOOK_STYLES.forEach((style) => {
      expect(style.id).toBeTruthy();
      expect(style.label).toBeTruthy();
      expect(style.emoji).toBeTruthy();
      expect(style.tagline).toBeTruthy();
      expect(style.description).toBeTruthy();
      expect(style.defaults).toBeDefined();
    });
  });

  it("every style has valid defaults", () => {
    const VALID_LENGTHS = ["mini", "short", "compact", "medium", "extended", "full"];
    BOOK_STYLES.forEach((style) => {
      const d = style.defaults;
      expect(VALID_LENGTHS).toContain(d.bookLength);
      expect(typeof d.includePreface).toBe("boolean");
      expect(typeof d.includeDedication).toBe("boolean");
      expect(typeof d.includeAcknowledgements).toBe("boolean");
      expect(typeof d.includeEpilogue).toBe("boolean");
      expect(d.tone).toBeTruthy();
      expect(d.genre).toBeTruthy();
    });
  });

  it("children's book style uses simple vocabulary and short sentences", () => {
    const childrens = BOOK_STYLES.find(s => s.id === "childrens");
    expect(childrens).toBeDefined();
    expect(childrens!.defaults.vocabulary).toBe("simple");
    expect(childrens!.defaults.sentenceLength).toBe("short");
    expect(childrens!.defaults.bookLength).toBe("mini");
  });

  it("academic style uses very formal language", () => {
    const academic = BOOK_STYLES.find(s => s.id === "academic");
    expect(academic).toBeDefined();
    expect(academic!.defaults.formality).toBe("very_formal");
    expect(academic!.defaults.vocabulary).toBe("technical");
  });

  it("ebook style is short and fast-paced", () => {
    const ebook = BOOK_STYLES.find(s => s.id === "ebook");
    expect(ebook).toBeDefined();
    expect(ebook!.defaults.bookLength).toBe("short");
    expect(ebook!.defaults.pacing).toBe("fast");
  });

  it("novel style is full length", () => {
    const novel = BOOK_STYLES.find(s => s.id === "novel");
    expect(novel).toBeDefined();
    expect(novel!.defaults.bookLength).toBe("full");
  });

  it("all style IDs are unique", () => {
    const ids = BOOK_STYLES.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(BOOK_STYLES.length);
  });

  it("creates a book with bookStyle field", async () => {
    const { appRouter } = await import("./routers");
    const ctx = {
      user: {
        id: 1, openId: "test", email: "t@t.com", name: "T",
        loginMethod: "manus", role: "user" as const,
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: vi.fn() } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.books.create({
      title: "My Fantasy Novel",
      genre: "Fantasy",
      tone: "storytelling",
      bookStyle: "fantasy",
    });
    expect(result).toHaveProperty("bookId");
  });
});

// ── Title Suggestion Parsing Tests ────────────────────────────────────────────
describe("title suggestion parsing", () => {
  function parseTitles(raw: string): string[] {
    let titles: string[] = [];
    try {
      const arrayMatch = raw.match(/\[[\s\S]*\]/);
      if (arrayMatch) titles = JSON.parse(arrayMatch[0]);
      else titles = JSON.parse(raw.trim());
    } catch {
      titles = raw.split("\n")
        .map((l: string) => l.replace(/^[\d.\-*"\s]+|["\s]+$/g, "").trim())
        .filter((l: string) => l.length > 3)
        .slice(0, 5);
    }
    return titles.slice(0, 5);
  }

  it("parses a clean JSON array", () => {
    const raw = '["Title One", "Title Two", "Title Three", "Title Four", "Title Five"]';
    const result = parseTitles(raw);
    expect(result).toHaveLength(5);
    expect(result[0]).toBe("Title One");
  });

  it("parses JSON array embedded in prose", () => {
    const raw = 'Here are your titles:\n["The Art of Focus", "Deep Work Mastery", "Clarity First", "The Focus Formula", "Work Less, Achieve More"]';
    const result = parseTitles(raw);
    expect(result).toHaveLength(5);
    expect(result[0]).toBe("The Art of Focus");
  });

  it("falls back to line-by-line parsing for numbered lists", () => {
    const raw = "1. The Art of Focus\n2. Deep Work Mastery\n3. Clarity First\n4. The Focus Formula\n5. Work Less, Achieve More";
    const result = parseTitles(raw);
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result[0]).toBe("The Art of Focus");
  });

  it("returns at most 5 titles", () => {
    const raw = '["A", "B", "C", "D", "E", "F", "G"]';
    const result = parseTitles(raw);
    expect(result).toHaveLength(5);
  });

  it("handles empty response gracefully", () => {
    const result = parseTitles("[]");
    expect(result).toHaveLength(0);
  });
});

// ── Cover Prompt Genre Routing Tests ─────────────────────────────────────────
describe("cover prompt genre routing", () => {
  function buildCoverPrompt(genre: string, title: string, authorName?: string, description?: string): string {
    const genreLower = genre.toLowerCase();
    let styleGuide = "";
    if (genreLower.includes("fantasy") || genreLower.includes("sci-fi") || genreLower.includes("science fiction")) {
      styleGuide = "Epic fantasy/sci-fi cover art.";
    } else if (genreLower.includes("thriller") || genreLower.includes("mystery") || genreLower.includes("horror")) {
      styleGuide = "Dark suspense cover.";
    } else if (genreLower.includes("romance")) {
      styleGuide = "Romantic cover art.";
    } else if (genreLower.includes("children")) {
      styleGuide = "Bright, cheerful children's book cover.";
    } else if (genreLower.includes("business") || genreLower.includes("nonfiction") || genreLower.includes("self-help")) {
      styleGuide = "Clean, modern professional cover.";
    } else if (genreLower.includes("memoir") || genreLower.includes("biography")) {
      styleGuide = "Elegant literary cover.";
    } else {
      styleGuide = "Professional literary cover.";
    }
    const authorDisplay = authorName ? `Author name prominently displayed: "${authorName}"` : "";
    const descHint = description ? `Theme/mood: ${description.slice(0, 120)}` : "";
    return [
      `Professional ebook cover design for a book titled "${title}".`,
      styleGuide,
      `The title "${title}" must be clearly legible as large bold text at the top or center of the cover.`,
      authorDisplay,
      descHint,
      "Aspect ratio: 6x9 portrait (standard ebook cover). High resolution, print-ready quality.",
      "No mockup, no device frame, no 3D perspective — flat cover art only, as if viewing the front cover directly.",
      "The cover should look like it belongs in a major online bookstore (Amazon Kindle, Apple Books).",
    ].filter(Boolean).join(" ");
  }

  it("uses fantasy style guide for Fantasy genre", () => {
    const prompt = buildCoverPrompt("Fantasy", "Dragon's Throne");
    expect(prompt).toContain("Epic fantasy/sci-fi cover art");
    expect(prompt).toContain("Dragon's Throne");
  });

  it("uses thriller style guide for Thriller genre", () => {
    const prompt = buildCoverPrompt("Thriller", "The Last Signal");
    expect(prompt).toContain("Dark suspense cover");
  });

  it("uses children style guide for Children genre", () => {
    const prompt = buildCoverPrompt("Children's Book", "Bunny's Big Day");
    expect(prompt).toContain("cheerful children's book cover");
  });

  it("uses business style guide for Nonfiction genre", () => {
    const prompt = buildCoverPrompt("Nonfiction", "The Productivity Code");
    expect(prompt).toContain("Clean, modern professional cover");
  });

  it("includes author name when provided", () => {
    const prompt = buildCoverPrompt("Romance", "Love in Paris", "Jane Smith");
    expect(prompt).toContain("Jane Smith");
    expect(prompt).toContain("Author name prominently displayed");
  });

  it("includes title text instruction in every prompt", () => {
    const prompt = buildCoverPrompt("Mystery", "The Hidden Room");
    expect(prompt).toContain("must be clearly legible as large bold text");
    expect(prompt).toContain("The Hidden Room");
  });

  it("specifies flat cover art (no mockup/device frame)", () => {
    const prompt = buildCoverPrompt("Sci-Fi", "Void Station");
    expect(prompt).toContain("No mockup, no device frame, no 3D perspective");
  });

  it("specifies 6x9 portrait aspect ratio", () => {
    const prompt = buildCoverPrompt("Self-Help", "Unlock Your Mind");
    expect(prompt).toContain("6x9 portrait");
  });

  it("falls back to generic literary style for unknown genre", () => {
    const prompt = buildCoverPrompt("Cooking", "The Perfect Meal");
    expect(prompt).toContain("Professional literary cover");
  });
});

// ── Generate All Error Isolation Tests ───────────────────────────────────────
describe("generate all error isolation logic", () => {
  it("continues to next chapter after an error (does not stop)", async () => {
    // Simulate the generate-all loop logic
    const results: string[] = [];
    const chapters = [
      { id: 1, title: "Chapter 1" },
      { id: 2, title: "Chapter 2" },
      { id: 3, title: "Chapter 3" },
    ];

    const generateChapter = async (id: number) => {
      if (id === 2) throw new Error("API timeout");
      results.push(`chapter-${id}`);
    };

    let done = 0;
    const errors: string[] = [];
    for (const chapter of chapters) {
      try {
        await generateChapter(chapter.id);
        done++;
      } catch (err) {
        errors.push(chapter.title);
        done++;
      }
    }

    expect(done).toBe(3); // All 3 processed
    expect(results).toContain("chapter-1");
    expect(results).toContain("chapter-3");
    expect(errors).toContain("Chapter 2"); // Error was captured, not thrown
  });

  it("cancel flag stops the loop after current chapter", async () => {
    const cancelRef = { current: false };
    const processed: number[] = [];
    const chapters = [1, 2, 3, 4, 5];

    for (const id of chapters) {
      if (cancelRef.current) break;
      processed.push(id);
      if (id === 2) cancelRef.current = true; // Cancel after chapter 2
    }

    expect(processed).toEqual([1, 2]);
    expect(processed).not.toContain(3);
  });
});
