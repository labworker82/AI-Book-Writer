/**
 * BonusSection — "Free bonus included"
 * Bonus offer with book mockup and bullet points
 */

import { Gift, ArrowRight } from "lucide-react";

const bonusPoints = [
  { page: "Page 15", text: "The secret \"cash cow\" niche with near zero competition, raking in thousands." },
  { page: "Page 18", text: "A nonfiction trend that went from fad to multi-million dollar market." },
  { page: "Page 46", text: "The fiction genre mashup dominating sales charts and exploding in demand." },
  { page: "Page 49", text: "A controversial fiction genre publishers avoid but indie authors cash in on." },
  { page: "Page 53", text: "The children's book twist parents love but publishers have ignored." },
  { page: "Page 92", text: "The #1 overlooked low-content niche selling by the thousands." },
  { page: "Page 123", text: "A bizarre but wildly profitable travel book niche readers can't get enough of." },
];

export default function BonusSection() {
  return (
    <section className="py-24 bg-[#0B1220] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C65BFF]/30 to-transparent" />
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#C65BFF]/5 blur-3xl pointer-events-none" />

      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12 fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C65BFF]/30 bg-[#C65BFF]/10 text-sm text-[#C65BFF] font-medium mb-6">
            <Gift className="w-4 h-4" />
            Limited Time Bonus
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Free bonus{" "}
            <span className="gradient-text">included.</span>
          </h2>
          <p className="text-white/60 text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
            With the signup of any plan. For a limited time only.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center fade-up">
          {/* Book image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#C65BFF]/20 blur-3xl rounded-full" />
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031143876/guM3tY94oioNnX28ZnAhwv/bonus-book-W2cdmNALtGEHuJa2SCnGA4.webp"
                alt="AI Book Writer Niche Guide 2026"
                className="relative w-64 md:w-80 rounded-2xl shadow-2xl shadow-[#4F66FF]/20"
              />
              <div className="absolute -top-3 -right-3 bg-gradient-to-br from-[#4F66FF] to-[#C65BFF] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                $49 value — FREE
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              AI Book Writer's Niche Guide 2026
            </h3>
            <p className="text-[#4F66FF] font-semibold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              100+ Top Niches & Sub-niches for Amazon Kindle & Print in 2026
            </p>
            <p className="text-white/60 text-sm mb-6 leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sign up today and unlock our exclusive, never-before-released 130-page guide to the most profitable and untapped book niches!
            </p>

            <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-4">
              Here's a sliver of what you'll discover:
            </p>

            <ul className="space-y-3">
              {bonusPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <span className="text-[#4F66FF] font-bold text-xs whitespace-nowrap mt-0.5 min-w-[60px]">
                    {point.page}
                  </span>
                  <span className="text-white/70 text-sm leading-relaxed">— {point.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                const el = document.querySelector("#pricing");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-glow mt-8 px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 group"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Claim Your Free Bonus
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
