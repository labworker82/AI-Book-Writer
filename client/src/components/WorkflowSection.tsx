/**
 * WorkflowSection — "Input one idea or take full control"
 * Two-column hands-off vs hands-on layout with workflow illustration
 */

import { CheckCircle2 } from "lucide-react";

const handsOff = [
  "Start with a one-liner",
  "Get a cohesive, book-length draft",
  "Then refine only what you want",
];

const handsOn = [
  "Book cover design",
  "Themes & tone",
  "Characters, plots & story beats (fiction)",
  "Writing style & voice",
  "Custom knowledge upload",
  "Each chapter's contents",
  "AI editor tools (Pro only)",
];

export default function WorkflowSection() {
  return (
    <section id="workflow" className="py-24 bg-[#0B1220] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C65BFF]/30 to-transparent" />

      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 fade-up">
          <p className="section-label mb-3">Your Workflow</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Input one idea or{" "}
            <span className="gradient-text">take full control.</span>
            <br />Your call.
          </h2>
          <p className="text-white/60 text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Start with one sentence. Or steer every detail.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Hands-off */}
          <div className="glass-card rounded-2xl p-8 fade-up border-[#4F66FF]/20 hover:border-[#4F66FF]/40 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#4F66FF]/10 border border-[#4F66FF]/30 flex items-center justify-center">
                <span className="text-[#4F66FF] text-lg">⚡</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Hands-off
                </h3>
                <p className="text-white/50 text-sm">One-sentence prompt → full draft.</p>
              </div>
            </div>
            <ul className="space-y-3">
              {handsOff.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <CheckCircle2 className="w-5 h-5 text-[#4F66FF] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Hands-on */}
          <div className="glass-card rounded-2xl p-8 fade-up border-[#C65BFF]/20 hover:border-[#C65BFF]/40 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#C65BFF]/10 border border-[#C65BFF]/30 flex items-center justify-center">
                <span className="text-[#C65BFF] text-lg">🎛️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Hands-on
                </h3>
                <p className="text-white/50 text-sm">Dial in the parts that matter.</p>
              </div>
            </div>
            <ul className="space-y-3">
              {handsOn.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  <CheckCircle2 className="w-5 h-5 text-[#C65BFF] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Workflow illustration */}
        <div className="glass-card rounded-2xl overflow-hidden fade-up">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031143876/guM3tY94oioNnX28ZnAhwv/workflow-illustration-VzdijTAR7dKogJWEC4GqKC.webp"
            alt="AI Book Writer workflow illustration"
            className="w-full object-cover max-h-80"
          />
        </div>

        <p className="text-center text-white/50 mt-6 text-sm fade-up" style={{ fontFamily: "'Outfit', sans-serif" }}>
          You can mix both. Start hands-off, then steer the details later.
        </p>
      </div>
    </section>
  );
}
