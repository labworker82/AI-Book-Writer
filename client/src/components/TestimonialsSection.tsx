/**
 * TestimonialsSection — "Hear from our authors"
 * Quote cards with star ratings
 */

const testimonials = [
  {
    quote: "AI Book Writer is immediately a superior product to many other competitors in this fairly crowded niche of AI-generated text… the drafts are consistently good to very good in terms of internal consistency, logical progression, and creative material.",
    name: "Sean Chao",
    role: "Author & Entrepreneur",
    avatar: "SC",
    color: "#4F66FF",
  },
  {
    quote: "Quality is pretty good out of the box compared to competition. And the recent Editor mode (finally!), which makes it possible to edit and regenerate chapter by chapter on the fly.",
    name: "Stanley Jay",
    role: "Independent Publisher",
    avatar: "SJ",
    color: "#C65BFF",
  },
  {
    quote: "Intuitive tool… What I love most about AI Book Writer is its simplicity. You don't need to worry about remembering complex prompts or mastering the art of prompting gen AI. The system is idiot-proof. Overall, a game-changer!",
    name: "Sam Choo",
    role: "Business Author",
    avatar: "SC",
    color: "#4F66FF",
  },
  {
    quote: "I published my first book in under 3 hours. The quality was so good that my editor barely had any notes. This tool has completely changed how I approach content creation.",
    name: "Maria Rodriguez",
    role: "Self-help Author",
    avatar: "MR",
    color: "#C65BFF",
  },
  {
    quote: "The Amazon KDP metadata generator alone is worth the price. I used to spend hours researching keywords. Now it's done in seconds and my books rank higher.",
    name: "David Kim",
    role: "Kindle Publisher",
    avatar: "DK",
    color: "#4F66FF",
  },
  {
    quote: "I've tried every AI writing tool out there. This is the only one that actually understands the structure of a full-length book. The chapter coherence is remarkable.",
    name: "Lisa Thompson",
    role: "Fiction Writer",
    avatar: "LT",
    color: "#C65BFF",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-[#0d1526] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4F66FF]/30 to-transparent" />

      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 fade-up">
          <p className="section-label mb-3">Testimonials</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Hear from our{" "}
            <span className="gradient-text">authors.</span>
          </h2>
          <p className="text-white/60 text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Our customers create hundreds of books every month and are absolutely loving it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 hover:border-white/20 transition-all duration-300 fade-up flex flex-col"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/70 text-sm leading-relaxed flex-1 mb-5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}80)` }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {t.name}
                  </p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
