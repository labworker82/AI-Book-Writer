/**
 * AI Book Generation Engine
 * - Text generation: OpenRouter (any model the user selects)
 * - Image generation: OpenAI ONLY (handled in routers.ts, not here)
 * - response_format: json_object is applied for all models that support it
 * - max_tokens used for OpenRouter; max_completion_tokens for modern OpenAI models
 * - temperature is never set (works universally across all models/providers)
 * - Context-aware chaining: each chapter receives full outline + prior summaries
 * - Type-aware prompts: preface/intro/epilogue/acknowledgements get dedicated instructions
 */

import type { Book, Chapter, ChapterOutline } from "../drizzle/schema";

// OpenAI models that use max_completion_tokens instead of max_tokens
const OPENAI_MODERN_MODELS = [
  "o1", "o1-mini", "o1-preview", "o3", "o3-mini", "o4-mini", "o4",
  "gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano",
  "gpt-5", "gpt-5.4",
];

// Models that do NOT support response_format (OpenAI reasoning series + some OpenRouter models)
const NO_JSON_MODE_PREFIXES = [
  "o1", "o3", "o4",
  "meta-llama/",
  "mistralai/mistral-7b",
  "nousresearch/",
  "huggingfaceh4/",
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

/**
 * Calculate the outline token budget.
 * Each chapter outline item is ~80-120 tokens of JSON.
 * We add a generous buffer so 30-chapter books never get truncated.
 */
function getOutlineTokenBudget(chapterCount: number): number {
  // ~150 tokens per chapter item (title + summary + fields) + 512 buffer
  return Math.max(3000, chapterCount * 150 + 512);
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

  if (useJsonMode && supportsJsonMode(model)) {
    body.response_format = { type: "json_object" };
  }

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

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const outputText = data.output?.[0]?.content?.[0]?.text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText;
  }

  console.error("[callAI] Unexpected response shape. Full response:", JSON.stringify(data).slice(0, 800));
  return "";
}

/**
 * Robust JSON parser for outline responses.
 */
function parseOutlineJSON(raw: string): ChapterOutline[] | null {
  if (!raw || raw.trim().length === 0) return null;

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      const inner = fenceMatch[1].trim();
      const parsed = JSON.parse(inner);
      if (Array.isArray(parsed)) return parsed as ChapterOutline[];
      if (parsed?.chapters) return parsed.chapters as ChapterOutline[];
      if (parsed?.outline) return parsed.outline as ChapterOutline[];
    } catch { /* try next */ }
  }

  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed as ChapterOutline[];
    } catch { /* try next */ }
  }

  try {
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed)) return parsed as ChapterOutline[];
    if (parsed?.chapters) return parsed.chapters as ChapterOutline[];
    if (parsed?.outline) return parsed.outline as ChapterOutline[];
  } catch { /* try next */ }

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

/**
 * Build a rich voice/style instruction block from book fields.
 * This is injected into every chapter prompt so the AI consistently
 * applies the author's chosen tone, POV, pacing, and vocabulary.
 */
function buildVoiceBlock(book: Book): string {
  const lines: string[] = [];

  if (book.tone) lines.push(`Tone: ${book.tone}`);
  if (book.writingStyle) lines.push(`Writing style: ${book.writingStyle}`);
  if (book.targetAudience) lines.push(`Target audience: ${book.targetAudience}`);
  if (book.customKnowledge) lines.push(`Domain knowledge to incorporate: ${book.customKnowledge}`);

  return lines.join("\n");
}

/**
 * Return type-specific writing instructions for preface, dedication,
 * epilogue, acknowledgements, and regular chapters.
 */
function getTypeInstructions(type: string, chapterTitle: string, chapterSummary: string): string {
  switch (type) {
    case "preface":
      return `You are writing the PREFACE of this book.
A preface is written in the author's own voice. It should:
- Explain why the author wrote this book and what inspired it
- Describe who the book is for and what they will gain
- Set the emotional tone and create anticipation for what follows
- Feel personal, warm, and inviting — like a letter to the reader
- Be 400–700 words in length
- Do NOT summarize chapter contents — instead, speak to the reader's journey

Title: ${chapterTitle}
Purpose: ${chapterSummary}`;

    case "dedication":
      return `You are writing the DEDICATION page of this book.
A dedication is brief (50–150 words), heartfelt, and personal.
It is addressed to specific people (family, mentors, readers, etc.)
Keep it sincere and meaningful. Do not explain the book.

Title: ${chapterTitle}
Purpose: ${chapterSummary}`;

    case "epilogue":
      return `You are writing the EPILOGUE of this book.
An epilogue comes after the final chapter and should:
- Reflect on the journey the reader has taken through the book
- Offer a final thought, call to action, or forward-looking vision
- Feel like a satisfying close — not a summary, but a meaningful ending
- Be 400–800 words in length
- Speak directly to the reader in a warm, closing tone

Title: ${chapterTitle}
Purpose: ${chapterSummary}`;

    case "acknowledgements":
      return `You are writing the ACKNOWLEDGEMENTS section of this book.
Acknowledgements should:
- Thank the people who helped make the book possible (editors, family, mentors, early readers)
- Feel genuine and specific, not generic
- Be 200–500 words in length
- Use a warm, grateful tone

Title: ${chapterTitle}
Purpose: ${chapterSummary}`;

    default:
      return `You are writing CHAPTER: "${chapterTitle}"
Purpose of this chapter: ${chapterSummary}`;
  }
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
    provider = "openrouter",
    authorProfile?: { penName?: string; authorBio?: string }
  ): Promise<ChapterOutline[]> {
    const chapterCount = numChapters > 0 ? numChapters : (book.suggestedChapters || 15);
    const targetWords = book.targetWordCount || 30000;
    const wordsPerChapter = getTargetWordsPerChapter(book, chapterCount);
    // Scale token budget so large chapter counts never get truncated
    const outlineTokens = getOutlineTokenBudget(chapterCount);

    // Only include author info when user has explicitly opted in via Settings
    const authorContext = authorProfile?.penName || authorProfile?.authorBio
      ? `\nAuthor: ${authorProfile.penName || "(not specified)"}${authorProfile.authorBio ? `\nAuthor background: ${authorProfile.authorBio}` : ""}`
      : "";

    const systemPrompt = `You are a professional book editor and author. Your task is to create a detailed, well-structured book outline.${authorContext}
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
${book.includePreface ? "- Include a Preface as the FIRST section (type: \"preface\")" : ""}
${book.includeDedication ? "- Include a Dedication page as an early section (type: \"dedication\")" : ""}
- Include exactly ${chapterCount} main chapters (type: \"chapter\")
${book.includeAcknowledgements ? "- Include Acknowledgements at the end (type: \"acknowledgements\")" : ""}
${book.includeEpilogue ? "- Include an Epilogue at the end (type: \"epilogue\")" : ""}

IMPORTANT: You MUST return ALL ${chapterCount} main chapters plus any front/back matter listed above.
Do not stop early. Every chapter must have a unique, specific title and a detailed 2-3 sentence summary.

For each section, return a JSON object with these exact fields:
{
  "chapterNumber": (sequential number starting from 1),
  "title": "Section title",
  "summary": "2-3 sentence description of what this section covers, key points, and its purpose in the book",
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
      outlineTokens,
      provider,
      true
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

    // Safety check: if the AI returned fewer chapters than requested, log a warning
    const mainChapters = parsed.filter(c => c.type === "chapter").length;
    if (mainChapters < chapterCount) {
      console.warn(`[bookGenerator] Outline has ${mainChapters} main chapters but ${chapterCount} were requested. Model may have truncated.`);
    }

    return parsed;
  },

  /**
   * Generate a full chapter with context continuity.
   * Uses type-specific prompts for preface, epilogue, dedication, acknowledgements.
   */
  async generateChapter(
    book: Book,
    chapter: Chapter,
    previousChapters: { title: string; summary: string; content: string }[],
    apiKey: string,
    model: string,
    provider = "openrouter",
    authorProfile?: { penName?: string; authorBio?: string },
    toneOverride?: string
  ): Promise<string> {
    const outline = (book.outline as ChapterOutline[]) || [];
    const chapterOutlineItem = outline.find(
      (o) => o.chapterNumber === chapter.chapterNumber
    );
    const totalChapters = outline.filter(c => c.type === "chapter").length || book.totalChapters || 15;
    const targetWordsPerChapter = getTargetWordsPerChapter(book, totalChapters);
    const maxTokens = wordsToTokens(targetWordsPerChapter);

    const chapterType = chapter.type || "chapter";
    const chapterTitle = chapter.title;
    const chapterSummary = chapterOutlineItem?.summary || "";

    // Build previous chapter context (only for regular chapters — not front/back matter)
    const previousContext =
      previousChapters.length > 0 && chapterType === "chapter"
        ? `\n\nPREVIOUS CHAPTERS CONTEXT (for continuity):\n${previousChapters
            .map((c) => `Chapter "${c.title}" summary: ${c.summary}`)
            .join("\n")}`
        : "";

    const fullOutline = outline
      .map((o) => `${o.chapterNumber}. ${o.title}: ${o.summary}`)
      .join("\n");

    const voiceBlock = buildVoiceBlock(book);
    const typeInstructions = getTypeInstructions(chapterType, chapterTitle, chapterSummary);

    // Front/back matter (preface, dedication, epilogue, acknowledgements) gets a focused prompt
    // Regular chapters get the full outline context for continuity
    const isSpecialSection = ["preface", "dedication", "epilogue", "acknowledgements"].includes(chapterType);

    // Only include author info when user has explicitly opted in via Settings
    const authorContext = authorProfile?.penName || authorProfile?.authorBio
      ? `\nAuthor pen name: ${authorProfile.penName || "(not specified)"}${authorProfile.authorBio ? `\nAuthor background/voice notes: ${authorProfile.authorBio}` : ""}`
      : "";

    const systemPrompt = `You are a professional author writing a ${book.genre || "general"} book called "${book.title}".${authorContext}
${voiceBlock}

CRITICAL RULES:
- Write in a natural, human voice. Do NOT sound like AI.
- Do NOT include the chapter number or "Chapter X:" prefix — start directly with the content.
- Do NOT add meta-commentary like "In this chapter we will..." at the start.
- Do NOT write a table of contents or list of bullet points as the main content.
- Do NOT invent author names, publication dates, or personal details unless they were explicitly provided above.
${chapterType === "chapter" ? `- Target approximately ${targetWordsPerChapter.toLocaleString()} words.` : ""}
- Use vivid examples, stories, and concrete details where appropriate.
${toneOverride ? `\nTONE OVERRIDE: ${toneOverride}. Apply this to the entire chapter.` : ""}`;

    const userPrompt = isSpecialSection
      ? `${typeInstructions}

FULL BOOK OUTLINE (for context):
${fullOutline}

Write the complete content now. Follow the type-specific instructions above carefully.`
      : `${typeInstructions}

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
      false
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
