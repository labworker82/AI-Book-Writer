import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, BookOpen, Sparkles, Check, Save,
  Wand2, Loader2, RefreshCw, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";
import { BOOK_STYLES, type BookStyleTemplate } from "@shared/bookStyles";

// ── Book Length Options ──────────────────────────────────────────────────────
const BOOK_LENGTHS = [
  { value: "mini",     label: "Mini",     words: "Up to 5,000 words",  target: 5000,  chapters: 5,  description: "Short guides, brochures, eBooks" },
  { value: "short",    label: "Short",    words: "Up to 10,000 words", target: 10000, chapters: 8,  description: "How-to books, manifestos" },
  { value: "compact",  label: "Compact",  words: "Up to 20,000 words", target: 20000, chapters: 12, description: "Business or self-help books" },
  { value: "medium",   label: "Medium",   words: "Up to 30,000 words", target: 30000, chapters: 15, description: "Standard nonfiction or short novel" },
  { value: "extended", label: "Extended", words: "Up to 40,000 words", target: 40000, chapters: 18, description: "Full nonfiction or novella" },
  { value: "full",     label: "Full",     words: "Up to 50,000 words", target: 50000, chapters: 20, description: "Complete novel or comprehensive guide" },
];

const GENRES = [
  "Nonfiction", "Self-Help", "Business", "Memoir", "Biography", "History",
  "Science", "Philosophy", "Psychology", "Spirituality", "Health & Wellness",
  "Fiction", "Fantasy", "Science Fiction", "Romance", "Mystery", "Thriller",
  "Horror", "Literary Fiction", "Adventure", "Historical Fiction", "Children's",
];

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
  { value: "third_close", label: "Third Person Close" },
  { value: "third_omni",  label: "Third Person Omniscient" },
];

const FORMALITY_OPTIONS = [
  { value: "very_casual", label: "Very Casual" },
  { value: "casual",      label: "Casual" },
  { value: "neutral",     label: "Neutral" },
  { value: "formal",      label: "Formal" },
  { value: "very_formal", label: "Very Formal" },
];

const PACING_OPTIONS = [
  { value: "fast",     label: "Fast — Short, punchy" },
  { value: "moderate", label: "Moderate — Balanced" },
  { value: "slow",     label: "Slow — Deep, reflective" },
];

const SENTENCE_LENGTH_OPTIONS = [
  { value: "short",  label: "Short & Punchy" },
  { value: "medium", label: "Medium" },
  { value: "long",   label: "Long & Complex" },
  { value: "varied", label: "Varied" },
];

const HUMOR_OPTIONS = [
  { value: "none",     label: "None" },
  { value: "subtle",   label: "Subtle" },
  { value: "moderate", label: "Moderate" },
  { value: "heavy",    label: "Heavy" },
];

const VOCABULARY_OPTIONS = [
  { value: "simple",       label: "Simple" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",     label: "Advanced" },
  { value: "technical",    label: "Technical" },
];

// Steps: 0=Style Picker, 1=Book Info, 2=Length & Tone, 3=Voice & Structure
const STEPS = [
  { id: 0, label: "Style" },
  { id: 1, label: "Book Info" },
  { id: 2, label: "Length & Tone" },
  { id: 3, label: "Voice & Structure" },
];

const DRAFT_KEY = "ai-book-writer-new-book-draft";

export default function NewBook() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [savedBookId, setSavedBookId] = useState<number | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 0 — Style
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  // Step 1 — Book Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [subgenre, setSubgenre] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // AI Title Suggestions
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Step 2 — Length & Tone
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

  // Restore draft
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const d = JSON.parse(draft);
        if (d.selectedStyleId !== undefined) setSelectedStyleId(d.selectedStyleId);
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
        if (d.step !== undefined) setStep(d.step);
      }
    } catch { /* ignore */ }
  }, []);

  // Save draft
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        selectedStyleId, title, description, genre, subgenre, targetAudience,
        bookLength, tone, pov, formality, pacing,
        sentenceLength, humor, vocabulary,
        authorName, writingStyle, customKnowledge,
        includePreface, includeDedication, includeAcknowledgements, includeEpilogue,
        savedBookId, step,
      }));
    } catch { /* ignore */ }
  }, [selectedStyleId, title, description, genre, subgenre, targetAudience,
    bookLength, tone, pov, formality, pacing,
    sentenceLength, humor, vocabulary,
    authorName, writingStyle, customKnowledge,
    includePreface, includeDedication, includeAcknowledgements, includeEpilogue,
    savedBookId, step]);

  const createMutation = trpc.books.create.useMutation();
  const updateMutation = trpc.books.update.useMutation();
  const suggestTitlesMutation = trpc.books.suggestTitles.useMutation();

  // Apply a style template — pre-fills all defaults
  const applyStyle = useCallback((style: BookStyleTemplate) => {
    setSelectedStyleId(style.id);
    const d = style.defaults;
    setGenre(d.genre);
    setTone(d.tone);
    setBookLength(d.bookLength);
    setPov(d.pov);
    setFormality(d.formality);
    setPacing(d.pacing);
    setSentenceLength(d.sentenceLength);
    setHumor(d.humor);
    setVocabulary(d.vocabulary);
    setIncludePreface(d.includePreface);
    setIncludeDedication(d.includeDedication);
    setIncludeAcknowledgements(d.includeAcknowledgements);
    setIncludeEpilogue(d.includeEpilogue);
    if (d.writingStyleHint) setWritingStyle(d.writingStyleHint);
  }, []);

  // AI title suggestions
  const handleSuggestTitles = useCallback(async () => {
    if (!description.trim() && !genre) {
      toast.error("Add a description or genre first so the AI has something to work with.");
      return;
    }
    setLoadingSuggestions(true);
    setTitleSuggestions([]);
    try {
      const result = await suggestTitlesMutation.mutateAsync({
        description: description.trim(),
        genre,
        tone,
        bookStyle: selectedStyleId || undefined,
      });
      setTitleSuggestions(result.titles);
    } catch (err) {
      toast.error("Title suggestions failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoadingSuggestions(false);
    }
  }, [description, genre, tone, selectedStyleId, suggestTitlesMutation]);

  const buildPayload = () => {
    const selectedLength = BOOK_LENGTHS.find(l => l.value === bookLength) || BOOK_LENGTHS[3];
    const voiceDescription = [
      `POV: ${POV_OPTIONS.find(p => p.value === pov)?.label}`,
      `Formality: ${FORMALITY_OPTIONS.find(f => f.value === formality)?.label}`,
      `Pacing: ${PACING_OPTIONS.find(p => p.value === pacing)?.label.split(" — ")[0]}`,
      `Sentence length: ${SENTENCE_LENGTH_OPTIONS.find(s => s.value === sentenceLength)?.label}`,
      `Humor: ${HUMOR_OPTIONS.find(h => h.value === humor)?.label}`,
      `Vocabulary: ${VOCABULARY_OPTIONS.find(v => v.value === vocabulary)?.label}`,
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
      bookStyle: selectedStyleId || undefined,
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
      } catch { /* silent fail */ }
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
  const canProceedStep0 = true; // style is optional — can skip with "Start from scratch"
  const canProceedStep1 = title.trim().length > 0;
  const selectedStyle = BOOK_STYLES.find(s => s.id === selectedStyleId);

  // ── Reusable option button ──
  const OptionBtn = ({ value, current, onSelect, children }: {
    value: string; current: string; onSelect: (v: string) => void; children: React.ReactNode;
  }) => (
    <button
      onClick={() => onSelect(value)}
      className={cn(
        "px-3 py-2 rounded-lg border text-left text-sm transition-all",
        current === value
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border bg-muted/20 text-foreground hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );

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
            <p className="text-muted-foreground text-xs md:text-sm mt-0.5 truncate">
              {selectedStyle ? `${selectedStyle.emoji} ${selectedStyle.label}` : "Choose a style to get started"}
            </p>
          </div>
          {autoSaved && (
            <div className="flex items-center gap-1 text-xs text-green-400 flex-shrink-0">
              <Save className="w-3 h-3" /><span className="hidden sm:inline">Saved</span>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                step === s.id ? "bg-primary text-white" :
                step > s.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id + 1}</span>}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="w-3 h-px bg-border flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* ── Step 0: Style Picker ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">What kind of book are you writing?</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Choose a style and we'll pre-fill the best settings for you. You can customize everything in the next steps, or skip this and start from scratch.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BOOK_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      applyStyle(style);
                      setStep(1);
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border text-left transition-all group",
                      selectedStyleId === style.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{style.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={cn(
                            "font-semibold text-sm",
                            selectedStyleId === style.id ? "text-primary" : "text-foreground"
                          )}>
                            {style.label}
                          </p>
                          {selectedStyleId === style.id && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{style.tagline}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start from scratch option */}
            <button
              onClick={() => {
                setSelectedStyleId(null);
                setStep(1);
              }}
              className="w-full p-3.5 rounded-xl border border-dashed border-border bg-transparent hover:border-primary/40 hover:bg-muted/20 transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">✏️</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">Start from Scratch</p>
                  <p className="text-xs text-muted-foreground">Choose all settings manually</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── Step 1: Book Info ── */}
        {step === 1 && (
          <div className="space-y-4">
            {selectedStyle && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2.5">
                <span className="text-xl">{selectedStyle.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary">{selectedStyle.label}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{selectedStyle.description}</p>
                </div>
                <button onClick={() => setStep(0)} className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0">Change</button>
              </div>
            )}

            <div className="glass-card rounded-2xl p-4 md:p-6 space-y-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Book Information</h2>

              {/* Title + AI Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-foreground text-sm">Book Title <span className="text-red-400">*</span></Label>
                  <button
                    onClick={handleSuggestTitles}
                    disabled={loadingSuggestions}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                  >
                    {loadingSuggestions
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                      : <><Wand2 className="w-3 h-3" /> Suggest titles</>
                    }
                  </button>
                </div>
                <Input
                  placeholder="e.g., The Art of Deep Work"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input border-border text-foreground"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-saved once you enter a title.</p>

                {/* AI Title Suggestions */}
                {titleSuggestions.length > 0 && (
                  <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary" /> AI Title Suggestions
                      </p>
                      <div className="flex items-center gap-1">
                        <button onClick={handleSuggestTitles} disabled={loadingSuggestions} className="text-xs text-muted-foreground hover:text-foreground">
                          <RefreshCw className="w-3 h-3" />
                        </button>
                        <button onClick={() => setTitleSuggestions([])} className="text-xs text-muted-foreground hover:text-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {titleSuggestions.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => { setTitle(t); setTitleSuggestions([]); }}
                        className="w-full text-left px-2.5 py-2 rounded-lg bg-muted/40 hover:bg-primary/10 hover:text-primary text-sm text-foreground transition-colors border border-transparent hover:border-primary/20"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-foreground text-sm">Description / Premise</Label>
                  {!loadingSuggestions && !titleSuggestions.length && description.trim().length > 20 && (
                    <button
                      onClick={handleSuggestTitles}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Wand2 className="w-3 h-3" /> Suggest titles from this
                    </button>
                  )}
                </div>
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
          </div>
        )}

        {/* ── Step 2: Length & Tone ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Book Length */}
            <div className="glass-card rounded-2xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">Book Length</h2>
              <p className="text-xs text-muted-foreground mb-4">How long should your book be?</p>
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
              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary">
                <span className="font-semibold">{selectedLength.label}:</span> ~{selectedLength.words} across ~{selectedLength.chapters} chapters (~{Math.round(selectedLength.target / selectedLength.chapters).toLocaleString()} words/chapter)
              </div>
            </div>

            {/* Tone */}
            <div className="glass-card rounded-2xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">Writing Tone</h2>
              <p className="text-xs text-muted-foreground mb-3">The overall emotional register of your writing.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WRITING_TONES.map((t) => (
                  <OptionBtn key={t.value} value={t.value} current={tone} onSelect={setTone}>{t.label}</OptionBtn>
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
                    <OptionBtn key={p.value} value={p.value} current={pov} onSelect={setPov}>{p.label}</OptionBtn>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Formality Level</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FORMALITY_OPTIONS.map((f) => (
                    <OptionBtn key={f.value} value={f.value} current={formality} onSelect={setFormality}>{f.label}</OptionBtn>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Voice & Structure ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-4 md:p-6 space-y-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Voice Details</h2>

              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Pacing</Label>
                <div className="space-y-2">
                  {PACING_OPTIONS.map((p) => (
                    <OptionBtn key={p.value} value={p.value} current={pacing} onSelect={setPacing}>{p.label}</OptionBtn>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground mb-1.5 block text-sm">Sentence Length</Label>
                  <div className="space-y-2">
                    {SENTENCE_LENGTH_OPTIONS.map((s) => (
                      <OptionBtn key={s.value} value={s.value} current={sentenceLength} onSelect={setSentenceLength}>{s.label}</OptionBtn>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-foreground mb-1.5 block text-sm">Humor</Label>
                  <div className="space-y-2">
                    {HUMOR_OPTIONS.map((h) => (
                      <OptionBtn key={h.value} value={h.value} current={humor} onSelect={setHumor}>{h.label}</OptionBtn>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Vocabulary Level</Label>
                <div className="grid grid-cols-2 gap-2">
                  {VOCABULARY_OPTIONS.map((v) => (
                    <OptionBtn key={v.value} value={v.value} current={vocabulary} onSelect={setVocabulary}>{v.label}</OptionBtn>
                  ))}
                </div>
              </div>
            </div>

            {/* Author & Knowledge */}
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
                  placeholder="e.g., Write like Malcolm Gladwell — use stories and data together."
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[80px] resize-none text-sm"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-foreground mb-1.5 block text-sm">Custom Knowledge / Context <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  placeholder="Paste facts, research, personal stories, or key points you want included..."
                  value={customKnowledge}
                  onChange={(e) => setCustomKnowledge(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[100px] resize-none text-sm"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">This context is injected into every chapter generation call.</p>
              </div>
            </div>

            {/* Optional Sections */}
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

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-3">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="border-border gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
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
