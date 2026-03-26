import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import AppLayout from "@/components/AppLayout";

const GENRES = [
  "Nonfiction", "Self-Help", "Business", "Memoir", "Biography", "History",
  "Science", "Philosophy", "Psychology", "Spirituality", "Health & Wellness",
  "Fiction", "Fantasy", "Science Fiction", "Romance", "Mystery", "Thriller",
  "Horror", "Literary Fiction", "Adventure", "Historical Fiction", "Children's",
];

const TONES = [
  "Professional & Authoritative", "Conversational & Friendly", "Inspirational & Motivational",
  "Academic & Scholarly", "Humorous & Witty", "Serious & Formal", "Empathetic & Warm",
  "Bold & Direct", "Storytelling & Narrative",
];

const STEPS = [
  { id: 1, label: "Book Info" },
  { id: 2, label: "Style & Voice" },
  { id: 3, label: "Structure" },
];

const DRAFT_KEY = "ai-book-writer-new-book-draft";

export default function NewBook() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [savedBookId, setSavedBookId] = useState<number | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [subgenre, setSubgenre] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Step 2
  const [tone, setTone] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [writingStyle, setWritingStyle] = useState("");
  const [customKnowledge, setCustomKnowledge] = useState("");

  // Step 3
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
        if (d.tone) setTone(d.tone);
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

  // Auto-save to localStorage whenever any field changes
  useEffect(() => {
    const draft = {
      title, description, genre, subgenre, targetAudience,
      tone, authorName, writingStyle, customKnowledge,
      includePreface, includeDedication, includeAcknowledgements, includeEpilogue,
      savedBookId, step,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, description, genre, subgenre, targetAudience, tone, authorName, writingStyle,
    customKnowledge, includePreface, includeDedication, includeAcknowledgements, includeEpilogue,
    savedBookId, step]);

  const utils = trpc.useUtils();

  // Create the book in DB as soon as title is entered (auto-save to DB)
  const createMutation = trpc.books.create.useMutation({
    onSuccess: (data) => {
      setSavedBookId(data.bookId);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    },
    onError: () => { /* silent - will retry on final submit */ },
  });

  // Update book in DB for subsequent changes
  const updateMutation = trpc.books.update.useMutation({
    onSuccess: () => {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    },
    onError: () => { /* silent */ },
  });

  // Auto-save to DB when title has been entered
  const triggerAutoSave = () => {
    if (!title.trim()) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const payload = {
        title: title.trim() || "Untitled Book",
        description: description.trim() || undefined,
        genre: genre || undefined,
        subgenre: subgenre.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        tone: tone || undefined,
        authorName: authorName.trim() || undefined,
        writingStyle: writingStyle.trim() || undefined,
        customKnowledge: customKnowledge.trim() || undefined,
        includePreface,
        includeDedication,
        includeAcknowledgements,
        includeEpilogue,
      };

      if (savedBookId) {
        updateMutation.mutate({ bookId: savedBookId, ...payload });
      } else {
        createMutation.mutate(payload);
      }
    }, 1200);
  };

  // Trigger auto-save whenever any field changes
  useEffect(() => {
    if (title.trim()) triggerAutoSave();
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [title, description, genre, subgenre, targetAudience, tone, authorName, writingStyle,
    customKnowledge, includePreface, includeDedication, includeAcknowledgements, includeEpilogue]);

  const handleFinish = () => {
    if (!title.trim()) {
      toast.error("Please enter a book title");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      genre: genre || undefined,
      subgenre: subgenre.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      tone: tone || undefined,
      authorName: authorName.trim() || undefined,
      writingStyle: writingStyle.trim() || undefined,
      customKnowledge: customKnowledge.trim() || undefined,
      includePreface,
      includeDedication,
      includeAcknowledgements,
      includeEpilogue,
    };

    if (savedBookId) {
      // Update existing book and navigate
      updateMutation.mutate(
        { bookId: savedBookId, ...payload },
        {
          onSuccess: () => {
            localStorage.removeItem(DRAFT_KEY);
            navigate(`/books/${savedBookId}`);
          },
          onError: (err) => toast.error("Failed to save book: " + err.message),
        }
      );
    } else {
      // Create new book
      createMutation.mutate(payload, {
        onSuccess: (data) => {
          localStorage.removeItem(DRAFT_KEY);
          toast.success("Book created! Now generate your outline.");
          navigate(`/books/${data.bookId}`);
        },
        onError: (err) => toast.error("Failed to create book: " + err.message),
      });
    }
  };

  const canProceedStep1 = title.trim().length > 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              New Book
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Fill in the details to generate your book</p>
          </div>
          {/* Auto-save indicator */}
          {autoSaved && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Save className="w-3 h-3" />
              <span>Auto-saved</span>
            </div>
          )}
          {savedBookId && !autoSaved && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Save className="w-3 h-3" />
              <span>Draft saved</span>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === s.id
                  ? "bg-primary text-white"
                  : step > s.id
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Book Info */}
        {step === 1 && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Book Information</h2>

            <div>
              <Label className="text-foreground mb-1.5 block">Book Title <span className="text-red-400">*</span></Label>
              <Input
                placeholder="e.g., The Art of Deep Work"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-input border-border text-foreground"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">Your book is auto-saved once you enter a title.</p>
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block">Description / Premise</Label>
              <Textarea
                placeholder="What is this book about? What's the core message or story?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-input border-border text-foreground resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground mb-1.5 block">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g} className="text-foreground">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground mb-1.5 block">Subgenre / Category</Label>
                <Input
                  placeholder="e.g., Productivity"
                  value={subgenre}
                  onChange={(e) => setSubgenre(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block">Target Audience</Label>
              <Input
                placeholder="e.g., Entrepreneurs aged 25-45 who want to scale their business"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>
        )}

        {/* Step 2: Style & Voice */}
        {step === 2 && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Writing Style & Voice</h2>

            <div>
              <Label className="text-foreground mb-1.5 block">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t} className="text-foreground">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block">Author Name</Label>
              <Input
                placeholder="Your name or pen name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block">Writing Style Notes</Label>
              <Textarea
                placeholder="Describe how you want the book to read. e.g., 'Write like Malcolm Gladwell — story-driven with data. Use short paragraphs and real-world examples.'"
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                className="bg-input border-border text-foreground resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-foreground mb-1.5 block">Custom Knowledge / Context</Label>
              <Textarea
                placeholder="Add any specific facts, frameworks, personal stories, or domain expertise you want the AI to incorporate. The more detail, the better."
                value={customKnowledge}
                onChange={(e) => setCustomKnowledge(e.target.value)}
                className="bg-input border-border text-foreground resize-none"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 3: Structure */}
        {step === 3 && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Book Structure</h2>
            <p className="text-muted-foreground text-sm">
              Choose which optional sections to include. The AI will generate the outline with the right number of chapters after creation.
            </p>

            <div className="space-y-4">
              {[
                { key: "preface", label: "Preface", desc: "An introductory note from the author", value: includePreface, set: setIncludePreface },
                { key: "dedication", label: "Dedication", desc: "A short dedication page", value: includeDedication, set: setIncludeDedication },
                { key: "epilogue", label: "Epilogue", desc: "A closing reflection or continuation", value: includeEpilogue, set: setIncludeEpilogue },
                { key: "acknowledgements", label: "Acknowledgements", desc: "Thank-you section at the end", value: includeAcknowledgements, set: setIncludeAcknowledgements },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={item.value}
                    onCheckedChange={item.set}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="border-border text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !canProceedStep1}
              className="btn-glow text-white"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-glow text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Create Book & Generate Outline"}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
