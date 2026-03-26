/**
 * GenresSection — "Nonfiction or fiction. Pick your lane."
 * Two-column tag cloud layout
 */

const nonfiction = [
  "Biography", "Business/Finance", "Computers/Technology", "Craft/Hobbies",
  "Education", "Food", "Health/Wellness", "History", "Medical", "Music",
  "Nature/Environment", "Parenting/Family", "Philosophy", "Politics",
  "Psychology", "Religion/Spirituality", "Science", "Self-help",
  "Social Issues", "Travel",
];

const fiction = [
  "Adventure", "Comedy/Humor", "Contemporary Fiction", "Crime/Detective",
  "Drama", "Fairy Tale", "Fantasy", "Historical Fiction", "Horror",
  "Literary Fiction", "Magical Realism", "Romance", "Science Fiction",
  "Thriller/Mystery", "Western", "Young Adult",
];

export default function GenresSection() {
  return (
    <section className="py-24 bg-[#0d1526] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4F66FF]/30 to-transparent" />

      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 fade-up">
          <p className="section-label mb-3">Genres</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Nonfiction or fiction.{" "}
            <span className="gradient-text">Pick your lane.</span>
          </h2>
          <p className="text-white/60 text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Whatever you're thinking of writing, AI Book Writer can help. We are always adding more genres.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nonfiction */}
          <div className="glass-card rounded-2xl p-6 fade-up">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">📚</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                Nonfiction
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {nonfiction.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1.5 rounded-lg text-sm bg-[#4F66FF]/10 border border-[#4F66FF]/20 text-white/80 hover:bg-[#4F66FF]/20 hover:text-white transition-colors cursor-default"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Fiction */}
          <div className="glass-card rounded-2xl p-6 fade-up" style={{ transitionDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">✨</span>
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                Fiction
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#C65BFF]/20 text-[#C65BFF] border border-[#C65BFF]/30">
                Pro only
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {fiction.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1.5 rounded-lg text-sm bg-[#C65BFF]/10 border border-[#C65BFF]/20 text-white/80 hover:bg-[#C65BFF]/20 hover:text-white transition-colors cursor-default"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
