/**
 * HeroSection — Dark Tech Premium
 * Full-bleed dark hero with gradient headline, animated badge, dual CTAs
 */

import { ArrowRight, Play, Sparkles } from "lucide-react";

export default function HeroSection() {
  const handleScroll = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310419663031143876/guM3tY94oioNnX28ZnAhwv/hero-bg-Xoq5ts3qFxfrLePtSkvepV.webp)`,
        }}
      />
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1220]/70 via-[#0B1220]/50 to-[#0B1220]" />
      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid-bg opacity-30" />

      <div className="relative z-10 container text-center max-w-5xl mx-auto px-4">
        {/* Promo badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#4F66FF]/40 bg-[#4F66FF]/10 text-sm text-[#4F66FF] font-medium mb-8 fade-up">
          <Sparkles className="w-4 h-4" />
          <span>Spring Sale — Use code <strong>SPRING10</strong> for 10% OFF</span>
        </div>

        {/* Main headline */}
        <h1
          className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 fade-up"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          The Ultimate{" "}
          <span className="gradient-text">AI Book</span>
          <br />
          Writing Generator
        </h1>

        {/* Subheadline */}
        <p
          className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed fade-up"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Turn a raw idea into a complete, published book within minutes.
          <br />
          <span className="text-white/90 font-medium">Without the "AI wrote this" vibe.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 fade-up">
          <button
            onClick={() => handleScroll("#pricing")}
            className="btn-glow px-8 py-4 rounded-xl text-base font-bold text-white flex items-center gap-2 group"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Get AI Book Writer
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => handleScroll("#workflow")}
            className="px-8 py-4 rounded-xl text-base font-semibold text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-all flex items-center gap-2"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <Play className="w-4 h-4" />
            See how it works
          </button>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/50 fade-up">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500"].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#0B1220] flex items-center justify-center text-[10px] font-bold text-white`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span>Trusted by <strong className="text-white/80">30,000+</strong> authors</span>
          </div>
          <span className="hidden sm:block text-white/20">|</span>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1"><strong className="text-white/80">4.9/5</strong> rating</span>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1220] to-transparent" />
    </section>
  );
}
