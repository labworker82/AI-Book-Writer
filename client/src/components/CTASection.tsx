/**
 * CTASection — Final CTA before footer
 */

import { ArrowRight, BookOpen } from "lucide-react";

export default function CTASection() {
  const handleScroll = () => {
    const el = document.querySelector("#pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-24 bg-[#0B1220] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C65BFF]/30 to-transparent" />
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-r from-[#4F66FF]/10 to-[#C65BFF]/10 blur-3xl pointer-events-none" />
      <div className="dot-grid-bg absolute inset-0 opacity-20" />

      <div className="container max-w-3xl mx-auto px-4 text-center relative fade-up">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4F66FF] to-[#C65BFF] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#4F66FF]/30">
          <BookOpen className="w-8 h-8 text-white" />
        </div>

        <h2
          className="text-4xl md:text-5xl font-bold text-white mb-4"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Your first book is just{" "}
          <span className="gradient-text">minutes away.</span>
        </h2>
        <p
          className="text-white/60 text-lg mb-8"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Start creating and publishing books today.
          <br />
          Trusted by over 30,000 authors worldwide.
        </p>

        <button
          onClick={handleScroll}
          className="btn-glow px-10 py-4 rounded-xl text-base font-bold text-white flex items-center gap-2 mx-auto group"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Get AI Book Writer
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
}
