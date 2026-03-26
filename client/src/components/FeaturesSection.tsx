/**
 * FeaturesSection — "Everything you need to ship a real book"
 * 6-feature grid with icons
 */

import { FileText, Palette, Database, Image, Tag, Wand2 } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Done-for-you",
    desc: "Get a complete manuscript from cover to cover, including chapters, preface, copyright, acknowledgements, author's bio, and more.",
    badge: null,
  },
  {
    icon: Palette,
    title: "Custom writing styles",
    desc: "Upload writing samples and steer tone, pacing, and structure. Keep it consistent across the whole book.",
    badge: null,
  },
  {
    icon: Database,
    title: "Custom knowledge",
    desc: "Upload documents and reference material so the book can use your source content, not generic fluff.",
    badge: null,
  },
  {
    icon: Image,
    title: "Book cover generator",
    desc: "Automatically generate a stunning, catchy book cover that matches your audience's vibe.",
    badge: null,
  },
  {
    icon: Tag,
    title: "Amazon KDP metadata",
    desc: "Generate Amazon KDP-optimized descriptions, keywords, and categories. Publish in minutes.",
    badge: null,
  },
  {
    icon: Wand2,
    title: "AI Editor",
    desc: "Polish your manuscript easily at the click of a button with our powerful AI editing suite.",
    badge: "Pro",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-[#0d1526] relative">
      {/* Subtle gradient top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4F66FF]/30 to-transparent" />

      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 fade-up">
          <p className="section-label mb-3">Built for Serious Authors</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Everything you need to{" "}
            <span className="gradient-text">ship a real book.</span>
          </h2>
          <p className="text-white/60 text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Here's what you get with every click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 hover:border-[#4F66FF]/30 transition-all duration-300 group fade-up relative"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {f.badge && (
                <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full bg-[#C65BFF]/20 text-[#C65BFF] border border-[#C65BFF]/30">
                  {f.badge}
                </span>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-[#4F66FF]/10 border border-[#4F66FF]/20 group-hover:bg-[#4F66FF]/20 transition-colors">
                <f.icon className="w-5 h-5 text-[#4F66FF]" />
              </div>
              <h3
                className="text-lg font-semibold text-white mb-2"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {f.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
