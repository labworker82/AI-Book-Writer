/**
 * WhySection — "Finally write the book you've been thinking about"
 * 5 benefit cards in a responsive grid
 */

import { Zap, Award, Mic, BookOpen, Rocket } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Get to market fast",
    desc: "Turn a raw idea into a complete manuscript in minutes, not months. Skip the endless outlining, drafting, and formatting.",
    color: "#4F66FF",
  },
  {
    icon: Award,
    title: "Real authority",
    desc: "Convert your knowledge into a book that builds trust, positions you as a credible expert, and supports your offers.",
    color: "#C65BFF",
  },
  {
    icon: Mic,
    title: "Sound like you, not AI",
    desc: "Control tone, writing style, and structure. Your book should read like it's written by a human, not by ChatGPT.",
    color: "#4F66FF",
  },
  {
    icon: BookOpen,
    title: "Cohesive from start to end",
    desc: "Our proprietary algorithm ensures your book flows naturally, stays consistent, and reads like it was crafted by a real author.",
    color: "#C65BFF",
  },
  {
    icon: Rocket,
    title: "Publish-ready, not \"almost\"",
    desc: "We generate Amazon KDP-ready metadata so uploading your book takes under 5 minutes. No extra tools, no guesswork.",
    color: "#4F66FF",
  },
];

export default function WhySection() {
  return (
    <section className="py-24 bg-[#0B1220] relative">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16 fade-up">
          <p className="section-label mb-3">Why AI Book Writer</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Finally write the book you've
            <br />
            <span className="gradient-text">been thinking about.</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Outfit', sans-serif" }}>
            You already have the idea. The expertise. The intent. AI Book Writer handles the hard part,
            so your book actually gets written and out into the world.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 hover:border-white/20 transition-all duration-300 group fade-up"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${b.color}20`, border: `1px solid ${b.color}40` }}
              >
                <b.icon className="w-5 h-5" style={{ color: b.color }} />
              </div>
              <h3
                className="text-lg font-semibold text-white mb-2"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {b.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {b.desc}
              </p>
            </div>
          ))}

          {/* Book mockup card */}
          <div className="glass-card rounded-2xl overflow-hidden fade-up" style={{ transitionDelay: "400ms" }}>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031143876/guM3tY94oioNnX28ZnAhwv/book-mockup-enuU9nHMUaVMjvgkBMNKSB.webp"
              alt="AI-generated book mockup"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
