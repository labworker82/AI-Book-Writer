import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles, Check, Save, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";

// ── Book Length Options ──────────────────────────────────────────────────────
const BOOK_LENGTHS = [
  { value: "mini",     label: "Mini",     words: "Up to 5,000 words",  target: 5000,  chapters: 5,  description: "Perfect for short guides or essays" },
  { value: "short",    label: "Short",    words: "Up to 10,000 words", target: 10000, chapters: 8,  description: "Great for how-to books and manifestos" },
  { value: "compact",  label: "Compact",  words: "Up to 20,000 words", target: 20000, chapters: 12, description: "Solid business or self-help book" },
  { value: "medium",   label: "Medium",   words: "Up to 30,000 words", target: 30000, chapters: 15, description: "Standard nonfiction or short novel" },
  { value: "extended", label: "Extended", words: "Up to 40,000 words", target: 40000, chapters: 18, description: "Full-length nonfiction or novella" },
  { value: "full",     label: "Full",     words: "Up to 50,000 words", target: 50000, chapters: 20, description: "Complete novel or comprehensive guide" },
];

// ── Genres ───────────────────────────────────────────────────────────────────
const GENRES = [
  "Nonfiction", "Self-Help", "Business", "Memoir", "Biography", "History",
  "Science", "Philosophy", "Psychology", "Spirituality", "Health & Wellness",
  "Fiction", "Fantasy", "Science Fiction", "Romance", "Mystery", "Thriller",
  "Horror", "Literary Fiction", "Adventure", "Historical Fiction", "Children's",
];

// ── Tone & Voice Controls ────────────────────────────────────────────────────
const WRITING_TONES = [
  { value: "professional",   label: "Professional & Authoritative" },
  { value: "conversational", label: "Conversational & Friendly" },
  { value: "inspirational",  label: "Inspirational & Motivational" },
  { value: "academic",       label: "Academic & Scholarly" },
  { value: "humorous",       label: "Humorous & Witty" },
  { value: "serious",        label: "Serious & Formal" },
  { value: "empathetic",     label: "Empathetic & Warm" },
  { value: "bold",           label: "Bold & Direct" },
  { value: "storytelling",   label: "Storytelling & Narrative" },
  { value: "poetic",         label: "Poetic & Lyrical" },
  { value: "journalistic",   label: "Journalistic & Investigative" },
  { value: "coaching",       label: "Coaching & Encouraging" },
];

const POV_OPTIONS = [
  { value: "first",       label: "First Person (I/We)" },
  { value: "second",      label: "Second Person (You)" },
  { value: "third_close", label: "Third Person Close (He/She/They)" },
  { value: "third_omni",  label: "Third Person Omniscient" },
];

const FORMALITY_OPTIONS = [
  { value: "very_casual",    label: "Very Casual — Like texting a friend" },
  { value: "casual",         label: "Casual — Relaxed, everyday language" },
  { value: "neutral",        label: "Neutral — Clear and accessible" },
  { value: "formal",         label: "Formal — Polished and professional" },
  { value: "very_formal",    label: "Very Formal — Academic / legal style" },
];

const PACING_OPTIONS = [
  { value: "fast",     label: "Fast — Short punchy sentences, high energy" },
  { value: "moderate", label: "Moderate — Balanced rhythm" },
  { value: "slow",     label: "Slow & Deliberate — Deep, reflective prose" },
];

const SENTENCE_LENGTH_OPTIONS = [
  { value: "short",  label: "Short & Punchy — 10–15 words avg" },
  { value: "medium", label: "Medium — 15–25 words avg" },
  { value: "long",   label: "Long & Complex — 25+ words avg" },
  { value: "varied", label: "Varied — Mix of short and long" },
];

const HUMOR_OPTIONS = [
  { value: "none",     label: "None — Completely serious" },
  { value: "subtle",   label: "Subtle — Occasional dry wit" },
  { value: "moderate", label: "Moderate — Friendly jokes and anecdotes" },
  { value: "heavy",    label: "Heavy — Humor is a core feature" },
];

const VOCABULARY_OPTIONS = [
  { value: "simple",       label: "Simple — Everyday words, no jargon" },
  { value: "intermediate", label: "Intermediate — Some domain terms explained" },
  { value: "advanced",     label: "Advanced — Rich vocabulary, assumes knowledge" },
  { value: "technical",    label: "Technical — Industry-specific terminology" },
];

const STEPS = [
  { id: 1, label: "Book Info" },
  { id: 2, label: "Length & Style" },
  { id: 3, label: "Voice & Structure" },
];

const DRAFT_KEY = "ai-book-writer-new-book-draft";

export default function NewBook() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [savedBookId, setSavedBookId] = useState<number | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1 — Book Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [subgenre, setSubgenre] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Step 2 — Length & Style
  const [bookLength, setBookLength] = useState("medium");
  const [tone, setTone] = useState("conversational");
  const [pov, setPov] = useState("first");
  const [formality, setFormality] = useState("neutral");
  const [pacing, setPacing] = useState("moderate");

  // Step 3 — Voice & Structure
  const [sentenceLength, setSentenceLength] = useState("varied");
  const [humor, setHumor] = useState("none");
  const [vocabulary, setVocabulary] = useState("intermediate");
  const [authorName, setAuthorName] = useState("");
  const [writingStyle, setWritingStyle] = useState("");
  const [customKnowledge, setCustomKnowledge] = useState("");
  const [includePreface, setIncludePreface] = useState(false);
  const [includeDedication, setIncludeDedication] = useState(false);
  const [includeAcknowledgements, setIncludeAcknowledgements] = useState(false);
  const [includeEpilogue, setIncludeEpilogue] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.title) setTitle(d.title);
        if (d.description) setDescription(d.description);
        if (d.genre) setGenre(d.genre);
        if (d.subgenre) setSubgenre(d.subgenre);
        if (d.targetAudience) setTargetAudience(d.targetAudience);
        if (d.bookLength) setBookLength(d.bookLength);
        if (d.tone) setTone(d.tone);
        if (d.pov) setPov(d.pov);
        if (d.formality) setFormality(d.formality);
        if (d.pacing) setPacing(d.pacing);
        if (d.sentenceLength) setSentenceLength(d.sentenceLength);
        if (d.humor) setHumor(d.humor);
        if (d.vocabulary) setVocabulary(d.vocabulary);
        if (d.authorName) setAuthorName(d.authorName);
        if (d.writingStyle) setWritingStyle(d.writingStyle);
        if (d.customKnowledge) setCustomKnowledge(d.customKnowledge);
        if (d.includePreface !== undefined) setIncludePreface(d.includePreface);
        if (d.includeDedication !== undefined) setIncludeDedication(d.includeDedication);
        if (d.includeAcknowledgements !== undefined) setIncludeAcknowledgements(d.includeAcknowledgements);
        if (d.includeEpilogue !== undefined) setIncludeEpilogue(d.includeEpilogue);
        if (d.savedBookId) setSavedBookId(d.savedBookId);
        if (d.step) setStep(d.step);
      }
    } catch { /* ignore */ }
  }, []);

  // Save draft to localStorage whenever any field changes
  useEffect(() => {
    if (!title.trim()) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title, description, genre, subgenre, targetAudience,
        bookLength, tone, pov, formality, pacing,
        sentenceLength, humor, vocabulary,
        authorName, writingStyle, customKnowledge,
        includePreface, includeDedication, includeAcknowledgements, includeEpilogue,
        savedBookId, step,
      }));
    } catch { /* ignore */ }
  }, [title, description, genre, subgenre, targetAudience,
    bookLength, tone, pov, formality, pacing,
    sentenceLength, humor, vocabulary,
    authorName, writingStyle, customKnowledge,
    includePreface, includeDedication, includeAcknowledgements, includeEpilogue,
    savedBookId, step]);

  const createMutation = trpc.books.create.useMutation();
  const updateMutation = trpc.books.update.useMutation();

  const buildPayload = () => {
    const selectedLength = BOOK_LENGTHS.find(l => l.value === bookLength) || BOOK_LENGTHS[3];
    // Build a rich voice description from all the controls
    const voiceDescription = [
      `POV: ${POV_OPTIONS.find(p => p.value === pov)?.label}`,
      `Formality: ${FORMALITY_OPTIONS.find(f => f.value === formality)?.label.split(" — ")[0]}`,
      `Pacing: ${PACING_OPTIONS.find(p => p.value === pacing)?.label.split(" — ")[0]}`,
      `Sentence length: ${SENTENCE_LENGTH_OPTIONS.find(s => s.value === sentenceLength)?.label.split(" — ")[0]}`,
      `Humor: ${HUMOR_OPTIONS.find(h => h.value === humor)?.label.split(" — ")[0]}`,
      `Vocabulary: ${VOCABULARY_OPTIONS.find(v => v.value === vocabulary)?.label.split(" — ")[0]}`,
    ].join(". ");

    const combinedStyle = [writingStyle, voiceDescription].filter(Boolean).join("\n\n");

    return {
      title: title.trim(),
      description: description.trim() || undefined,
      genre: genre || undefined,
      subgenre: subgenre.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      tone: tone || undefined,
      authorName: authorName.trim() || undefined,
      writingStyle: combinedStyle || undefined,
      customKnowledge: customKnowledge.trim() || undefined,
      includePreface,
      includeDedication,
      includeAcknowledgements,
      includeEpilogue,
      targetWordCount: selectedLength.target,
      suggestedChapters: selectedLength.chapters,
    };
  };

  const triggerAutoSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!title.trim()) return;
      const payload = buildPayload();
      try {
        if (savedBookId) {
          await updateMutation.mutateAsync({ bookId: savedBookId, ...payload });
        } else {
          const result = await createMutation.mutateAsync(payload);
          setSavedBookId(result.bookId);
        }
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2500);
      } catch { /* silent fail for auto-save */ }
    }, 1200);
  };

  useEffect(() => {
    if (title.trim()) triggerAutoSave();
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [title, description, genre, subgenre, targetAudience,
    bookLength, tone, pov, formality, pacing,
    sentenceLength, humor, vocabulary,
    authorName, writingStyle, customKnowledge,
    includePreface, includeDedication, includeAcknowledgements, includeEpilogue]);

  const handleFinish = () => {
    if (!title.trim()) { toast.error("Please enter a book title"); return; }
    const payload = buildPayload();
    if (savedBookId) {
      updateMutation.mutate({ bookId: savedBookId, ...payload }, {
        onSuccess: () => {
          localStorage.removeItem(DRAFT_KEY);
          navigate(`/books/${savedBookId}`);
        },
        onError: (err) => toast.error("Failed to save: " + err.message),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => {
          localStorage.removeItem(DRAFT_KEY);
          toast.success("Book created! Now generate your outline.");
          navigate(`/books/${data.bookId}`);
        },
        onError: (err) => toast.error("Failed to create: " + err.message),
      });
    }
  };

  const selectedLength = BOOK_LENGTHS.find(l => l.value === bookLength) || BOOK_LENGTHS[3];
  const canProceedStep1 = title.trim().length > 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-4 md:py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
              New Book
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-0.5 truncate">Fill in the details to generate your book</p>
          </div>
          {autoSaved && (
            <div className="flex items-center gap-1 text-xs text-green-400 flex-shrink-0">
              <Save className="w-3 h-3" /><span className="hidden sm:inline">Saved</span>
            </div>
          )}
          {savedBookId && !autoSaved && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Save className="w-3 h-3" /><span className="hidden sm:inline">Draft</span>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                step === s.id ? "bg-primary text-white" :
                step > s.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Book Info ── */}
        {step === 1 && (
          <div className="glass-card rounded-2xl p-4 md:p-6 space-y-4">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Book Information</h2>

            <div>
              <Label className="text-foreground mb-1.5 block text-sm">Book Title <span className="text-red-400">*</span></Label>
              <Input
                placeholder="e.g., The Art of Deep Work"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-border text-foreground"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-saved once you enter a title.</p>
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block text-sm">Description / Premise</Label>
              <Textarea
                placeholder="What is this book about? What's the core message or story?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-input border-border text-foreground min-h-[80px] resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Subgenre / Category</Label>
                <Input
                  placeholder="e.g., Productivity, Space Opera"
                  value={subgenre}
                  onChange={(e) => setSubgenre(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block text-sm">Target Audience</Label>
              <Input
                placeholder="e.g., Entrepreneurs aged 25–45, Young adult readers"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Length & Style ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Book Length */}
            <div className="glass-card rounded-2xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">Book Length</h2>
              <p className="text-xs text-muted-foreground mb-4">Choose how long your book will be. The AI will target this word count.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BOOK_LENGTHS.map((len) => (
                  <button
                    key={len.value}
                    onClick={() => setBookLength(len.value)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      bookLength === len.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/20 text-foreground hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <div className="font-semibold text-sm">{len.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{len.words}</div>
                    <div className="text-xs mt-1 opacity-70 hidden sm:block">{len.description}</div>
                  </button>
                ))}
              </div>
              {/* Summary */}
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary">
                <span className="font-semibold">{selectedLength.label} Book:</span> ~{selectedLength.words} across ~{selectedLength.chapters} chapters (~{Math.round(selectedLength.target / selectedLength.chapters).toLocaleString()} words/chapter)
              </div>
            </div>

            {/* Tone */}
            <div className="glass-card rounded-2xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">Writing Tone</h2>
              <p className="text-xs text-muted-foreground mb-3">The overall emotional register of your writing.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WRITING_TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-left text-sm transition-all",
                      tone === t.value
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-muted/20 text-foreground hover:border-primary/40"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* POV + Formality */}
            <div className="glass-card rounded-2xl p-4 md:p-6 space-y-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Perspective & Formality</h2>
              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Point of View</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POV_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPov(p.value)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-left text-sm transition-all",
                        pov === p.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-muted/20 text-foreground hover:border-primary/40"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Formality Level</Label>
                <div className="space-y-2">
                  {FORMALITY_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormality(f.value)}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg border text-left text-sm transition-all",
                        formality === f.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-muted/20 text-foreground hover:border-primary/40"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Voice & Structure ── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Pacing, Sentences, Humor, Vocabulary */}
            <div className="glass-card rounded-2xl p-4 md:p-6 space-y-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Voice Details</h2>

              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Pacing</Label>
                <div className="space-y-2">
                  {PACING_OPTIONS.map((p) => (
                    <button key={p.value} onClick={() => setPacing(p.value)}
                      className={cn("w-full px-3 py-2 rounded-lg border text-left text-sm transition-all",
                        pacing === p.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-muted/20 text-foreground hover:border-primary/40")}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Sentence Length</Label>
                <div className="space-y-2">
                  {SENTENCE_LENGTH_OPTIONS.map((s) => (
                    <button key={s.value} onClick={() => setSentenceLength(s.value)}
                      className={cn("w-full px-3 py-2 rounded-lg border text-left text-sm transition-all",
                        sentenceLength === s.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-muted/20 text-foreground hover:border-primary/40")}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground mb-1.5 block text-sm">Humor Level</Label>
                  <div className="space-y-2">
                    {HUMOR_OPTIONS.map((h) => (
                      <button key={h.value} onClick={() => setHumor(h.value)}
                        className={cn("w-full px-3 py-2 rounded-lg border text-left text-sm transition-all",
                          humor === h.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-muted/20 text-foreground hover:border-primary/40")}>
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-foreground mb-1.5 block text-sm">Vocabulary Level</Label>
                  <div className="space-y-2">
                    {VOCABULARY_OPTIONS.map((v) => (
                      <button key={v.value} onClick={() => setVocabulary(v.value)}
                        className={cn("w-full px-3 py-2 rounded-lg border text-left text-sm transition-all",
                          vocabulary === v.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-muted/20 text-foreground hover:border-primary/40")}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Author & Custom Knowledge */}
            <div className="glass-card rounded-2xl p-4 md:p-6 space-y-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Author Voice & Knowledge</h2>

              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Author Name</Label>
                <Input placeholder="Your name or pen name" value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="bg-input border-border text-foreground" />
              </div>

              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Writing Style Notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  placeholder="e.g., Write like Malcolm Gladwell — use stories and data together. Start each chapter with a hook."
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[80px] resize-none text-sm"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Custom Knowledge / Context <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  placeholder="Paste facts, research, personal stories, or key points you want included in the book..."
                  value={customKnowledge}
                  onChange={(e) => setCustomKnowledge(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[100px] resize-none text-sm"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">This context is injected into every chapter generation call.</p>
              </div>
            </div>

            {/* Book Structure */}
            <div className="glass-card rounded-2xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-4">Optional Sections</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Preface", sub: "Author's intro before the book", state: includePreface, set: setIncludePreface },
                  { label: "Dedication", sub: "Dedicate the book to someone", state: includeDedication, set: setIncludeDedication },
                  { label: "Acknowledgements", sub: "Thank contributors", state: includeAcknowledgements, set: setIncludeAcknowledgements },
                  { label: "Epilogue", sub: "Closing thoughts after final chapter", state: includeEpilogue, set: setIncludeEpilogue },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                    <Switch checked={item.state} onCheckedChange={item.set} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="border-border gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
              className="btn-glow text-white gap-2 flex-1 sm:flex-none sm:min-w-[160px]"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-glow text-white gap-2 flex-1 sm:flex-none sm:min-w-[200px]"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Create Book</>
              )}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
