/**
 * AI Book Generation Engine
 * - Supports OpenAI and OpenRouter providers
 * - Uses max_completion_tokens for all modern OpenAI models
 * - Never sets temperature for reasoning models (o1/o3/o4 series)
 * - Targets per-chapter word count based on book's targetWordCount + chapter count
 * - Context-aware chaining: each chapter receives full outline + prior summaries
 */

import type { Book, Chapter, ChapterOutline } from "../drizzle/schema";

// Models that use max_completion_tokens instead of max_tokens
const MODERN_MODELS = [
  "o1", "o1-mini", "o1-preview", "o3", "o3-mini", "o4-mini", "o4",
  "gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
  "gpt-5", "gpt-5.4",
];

// O-series reasoning models: temperature must NOT be set (only default=1 supported)
const REASONING_MODELS = ["o1", "o1-mini", "o1-preview", "o3", "o3-mini", "o4-mini", "o4"];

function isModernModel(model: string): boolean {
  return MODERN_MODELS.some((m) => model === m || model.startsWith(m + "-") || model.startsWith(m + "."));
}

function isReasoningModel(model: string): boolean {
  return REASONING_MODELS.some((m) => model === m || model.startsWith(m + "-") || model.startsWith(m + "."));
}

function getApiUrl(provider: string): string {
  return provider === "openrouter"
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
}

/**
 * Calculate the target words per chapter based on book settings.
 * Distributes the total word count evenly across all chapters.
 */
function getTargetWordsPerChapter(book: Book, totalChapters: number): number {
  const totalTarget = book.targetWordCount || 30000;
  const chapters = totalChapters || book.totalChapters || 15;
  const perChapter = Math.round(totalTarget / Math.max(chapters, 1));
  // Clamp between 800 and 5000 words per chapter
  return Math.min(5000, Math.max(800, perChapter));
}

/**
 * Estimate tokens needed for a given word count.
 * ~1.35 tokens per word is a safe estimate for prose.
 */
function wordsToTokens(words: number): number {
  return Math.ceil(words * 1.35) + 512; // +512 for formatting overhead
}

async function callAI(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens = 4096,
  provider = "openai"
): Promise<string> {
  const url = getApiUrl(provider);

  // Use max_completion_tokens for modern OpenAI models; max_tokens for older/OpenRouter
  const tokenParam =
    provider === "openai" && isModernModel(model)
      ? { max_completion_tokens: maxTokens }
      : { max_tokens: maxTokens };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://ai-book-writer.manus.space";
    headers["X-Title"] = "AI Book Writer";
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    ...tokenParam,
  };

  // NOTE: We intentionally do NOT set temperature.
  // OpenAI's newer models (gpt-5, o1, o3, o4-mini, etc.) reject custom temperature values.
  // Omitting temperature entirely uses each model's default, which works universally.
  // OpenRouter also works fine without an explicit temperature.

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Robust JSON parser for outline responses.
 * Handles: markdown code fences, raw JSON arrays, wrapped objects, and mixed text.
 */
function parseOutlineJSON(raw: string): ChapterOutline[] | null {
  if (!raw || raw.trim().length === 0) return null;

  // Strategy 1: Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const inner = fenceMatch[1].trim();
      const parsed = JSON.parse(inner);
      if (Array.isArray(parsed)) return parsed as ChapterOutline[];
      if (parsed?.chapters) return parsed.chapters as ChapterOutline[];
      if (parsed?.outline) return parsed.outline as ChapterOutline[];
    } catch { /* try next strategy */ }
  }

  // Strategy 2: Find the first [ ... ] JSON array in the response
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed as ChapterOutline[];
    } catch { /* try next strategy */ }
  }

  // Strategy 3: Try parsing the entire response as JSON
  try {
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed)) return parsed as ChapterOutline[];
    if (parsed?.chapters) return parsed.chapters as ChapterOutline[];
    if (parsed?.outline) return parsed.outline as ChapterOutline[];
  } catch { /* try next strategy */ }

  // Strategy 4: Find the first { ... } object and check if it wraps an array
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]);
      if (parsed?.chapters) return parsed.chapters as ChapterOutline[];
      if (parsed?.outline) return parsed.outline as ChapterOutline[];
      if (parsed?.sections) return parsed.sections as ChapterOutline[];
    } catch { /* give up */ }
  }

  return null;
}

export const generateBookContent = {
  /**
   * Generate a full chapter outline for the book.
   * Uses suggestedChapters from the book record if available.
   */
  async generateOutline(
    book: Book,
    numChapters: number,
    apiKey: string,
    model: string,
    provider = "openai"
  ): Promise<ChapterOutline[]> {
    // Use the book's suggestedChapters if caller passes 0 or default
    const chapterCount = numChapters > 0 ? numChapters : (book.suggestedChapters || 15);
    const targetWords = book.targetWordCount || 30000;
    const wordsPerChapter = getTargetWordsPerChapter(book, chapterCount);

    const systemPrompt = `You are a professional book editor and author. Your task is to create a detailed, well-structured book outline.
Return ONLY a valid JSON array of chapter objects. No markdown, no explanation, just the JSON array.`;

    const userPrompt = `Create a complete book outline for the following book:

Title: ${book.title}
Genre: ${book.genre || "General"}${book.subgenre ? ` / ${book.subgenre}` : ""}
Description: ${book.description || "Not provided"}
Target Audience: ${book.targetAudience || "General readers"}
Tone: ${book.tone || "Professional and engaging"}
Writing Style: ${book.writingStyle || "Clear and engaging"}
${book.customKnowledge ? `Additional Context/Knowledge: ${book.customKnowledge}` : ""}

Book length target: ~${targetWords.toLocaleString()} words total (~${wordsPerChapter.toLocaleString()} words per chapter)

Book structure requirements:
${book.includePreface ? "- Include a Preface as the first section" : ""}
${book.includeDedication ? "- Include a Dedication page" : ""}
- Include exactly ${chapterCount} main chapters
${book.includeAcknowledgements ? "- Include Acknowledgements at the end" : ""}
${book.includeEpilogue ? "- Include an Epilogue at the end" : ""}

For each section, return a JSON object with these exact fields:
{
  "chapterNumber": (sequential number starting from 1),
  "title": "Chapter title",
  "summary": "2-3 sentence description of what this chapter covers, key points, and its purpose in the book",
  "type": "preface" | "dedication" | "chapter" | "epilogue" | "acknowledgements"
}

Make the chapter titles compelling and the summaries specific and detailed. Each chapter should build on the previous ones for a cohesive narrative arc.

Return ONLY the JSON array, nothing else.`;

    const raw = await callAI(
      apiKey, model,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      2048,
      provider
    );

    // Robust JSON parser — handles all response formats from gpt-5, gpt-4o, etc.
    const parsed = parseOutlineJSON(raw);
    if (!parsed) {
      // Log the raw response for debugging
      console.error("[bookGenerator] Failed to parse outline. Raw response:", raw.slice(0, 500));
      throw new Error("Failed to parse outline from AI response. The model returned unexpected content.");
    }
    return parsed;
  },

  /**
   * Generate a full chapter with context continuity.
   * Targets the correct word count based on book length settings.
   */
  async generateChapter(
    book: Book,
    chapter: Chapter,
    previousChapters: { title: string; summary: string; content: string }[],
    apiKey: string,
    model: string,
    provider = "openai"
  ): Promise<string> {
    const outline = (book.outline as ChapterOutline[]) || [];
    const chapterOutlineItem = outline.find((o) => o.chapterNumber === chapter.chapterNumber);
    const totalChapters = outline.filter(c => c.type === "chapter").length || book.totalChapters || 15;
    const targetWordsPerChapter = getTargetWordsPerChapter(book, totalChapters);
    const maxTokens = wordsToTokens(targetWordsPerChapter);

    const previousContext =
      previousChapters.length > 0
        ? `\n\nPREVIOUS CHAPTERS CONTEXT (for continuity):\n${previousChapters
            .map((c) => `Chapter "${c.title}" summary: ${c.summary}`)
            .join("\n")}`
        : "";

    const fullOutline = outline
      .map((o) => `${o.chapterNumber}. ${o.title}: ${o.summary}`)
      .join("\n");

    const systemPrompt = `You are a professional author writing a ${book.genre || "general"} book called "${book.title}".
Writing style: ${book.writingStyle || "engaging, clear, and professional"}.
Tone: ${book.tone || "professional and accessible"}.
Target audience: ${book.targetAudience || "general readers"}.
${book.customKnowledge ? `Domain knowledge to incorporate: ${book.customKnowledge}` : ""}

CRITICAL RULES:
- Write in a natural, human voice. Do NOT sound like AI.
- Maintain consistency with all previous chapters.
- Target approximately ${targetWordsPerChapter.toLocaleString()} words for this chapter.
- Use vivid examples, stories, and concrete details.
- Do NOT include chapter number or "Chapter X:" prefix — start directly with the content.
- Do NOT add meta-commentary like "In this chapter..." at the start.`;

    const userPrompt = `Write the full content for this chapter:

CHAPTER: ${chapter.title}
TYPE: ${chapter.type}
PURPOSE: ${chapterOutlineItem?.summary || ""}

FULL BOOK OUTLINE (for context and continuity):
${fullOutline}
${previousContext}

Write the complete, full-length chapter content now. Be thorough, detailed, and engaging. Target ${targetWordsPerChapter.toLocaleString()} words.`;

    const content = await callAI(
      apiKey, model,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens,
      provider
    );

    return content.trim();
  },

  /**
   * Generate a brief summary of a chapter for context chaining.
   * Always uses a fast/cheap model to minimize costs.
   */
  async generateSummary(
    chapterContent: string,
    apiKey: string,
    model: string,
    provider = "openai"
  ): Promise<string> {
    const prompt = `Summarize the following chapter content in 3-5 sentences, capturing the key points, arguments, and narrative developments. This summary will be used to maintain continuity in subsequent chapters.

Chapter content:
${chapterContent.slice(0, 3000)}${chapterContent.length > 3000 ? "..." : ""}

Return only the summary, no labels or prefixes.`;

    // Always use a fast model for summaries to save costs
    const summaryModel = provider === "openrouter" ? model : "gpt-4o-mini";

    const summary = await callAI(
      apiKey,
      summaryModel,
      [{ role: "user", content: prompt }],
      512,
      provider
    );

    return summary.trim();
  },
};
