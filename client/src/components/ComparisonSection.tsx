/**
 * ComparisonSection — "ChatGPT can write. AI Book Writer helps you finish."
 * Side-by-side comparison table
 */

import { X, Check } from "lucide-react";

const chatgptCons = [
  "You manage prompts, structure, continuity, and consistency across a long chat.",
  "Easy to get generic output. Hard to keep a consistent voice across 10+ chapters.",
  "Publishing prep is on you (descriptions, keywords, categories, cover tools).",
];

const ourPros = [
  "A workflow designed for book-length cohesion from idea to final draft.",
  "Built for voice control and human-like output so it doesn't read like \"AI content.\"",
  "KDP metadata generated so upload can take under 5 minutes once your manuscript is ready.",
];

export default function ComparisonSection() {
  return (
    <section className="py-24 bg-[#0B1220] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C65BFF]/30 to-transparent" />

      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-16 fade-up">
          <p className="section-label mb-3">The Difference</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            ChatGPT can write.{" "}
            <span className="gradient-text">AI Book Writer helps you finish.</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Finishing a book takes structure, momentum, and a thousand tiny decisions.
            AI Book Writer drastically reduces friction with a proven process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 fade-up">
          {/* ChatGPT column */}
          <div className="glass-card rounded-2xl p-6 border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-sm font-bold text-white/60">GPT</span>
              </div>
              <h3 className="text-lg font-semibold text-white/60" style={{ fontFamily: "'Sora', sans-serif" }}>
                ChatGPT
              </h3>
            </div>
            <ul className="space-y-4">
              {chatgptCons.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/50" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <X className="w-5 h-5 text-red-400/70 flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Book Writer column */}
          <div className="pricing-featured rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F66FF] to-[#C65BFF] flex items-center justify-center">
                <span className="text-xs font-bold text-white">AI</span>
              </div>
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                AI Book Writer
              </h3>
            </div>
            <ul className="space-y-4">
              {ourPros.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <Check className="w-5 h-5 text-[#4F66FF] flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-white/40 mt-8 text-sm fade-up" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Use ChatGPT for snippets. Use AI Book Writer for the whole book.
        </p>
      </div>
    </section>
  );
}
