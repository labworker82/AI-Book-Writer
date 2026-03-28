/**
 * AI Book Generation Engine
 * - Text generation: OpenRouter (any model the user selects)
 * - Image generation: OpenAI ONLY (handled in routers.ts, not here)
 * - response_format: json_object is applied for all models that support it
 * - max_tokens used for OpenRouter; max_completion_tokens for modern OpenAI models
 * - temperature is never set (works universally across all models/providers)
 * - Context-aware chaining: each chapter receives full outline + prior summaries
 */

import type { Book, Chapter, ChapterOutline } from "../drizzle/schema";

// OpenAI models that use max_completion_tokens instead of max_tokens
const OPENAI_MODERN_MODELS = [
  "o1", "o1-mini", "o1-preview", "o3", "o3-mini", "o4-mini", "o4",
  "gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
  "gpt-5", "gpt-5.4",
];

// Models that do NOT support response_format (OpenAI reasoning series + some OpenRouter models)
// For OpenRouter, we check by model name prefix
const NO_JSON_MODE_PREFIXES = [
  "o1", "o3", "o4",                           // OpenAI reasoning models
  "meta-llama/",                               // Llama models via OpenRouter
  "mistralai/mistral-7b",                      // Smaller Mistral models
  "nousresearch/",                             // Nous Research models
  "huggingfaceh4/",                            // HuggingFace models
];

function supportsJsonMode(model: string): boolean {
  const lower = model.toLowerCase();
  return !NO_JSON_MODE_PREFIXES.some(prefix => lower.startsWith(prefix.toLowerCase()));
}

function isModernOpenAIModel(model: string): boolean {
  return OPENAI_MODERN_MODELS.some(
    (m) => model === m || model.startsWith(m + "-") || model.startsWith(m + ".")
  );
}

function getApiUrl(provider: string): string {
  return provider === "openrouter"
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
}

/**
 * Calculate the target words per chapter based on book settings.
 */
function getTargetWordsPerChapter(book: Book, totalChapters: number): number {
  const totalTarget = book.targetWordCount || 30000;
  const chapters = totalChapters || book.totalChapters || 15;
  const perChapter = Math.round(totalTarget / Math.max(chapters, 1));
  return Math.min(5000, Math.max(800, perChapter));
}

/**
 * Estimate tokens needed for a given word count.
 * ~1.35 tokens per word is a safe estimate for prose.
 */
function wordsToTokens(words: number): number {
  return Math.ceil(words * 1.35) + 512;
}

async function callAI(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens = 4096,
  provider = "openrouter",
  useJsonMode = false
): Promise<string> {
  const url = getApiUrl(provider);

  // OpenRouter ALWAYS uses max_tokens.
  // OpenAI modern models use max_completion_tokens; older ones use max_tokens.
  const tokenParam =
    provider === "openrouter"
      ? { max_tokens: maxTokens }
      : isModernOpenAIModel(model)
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

  // Apply response_format: json_object when:
  // 1. The caller requests JSON mode (useJsonMode = true)
  // 2. The model supports it (not o1/o3/o4 reasoning series, not Llama, etc.)
  if (useJsonMode && supportsJsonMode(model)) {
    body.response_format = { type: "json_object" };
  }

  // NOTE: We intentionally do NOT set temperature.
  // OpenAI's newer models (gpt-5, o1, o3, o4-mini, etc.) reject custom temperature values.
  // OpenRouter also works fine without an explicit temperature.

  console.log(`[callAI] provider=${provider} model=${model} jsonMode=${useJsonMode && supportsJsonMode(model)} maxTokens=${maxTokens}`);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[callAI] API error ${response.status}:`, error.slice(0, 500));
    throw new Error(`${provider === "openrouter" ? "OpenRouter" : "OpenAI"} API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;

  // Handle multiple response shapes
  const choice = data.choices?.[0];
  if (choice) {
    const msg = choice.message;
    if (msg?.refusal) {
      throw new Error(`Model refused the request: ${msg.refusal}`);
    }
    if (typeof msg?.content === "string" && msg.content.trim()) {
      return msg.content;
    }
    if (Array.isArray(msg?.content)) {
      const textParts = msg.content
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
      if (textParts.trim()) return textParts;
    }
  }

  // Responses API style (output_text at top level)
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  // Responses API nested output array
  const outputText = data.output?.[0]?.content?.[0]?.text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText;
  }

  console.error("[callAI] Unexpected response shape. Full response:", JSON.stringify(data).slice(0, 800));
  return "";
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
   */
  async generateOutline(
    book: Book,
    numChapters: number,
    apiKey: string,
    model: string,
    provider = "openrouter"
  ): Promise<ChapterOutline[]> {
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
      provider,
      true  // useJsonMode = true for outline (we need parseable JSON)
    );

    const parsed = parseOutlineJSON(raw);
    if (!parsed) {
      console.error("[bookGenerator] Failed to parse outline. Raw response (first 800 chars):", raw.slice(0, 800));
      throw new Error(
        `Failed to parse outline from AI response. ` +
        `Model returned: "${raw.slice(0, 200)}...". ` +
        `Please try a different model or check your API key.`
      );
    }
    return parsed;
  },

  /**
   * Generate a full chapter with context continuity.
   */
  async generateChapter(
    book: Book,
    chapter: Chapter,
    previousChapters: { title: string; summary: string; content: string }[],
    apiKey: string,
    model: string,
    provider = "openrouter"
  ): Promise<string> {
    const outline = (book.outline as ChapterOutline[]) || [];
    const chapterOutlineItem = outline.find(
      (o) => o.chapterNumber === chapter.chapterNumber
    );
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
      provider,
      false  // useJsonMode = false for chapter content (we want prose, not JSON)
    );

    return content.trim();
  },

  /**
   * Generate a brief summary of a chapter for context chaining.
   */
  async generateSummary(
    chapterContent: string,
    apiKey: string,
    model: string,
    provider = "openrouter"
  ): Promise<string> {
    const prompt = `Summarize the following chapter content in 3-5 sentences, capturing the key points, arguments, and narrative developments. This summary will be used to maintain continuity in subsequent chapters.

Chapter content:
${chapterContent.slice(0, 3000)}${chapterContent.length > 3000 ? "..." : ""}

Return only the summary, no labels or prefixes.`;

    const summary = await callAI(
      apiKey,
      model,
      [{ role: "user", content: prompt }],
      512,
      provider,
      false
    );

    return summary.trim();
  },
};
