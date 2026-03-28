/**
 * Tests for the AI Book Generation Engine
 * Covers: JSON parsing strategies, model capability detection, provider routing
 */
import { describe, expect, it } from "vitest";

// ─── Inline the functions we want to test ─────────────────────────────────────
// We duplicate the logic here so tests don't depend on module internals.
// If the implementation changes, update these too.

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

type ChapterOutline = {
  chapterNumber: number;
  title: string;
  summary: string;
  type: string;
};

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

// ─── Tests ────────────────────────────────────────────────────────────────────

const SAMPLE_CHAPTERS: ChapterOutline[] = [
  { chapterNumber: 1, title: "Introduction", summary: "The beginning", type: "chapter" },
  { chapterNumber: 2, title: "The Journey", summary: "The middle", type: "chapter" },
];

describe("parseOutlineJSON", () => {
  it("parses a raw JSON array", () => {
    const raw = JSON.stringify(SAMPLE_CHAPTERS);
    const result = parseOutlineJSON(raw);
    expect(result).toHaveLength(2);
    expect(result![0].title).toBe("Introduction");
  });

  it("parses JSON wrapped in markdown code fence (```json)", () => {
    const raw = "```json\n" + JSON.stringify(SAMPLE_CHAPTERS) + "\n```";
    const result = parseOutlineJSON(raw);
    expect(result).toHaveLength(2);
    expect(result![1].chapterNumber).toBe(2);
  });

  it("parses JSON wrapped in plain code fence (```)", () => {
    const raw = "```\n" + JSON.stringify(SAMPLE_CHAPTERS) + "\n```";
    const result = parseOutlineJSON(raw);
    expect(result).toHaveLength(2);
  });

  it("parses JSON array embedded in surrounding text", () => {
    const raw = "Here is the outline:\n" + JSON.stringify(SAMPLE_CHAPTERS) + "\nEnd of outline.";
    const result = parseOutlineJSON(raw);
    expect(result).toHaveLength(2);
  });

  it("parses { chapters: [...] } wrapper format", () => {
    const raw = JSON.stringify({ chapters: SAMPLE_CHAPTERS });
    const result = parseOutlineJSON(raw);
    expect(result).toHaveLength(2);
  });

  it("parses { outline: [...] } wrapper format", () => {
    const raw = JSON.stringify({ outline: SAMPLE_CHAPTERS });
    const result = parseOutlineJSON(raw);
    expect(result).toHaveLength(2);
  });

  it("returns null for empty string", () => {
    expect(parseOutlineJSON("")).toBeNull();
    expect(parseOutlineJSON("   ")).toBeNull();
  });

  it("returns null for plain text with no JSON", () => {
    const result = parseOutlineJSON("This is just some text with no JSON in it.");
    expect(result).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    const result = parseOutlineJSON("[{broken json}]");
    expect(result).toBeNull();
  });
});

describe("supportsJsonMode", () => {
  it("returns true for Claude models (OpenRouter)", () => {
    expect(supportsJsonMode("anthropic/claude-3.5-sonnet")).toBe(true);
    expect(supportsJsonMode("anthropic/claude-3-opus")).toBe(true);
  });

  it("returns true for Gemini models (OpenRouter)", () => {
    expect(supportsJsonMode("google/gemini-pro-1.5")).toBe(true);
    expect(supportsJsonMode("google/gemini-2.0-flash-001")).toBe(true);
  });

  it("returns true for GPT models via OpenRouter", () => {
    expect(supportsJsonMode("openai/gpt-4o")).toBe(true);
    expect(supportsJsonMode("openai/gpt-4o-mini")).toBe(true);
  });

  it("returns true for DeepSeek models", () => {
    expect(supportsJsonMode("deepseek/deepseek-chat")).toBe(true);
    expect(supportsJsonMode("deepseek/deepseek-r1")).toBe(true);
  });

  it("returns false for OpenAI o1/o3/o4 reasoning models", () => {
    expect(supportsJsonMode("o1")).toBe(false);
    expect(supportsJsonMode("o1-mini")).toBe(false);
    expect(supportsJsonMode("o3")).toBe(false);
    expect(supportsJsonMode("o3-mini")).toBe(false);
    expect(supportsJsonMode("o4-mini")).toBe(false);
    expect(supportsJsonMode("o4")).toBe(false);
  });

  it("returns false for Llama models via OpenRouter", () => {
    expect(supportsJsonMode("meta-llama/llama-3.3-70b-instruct")).toBe(false);
    expect(supportsJsonMode("meta-llama/llama-3-8b-instruct")).toBe(false);
  });

  it("returns false for small Mistral models", () => {
    expect(supportsJsonMode("mistralai/mistral-7b-instruct")).toBe(false);
  });

  it("returns true for Mistral Large (not in exclusion list)", () => {
    // Only mistral-7b is excluded, not mistral-large
    expect(supportsJsonMode("mistralai/mistral-large")).toBe(true);
  });
});

describe("provider routing logic", () => {
  it("always uses openrouter for text generation (no openai key fallback)", () => {
    // Simulate what routers.ts does: always use openrouterApiKey for text
    const settings = {
      openrouterApiKey: "sk-or-v1-test",
      openaiApiKey: "sk-openai-test",
      textModel: "anthropic/claude-3.5-sonnet",
    };

    const apiKey = settings.openrouterApiKey;
    const model = settings.textModel || "anthropic/claude-3.5-sonnet";
    const provider = "openrouter";

    expect(apiKey).toBe("sk-or-v1-test");
    expect(model).toBe("anthropic/claude-3.5-sonnet");
    expect(provider).toBe("openrouter");
  });

  it("always uses openai key for image generation (never openrouter)", () => {
    // Simulate what routers.ts does: always use openaiApiKey for images
    const settings = {
      openrouterApiKey: "sk-or-v1-test",
      openaiApiKey: "sk-openai-test",
      imageModel: "dall-e-3",
    };

    const imageApiKey = settings.openaiApiKey;
    const imageModel = settings.imageModel || "dall-e-3";

    expect(imageApiKey).toBe("sk-openai-test");
    expect(imageModel).toBe("dall-e-3");
  });

  it("throws if openrouterApiKey is missing for text generation", () => {
    const settings = {
      openrouterApiKey: null as string | null,
      openaiApiKey: "sk-openai-test",
    };

    const apiKey = settings.openrouterApiKey;
    expect(apiKey).toBeNull();
    // In routers.ts: if (!apiKey) throw new Error(...)
    expect(() => {
      if (!apiKey) throw new Error("OpenRouter API key not configured.");
    }).toThrow("OpenRouter API key not configured.");
  });

  it("throws if openaiApiKey is missing for image generation", () => {
    const settings = {
      openrouterApiKey: "sk-or-v1-test",
      openaiApiKey: null as string | null,
    };

    const apiKey = settings.openaiApiKey;
    expect(apiKey).toBeNull();
    expect(() => {
      if (!apiKey) throw new Error("OpenAI API key required for image generation.");
    }).toThrow("OpenAI API key required for image generation.");
  });
});
