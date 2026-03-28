import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getSettingsByUserId,
  upsertSettings,
  getBooksByUserId,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getChaptersByBookId,
  getChapterById,
  createChapter,
  updateChapter,
  getImagesByBookId,
  createBookImage,
} from "./db";
import { generateBookContent } from "./bookGenerator";
import { storagePut } from "./storage";

// Generate an image using the user's own OpenAI API key and selected model
async function generateImageWithUserKey(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  // gpt-image-1 uses the new images/generations endpoint
  const isGptImage = model === "gpt-image-1";
  const isDalle3 = model === "dall-e-3";
  const isDalle2 = model === "dall-e-2";

  const url = "https://api.openai.com/v1/images/generations";

  const body: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
  };

  if (isGptImage) {
    body.size = "1024x1024";
    body.quality = "standard";
    body.output_format = "png";
  } else if (isDalle3) {
    body.size = "1024x1024";
    body.quality = "standard";
    body.response_format = "b64_json";
  } else {
    // dall-e-2
    body.size = "512x512";
    body.response_format = "b64_json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Image generation failed: ${response.status} - ${err}`);
  }

  const data = (await response.json()) as any;
  const item = data.data?.[0];
  if (!item) throw new Error("No image returned from OpenAI");

  // gpt-image-1 returns b64_json directly
  if (item.b64_json) {
    const buffer = Buffer.from(item.b64_json, "base64");
    const { url: storedUrl } = await storagePut(
      `book-images/${Date.now()}.png`,
      buffer,
      "image/png"
    );
    return storedUrl;
  }

  // If URL returned (dall-e-3 with url format)
  if (item.url) {
    return item.url;
  }

  throw new Error("Unexpected image response format from OpenAI");
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getSettingsByUserId(ctx.user.id);
      if (!settings) return {
        hasApiKey: false,
        hasOpenRouterKey: false,
        apiProvider: "openrouter",
        textModel: "anthropic/claude-3.5-sonnet",
        imageModel: "dall-e-3",
        openaiApiKey: null,
        openrouterApiKey: null,
      };
      return {
        ...settings,
        openaiApiKey: settings.openaiApiKey ? "sk-..." + settings.openaiApiKey.slice(-4) : null,
        openrouterApiKey: settings.openrouterApiKey ? "sk-or-..." + settings.openrouterApiKey.slice(-4) : null,
        hasApiKey: !!settings.openaiApiKey,
        hasOpenRouterKey: !!settings.openrouterApiKey,
      };
    }),

    save: protectedProcedure
      .input(z.object({
        openaiApiKey: z.string().optional(),
        openrouterApiKey: z.string().optional(),
        apiProvider: z.enum(["openai", "openrouter"]).optional(),
        textModel: z.string().optional(),
        imageModel: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),

  books: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getBooksByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getBookById(input.bookId, ctx.user.id);
      }),

    suggestTitles: protectedProcedure
      .input(z.object({
        description: z.string().optional(),
        genre: z.string().optional(),
        tone: z.string().optional(),
        bookStyle: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const settings = await getSettingsByUserId(ctx.user.id);
        const apiKey = settings?.openrouterApiKey;
        if (!apiKey) throw new Error("OpenRouter API key not configured. Please add it in Settings.");
        const model = settings?.textModel || "anthropic/claude-3.5-sonnet";

        const context = [
          input.genre ? `Genre: ${input.genre}` : null,
          input.tone ? `Tone: ${input.tone}` : null,
          input.bookStyle ? `Book style: ${input.bookStyle}` : null,
          input.description ? `Description: ${input.description}` : null,
        ].filter(Boolean).join("\n");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 512,
            messages: [
              {
                role: "system",
                content: "You are a book title specialist. Generate compelling, marketable book titles. Return ONLY a JSON array of 5 title strings, nothing else. Example: [\"Title One\", \"Title Two\", \"Title Three\", \"Title Four\", \"Title Five\"]",
              },
              {
                role: "user",
                content: `Generate 5 compelling book title options for a book with these details:\n${context}\n\nReturn ONLY a JSON array of 5 title strings.`,
              },
            ],
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Title suggestion failed: ${response.status} - ${err}`);
        }

        const data = await response.json() as any;
        const raw = data.choices?.[0]?.message?.content || "[]";

        // Parse the JSON array from the response
        let titles: string[] = [];
        try {
          const arrayMatch = raw.match(/\[[\s\S]*\]/);
          if (arrayMatch) titles = JSON.parse(arrayMatch[0]);
          else titles = JSON.parse(raw.trim());
        } catch {
          // Fallback: split by newlines and clean up
          titles = raw.split("\n")
            .map((l: string) => l.replace(/^[\d.\-*"\s]+|["\s]+$/g, "").trim())
            .filter((l: string) => l.length > 3)
            .slice(0, 5);
        }

        return { titles: titles.slice(0, 5) };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        genre: z.string().optional(),
        subgenre: z.string().optional(),
        tone: z.string().optional(),
        targetAudience: z.string().optional(),
        authorName: z.string().optional(),
        writingStyle: z.string().optional(),
        customKnowledge: z.string().optional(),
        bookStyle: z.string().optional(),
        includePreface: z.boolean().optional(),
        includeDedication: z.boolean().optional(),
        includeAcknowledgements: z.boolean().optional(),
        includeEpilogue: z.boolean().optional(),
        targetWordCount: z.number().optional(),
        suggestedChapters: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const bookId = await createBook({ ...input, userId: ctx.user.id, status: "draft" });
        return { bookId };
      }),

    update: protectedProcedure
      .input(z.object({
        bookId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        genre: z.string().optional(),
        subgenre: z.string().optional(),
        tone: z.string().optional(),
        targetAudience: z.string().optional(),
        authorName: z.string().optional(),
        writingStyle: z.string().optional(),
        customKnowledge: z.string().optional(),
        bookStyle: z.string().optional(),
        outline: z.any().optional(),
        premise: z.string().optional(),
        themes: z.string().optional(),
        coverImageUrl: z.string().optional(),
        status: z.enum(["draft", "generating", "complete"]).optional(),
        includePreface: z.boolean().optional(),
        includeDedication: z.boolean().optional(),
        includeAcknowledgements: z.boolean().optional(),
        includeEpilogue: z.boolean().optional(),
        targetWordCount: z.number().optional(),
        suggestedChapters: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { bookId, ...data } = input;
        await updateBook(bookId, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteBook(input.bookId, ctx.user.id);
        return { success: true };
      }),
  }),

  chapters: router({
    list: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .query(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.user.id);
        if (!book) throw new Error("Book not found");
        return getChaptersByBookId(input.bookId);
      }),

    get: protectedProcedure
      .input(z.object({ chapterId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getChapterById(input.chapterId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        chapterId: z.number(),
        content: z.string().optional(),
        title: z.string().optional(),
        summary: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { chapterId, content, ...rest } = input;
        const wordCount = content ? content.split(/\s+/).filter(Boolean).length : undefined;
        await updateChapter(chapterId, ctx.user.id, {
          ...rest,
          ...(content !== undefined ? { content } : {}),
          ...(wordCount !== undefined ? { wordCount } : {}),
        });
        return { success: true };
      }),
  }),

  generate: router({
    outline: protectedProcedure
      .input(z.object({
        bookId: z.number(),
        numChapters: z.number().min(0).max(30).default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.user.id);
        if (!book) throw new Error("Book not found");
        const settings = await getSettingsByUserId(ctx.user.id);

        // Text generation ALWAYS uses OpenRouter
        const apiKey = settings?.openrouterApiKey;
        if (!apiKey) {
          throw new Error("OpenRouter API key not configured. Please go to Settings and add your OpenRouter key.");
        }

        const model = settings?.textModel || "anthropic/claude-3.5-sonnet";

        // Use book's suggestedChapters if numChapters not explicitly provided
        const chapterCount = input.numChapters > 0
          ? input.numChapters
          : (book.suggestedChapters || 15);

        const outline = await generateBookContent.generateOutline(
          book, chapterCount, apiKey, model, "openrouter"
        );
        await updateBook(input.bookId, ctx.user.id, { outline, totalChapters: outline.length });
        return { outline };
      }),

    chapter: protectedProcedure
      .input(z.object({ bookId: z.number(), chapterId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.user.id);
        if (!book) throw new Error("Book not found");
        const chapter = await getChapterById(input.chapterId, ctx.user.id);
        if (!chapter) throw new Error("Chapter not found");
        const settings = await getSettingsByUserId(ctx.user.id);

        // Text generation ALWAYS uses OpenRouter
        const apiKey = settings?.openrouterApiKey;
        if (!apiKey) throw new Error("OpenRouter API key not configured. Please go to Settings.");
        const model = settings?.textModel || "anthropic/claude-3.5-sonnet";

        const allChapters = await getChaptersByBookId(input.bookId);
        const previousChapters = allChapters
          .filter((c) => c.chapterNumber < chapter.chapterNumber && c.status === "complete")
          .map((c) => ({ title: c.title, summary: c.summary || "", content: c.content || "" }));

        await updateChapter(input.chapterId, ctx.user.id, { status: "generating" });

        try {
          const content = await generateBookContent.generateChapter(
            book, chapter, previousChapters, apiKey, model, "openrouter"
          );
          const wordCount = content.split(/\s+/).filter(Boolean).length;
          const summary = await generateBookContent.generateSummary(
            content, apiKey, model, "openrouter"
          );

          await updateChapter(input.chapterId, ctx.user.id, { content, summary, wordCount, status: "complete" });

          const updatedChapters = await getChaptersByBookId(input.bookId);
          const totalWords = updatedChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
          await updateBook(input.bookId, ctx.user.id, { wordCount: totalWords });

          return { content, wordCount, summary };
        } catch (err) {
          await updateChapter(input.chapterId, ctx.user.id, { status: "error" });
          throw err;
        }
      }),

    initChapters: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.user.id);
        if (!book) throw new Error("Book not found");
        if (!book.outline || (book.outline as any[]).length === 0) throw new Error("Generate outline first");

        const outline = book.outline as any[];
        const existingChapters = await getChaptersByBookId(input.bookId);
        const existingNums = new Set(existingChapters.map((c) => c.chapterNumber));

        for (const item of outline) {
          if (!existingNums.has(item.chapterNumber)) {
            await createChapter({
              bookId: input.bookId,
              userId: ctx.user.id,
              chapterNumber: item.chapterNumber,
              title: item.title,
              type: item.type || "chapter",
              status: "pending",
            });
          }
        }

        await updateBook(input.bookId, ctx.user.id, { status: "generating" });
        return { started: true, totalChapters: outline.length };
      }),

    coverImage: protectedProcedure
      .input(z.object({ bookId: z.number(), customPrompt: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.user.id);
        if (!book) throw new Error("Book not found");
        const settings = await getSettingsByUserId(ctx.user.id);

        // Images always use OpenAI regardless of text provider
        const apiKey = settings?.openaiApiKey;
        if (!apiKey) throw new Error("OpenAI API key required for image generation. Please add it in Settings.");

        const prompt: string = input.customPrompt ||
          `Professional book cover for "${book.title}". Genre: ${book.genre || "general"}. ${book.description || ""}. Cinematic, high quality, suitable for publishing.`;

        const imageUrl = await generateImageWithUserKey(apiKey, settings?.imageModel ?? "dall-e-3", prompt);
        await createBookImage({ bookId: input.bookId, userId: ctx.user.id, type: "cover", prompt, imageUrl });
        await updateBook(input.bookId, ctx.user.id, { coverImageUrl: imageUrl });
        return { imageUrl };
      }),

    illustration: protectedProcedure
      .input(z.object({ bookId: z.number(), chapterId: z.number().optional(), prompt: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.user.id);
        if (!book) throw new Error("Book not found");
        const settings = await getSettingsByUserId(ctx.user.id);

        const apiKey = settings?.openaiApiKey;
        if (!apiKey) throw new Error("OpenAI API key required for image generation. Please add it in Settings.");

        const imageUrl = await generateImageWithUserKey(apiKey, settings?.imageModel ?? "dall-e-3", input.prompt);
        await createBookImage({
          bookId: input.bookId, userId: ctx.user.id,
          type: input.chapterId ? "chapter" : "illustration",
          prompt: input.prompt, imageUrl, chapterId: input.chapterId ?? undefined,
        });
        return { imageUrl };
      }),
  }),

  images: router({
    list: protectedProcedure
      .input(z.object({ bookId: z.number() }))
      .query(async ({ ctx, input }) => {
        const book = await getBookById(input.bookId, ctx.user.id);
        if (!book) throw new Error("Book not found");
        return getImagesByBookId(input.bookId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
