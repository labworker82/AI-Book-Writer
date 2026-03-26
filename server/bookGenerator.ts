/**
 * AI Book Generation Engine
 * Uses OpenAI API directly with user's own API key.
 * Implements context-aware chaining for coherent long-form books.
 */

import type { Book, Chapter, ChapterOutline } from "../drizzle/schema";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens = 4096
): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  return data.choices?.[0]?.message?.content || "";
}

export const generateBookContent = {
  /**
   * Generate a full chapter outline for the book.
   * Returns an array of ChapterOutline objects.
   */
  async generateOutline(
    book: Book,
    numChapters: number,
    apiKey: string,
    model: string
  ): Promise<ChapterOutline[]> {
    const bookType = book.genre?.toLowerCase().includes("fiction") ? "fiction" : "nonfiction";

    const systemPrompt = `You are a professional book editor and author. Your task is to create a detailed, well-structured book outline. 
Return ONLY a valid JSON array of chapter objects. No markdown, no explanation, just the JSON array.`;

    const userPrompt = `Create a complete book outline for the following book:

Title: ${book.title}
Genre: ${book.genre || "General"}${book.subgenre ? ` / ${book.subgenre}` : ""}
Description: ${book.description || "Not provided"}
Target Audience: ${book.targetAudience || "General readers"}
Tone: ${book.tone || "Professional and engaging"}
Themes: ${book.themes || "Not specified"}
${book.customKnowledge ? `Additional Context: ${book.customKnowledge}` : ""}

Book structure requirements:
${book.includePreface ? "- Include a Preface as chapter 1" : ""}
${book.includeDedication ? "- Include a Dedication page" : ""}
- Include exactly ${numChapters} main chapters
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

    const raw = await callOpenAI(apiKey, model, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], 2048);

    // Parse JSON from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to parse outline from AI response");

    const outline = JSON.parse(jsonMatch[0]) as ChapterOutline[];
    return outline;
  },

  /**
   * Generate a full chapter with context continuity.
   * Passes previous chapter summaries to maintain coherence.
   */
  async generateChapter(
    book: Book,
    chapter: Chapter,
    previousChapters: { title: string; summary: string; content: string }[],
    apiKey: string,
    model: string
  ): Promise<string> {
    const outline = (book.outline as ChapterOutline[]) || [];
    const chapterOutlineItem = outline.find((o) => o.chapterNumber === chapter.chapterNumber);

    // Build context from previous chapters
    const previousContext =
      previousChapters.length > 0
        ? `\n\nPREVIOUS CHAPTERS CONTEXT (for continuity):\n${previousChapters
            .map((c) => `Chapter "${c.title}" summary: ${c.summary}`)
            .join("\n")}`
        : "";

    // Build the full outline context
    const fullOutline = outline
      .map((o) => `${o.chapterNumber}. ${o.title}: ${o.summary}`)
      .join("\n");

    const systemPrompt = `You are a professional author writing a ${book.genre || "general"} book called "${book.title}".
Your writing style is: ${book.writingStyle || "engaging, clear, and professional"}.
Tone: ${book.tone || "professional and accessible"}.
Target audience: ${book.targetAudience || "general readers"}.
${book.customKnowledge ? `Domain knowledge to incorporate: ${book.customKnowledge}` : ""}

CRITICAL RULES:
- Write in a natural, human voice. Do NOT sound like AI.
- Maintain consistency with all previous chapters.
- Each chapter should be substantial — aim for 2,500-4,000 words.
- Use vivid examples, stories, and concrete details.
- Do NOT include chapter number or "Chapter X:" in the output — just the content.
- Start directly with the chapter content.`;

    const userPrompt = `Write the full content for this chapter:

CHAPTER: ${chapter.title}
TYPE: ${chapter.type}
PURPOSE: ${chapterOutlineItem?.summary || ""}

FULL BOOK OUTLINE (for context and continuity):
${fullOutline}
${previousContext}

Write the complete, full-length chapter content now. Be thorough, detailed, and engaging. Aim for at least 2,500 words.`;

    const content = await callOpenAI(
      apiKey,
      model,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      4096
    );

    return content.trim();
  },

  /**
   * Generate a brief summary of a chapter for use as context in subsequent chapters.
   */
  async generateSummary(
    chapterContent: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    const prompt = `Summarize the following chapter content in 3-5 sentences, capturing the key points, arguments, and narrative developments. This summary will be used to maintain continuity in subsequent chapters.

Chapter content:
${chapterContent.slice(0, 3000)}${chapterContent.length > 3000 ? "..." : ""}

Return only the summary, no labels or prefixes.`;

    const summary = await callOpenAI(
      apiKey,
      model,
      [{ role: "user", content: prompt }],
      512
    );

    return summary.trim();
  },
};
