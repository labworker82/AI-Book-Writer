import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, BookOpen, Image, Download, Edit3, Check, X,
  RefreshCw, ChevronUp, ChevronDown, FileText, Wand2, Loader2, PenLine,
  ImageIcon, List, Play, Mic, Palette, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";

type ChapterOutline = {
  chapterNumber: number;
  title: string;
  summary: string;
  type: string;
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <div className="w-2 h-2 rounded-full bg-muted-foreground" />,
  generating: <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />,
  complete: <Check className="w-3 h-3 text-green-400" />,
  error: <X className="w-3 h-3 text-red-400" />,
};

const TYPE_LABEL: Record<string, string> = {
  preface: "Preface",
  dedication: "Dedication",
  chapter: "Chapter",
  epilogue: "Epilogue",
  acknowledgements: "Acknowledgements",
};

export default function BookEditor() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const bookId = parseInt(params.id || "0");

  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [numChapters, setNumChapters] = useState(0);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingChapterId, setGeneratingChapterId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("chapters");
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  // Generate All state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generateAllProgress, setGenerateAllProgress] = useState({ done: 0, total: 0 });
  const [generateAllErrors, setGenerateAllErrors] = useState<string[]>([]);
  const generateAllCancelRef = useRef(false);
  // Track whether we're actively generating to control polling interval
  const isActivelyGenerating = generatingChapterId !== null || isGeneratingAll;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const utils = trpc.useUtils();

  const { data: book, isLoading: bookLoading } = trpc.books.get.useQuery(
    { bookId },
    {
      enabled: isAuthenticated && bookId > 0,
      // Only auto-poll when actively generating; otherwise fetch on demand
      refetchInterval: isActivelyGenerating ? 8000 : false,
      refetchOnWindowFocus: false,
    }
  );

  const { data: chapters, refetch: refetchChapters } = trpc.chapters.list.useQuery(
    { bookId },
    {
      enabled: isAuthenticated && bookId > 0,
      // Only auto-poll when actively generating to avoid scroll jumps
      refetchInterval: isActivelyGenerating ? 5000 : false,
      refetchOnWindowFocus: false,
    }
  );

  const { data: selectedChapter, refetch: refetchChapter } = trpc.chapters.get.useQuery(
    { chapterId: selectedChapterId! },
    { enabled: !!selectedChapterId }
  );

  const { data: images, refetch: refetchImages } = trpc.images.list.useQuery(
    { bookId },
    { enabled: isAuthenticated && bookId > 0 }
  );

  useEffect(() => {
    if (selectedChapter?.content && !isEditingContent) {
      setEditingContent(selectedChapter.content);
    }
  }, [selectedChapter?.content]);

  const generateOutlineMutation = trpc.generate.outline.useMutation({
    onSuccess: (data) => {
      toast.success(`Outline generated with ${data.outline.length} sections!`);
      utils.books.get.invalidate({ bookId });
    },
    onError: (err) => toast.error("Outline generation failed: " + err.message),
  });

  const initChaptersMutation = trpc.generate.initChapters.useMutation({
    onSuccess: () => {
      toast.success("Chapters created! You can now generate them one by one or all at once.");
      refetchChapters();
    },
    onError: (err) => toast.error("Failed to initialize chapters: " + err.message),
  });

  const generateChapterMutation = trpc.generate.chapter.useMutation({
    onSuccess: () => {
      // Only show toast for single-chapter generation (not Generate All)
      if (!isGeneratingAll) {
        toast.success("Chapter written!");
      }
      refetchChapters();
      refetchChapter();
    },
    onError: (err) => {
      // Only show toast for single-chapter generation (not Generate All — loop handles errors)
      if (!isGeneratingAll) {
        toast.error("Chapter generation failed: " + err.message);
        setGeneratingChapterId(null);
      }
    },
  });

  const updateChapterMutation = trpc.chapters.update.useMutation({
    onSuccess: () => {
      toast.success("Chapter saved!");
      setIsEditingContent(false);
      refetchChapter();
      refetchChapters();
    },
    onError: (err) => toast.error("Failed to save: " + err.message),
  });

  const coverImageMutation = trpc.generate.coverImage.useMutation({
    onSuccess: () => {
      toast.success("Cover image generated!");
      refetchImages();
    },
    onError: (err: unknown) => toast.error("Image generation failed: " + (err instanceof Error ? err.message : String(err))),
  });

  const illustrationMutation = trpc.generate.illustration.useMutation({
    onSuccess: () => {
      toast.success("Illustration generated!");
      refetchImages();
      setImagePrompt("");
    },
    onError: (err: unknown) => toast.error("Illustration failed: " + (err instanceof Error ? err.message : String(err))),
  });

  const handleGenerateChapter = useCallback(async (chapterId: number) => {
    setGeneratingChapterId(chapterId);
    try {
      await generateChapterMutation.mutateAsync({ bookId, chapterId });
    } finally {
      setGeneratingChapterId(null);
    }
  }, [bookId, generateChapterMutation]);

  /**
   * Generate all pending/error chapters sequentially.
   * Skips already-complete chapters. Can be cancelled.
   */
  const handleGenerateAll = useCallback(async () => {
    if (!chapters) return;
    const pending = chapters.filter(c => c.status === "pending" || c.status === "error");
    if (pending.length === 0) {
      toast.info("All chapters are already complete!");
      return;
    }

    setIsGeneratingAll(true);
    generateAllCancelRef.current = false;
    setGenerateAllProgress({ done: 0, total: pending.length });

    let done = 0;
    for (const chapter of pending) {
      if (generateAllCancelRef.current) {
        toast.info(`Generation paused after ${done} chapters.`);
        break;
      }
      setGeneratingChapterId(chapter.id);
      try {
        await generateChapterMutation.mutateAsync({ bookId, chapterId: chapter.id });
        done++;
        setGenerateAllProgress({ done, total: pending.length });
        await refetchChapters();
      } catch (err) {
        toast.error(`Failed on "${chapter.title}": ${err instanceof Error ? err.message : String(err)}`);
        // Continue to next chapter even if one fails
        done++;
        setGenerateAllProgress({ done, total: pending.length });
      }
    }

    setGeneratingChapterId(null);
    setIsGeneratingAll(false);
    generateAllCancelRef.current = false;

    if (!generateAllCancelRef.current) {
      toast.success(`Done! Generated ${done} chapter${done !== 1 ? "s" : ""}.`);
    }
  }, [chapters, bookId, generateChapterMutation, refetchChapters]);

  const handleCancelGenerateAll = () => {
    generateAllCancelRef.current = true;
  };

  // ── Tone Override / Regenerate ──
  const [toneMenuChapterId, setToneMenuChapterId] = useState<number | null>(null);
  const TONE_OPTIONS = [
    { label: "More conversational", value: "Rewrite in a more conversational, friendly tone" },
    { label: "More formal", value: "Rewrite in a more formal, professional tone" },
    { label: "Shorten by ~30%", value: "Shorten this chapter by approximately 30% while keeping all key points" },
    { label: "Expand by ~30%", value: "Expand this chapter by approximately 30% with more detail and examples" },
    { label: "More storytelling", value: "Add more narrative storytelling, anecdotes, and vivid examples" },
    { label: "More actionable", value: "Make this chapter more actionable with clear steps and takeaways" },
  ];

  const regenerateChapterMutation = trpc.generate.regenerateChapter.useMutation({
    onSuccess: () => {
      toast.success("Chapter regenerated!");
      refetchChapters();
      refetchChapter();
      setToneMenuChapterId(null);
    },
    onError: (err) => {
      toast.error("Regeneration failed: " + err.message);
      refetchChapters();
    },
  });

  const handleRegenerateWithTone = (chapterId: number, toneValue: string) => {
    setToneMenuChapterId(null);
    regenerateChapterMutation.mutate({ bookId, chapterId, toneOverride: toneValue });
  };

  // ── DOCX Export ──
  const exportDocxMutation = trpc.generate.exportDocx.useMutation({
    onSuccess: (data) => {
      const bytes = Uint8Array.from(atob(data.base64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded as Word document!");
    },
    onError: (err) => toast.error("DOCX export failed: " + err.message),
  });

  const handleSaveContent = () => {
    if (!selectedChapterId) return;
    updateChapterMutation.mutate({ chapterId: selectedChapterId, content: editingContent });
  };

  const handleExport = (format: "txt" | "md") => {
    if (!book || !chapters) return;
    const content = chapters
      .filter((c) => c.status === "complete" && c.content)
      .map((c) => {
        const chapterContent = c.content || "";
        if (format === "md") return `# ${c.title}\n\n${chapterContent}`;
        return `${c.title.toUpperCase()}\n${"=".repeat(c.title.length)}\n\n${chapterContent}`;
      })
      .join("\n\n---\n\n");

    const fullContent = format === "md"
      ? `# ${book.title}\n\nBy ${book.authorName || "Unknown Author"}\n\n---\n\n${content}`
      : `${book.title.toUpperCase()}\nBy ${book.authorName || "Unknown Author"}\n\n${"=".repeat(50)}\n\n${content}`;

    const blob = new Blob([fullContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book.title.replace(/[^a-z0-9]/gi, "_")}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as .${format}`);
  };

  const outline = (book?.outline as ChapterOutline[]) || [];
  const hasOutline = outline.length > 0;
  const hasChapters = (chapters?.length || 0) > 0;
  const completedChapters = chapters?.filter((c) => c.status === "complete").length || 0;
  const totalWords = book?.wordCount || 0;
  const pendingChapters = chapters?.filter(c => c.status === "pending" || c.status === "error").length || 0;

  if (bookLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!book) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <p className="text-muted-foreground">Book not found</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">Back to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }

  // ── Voice/Tone Summary Panel ──
  const VoicePanel = () => {
    const tone = book.tone;
    const style = book.writingStyle;
    if (!tone && !style) return null;

    return (
      <div className="mx-3 mb-2 p-2.5 rounded-lg bg-primary/5 border border-primary/15">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Mic className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-primary">Voice & Tone</span>
        </div>
        {tone && (
          <p className="text-xs text-muted-foreground capitalize mb-0.5">
            <span className="text-foreground font-medium">Tone:</span> {tone}
          </p>
        )}
        {style && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            <span className="text-foreground font-medium">Style:</span> {style}
          </p>
        )}
      </div>
    );
  };

  // ── Generate All Progress Banner ──
  const GenerateAllBanner = () => {
    if (!isGeneratingAll) return null;
    const { done, total } = generateAllProgress;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
      <div className="mx-3 mb-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-blue-400">Generating all chapters...</span>
          <button
            onClick={handleCancelGenerateAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Pause
          </button>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{done} of {total} chapters written</p>
      </div>
    );
  };

  // ── Chapter List Panel ──
  const ChapterListPanel = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
      <TabsList className="mx-3 mt-3 grid grid-cols-3 bg-muted/50 h-8 flex-shrink-0">
        <TabsTrigger value="chapters" className="text-xs">Chapters</TabsTrigger>
        <TabsTrigger value="images" className="text-xs">Images</TabsTrigger>
        <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
      </TabsList>

      {/* Chapters Tab */}
      <TabsContent value="chapters" className="flex-1 overflow-y-auto p-3 space-y-2 mt-0">
        {!hasOutline ? (
          <div className="text-center py-6">
            <Wand2 className="w-8 h-8 text-primary/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-3">No outline yet. Generate one to get started.</p>
            {book?.targetWordCount && (
              <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary">
                Target: ~{book.targetWordCount.toLocaleString()} words · ~{book.suggestedChapters || 15} chapters
              </div>
            )}
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="done"
                value={numChapters || book?.suggestedChapters || 15}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  const num = parseInt(val) || 0;
                  setNumChapters(Math.min(30, Math.max(0, num)));
                }}
                className="bg-input border-border text-foreground text-xs h-10 w-20 text-center"
                autoComplete="off"
              />
              <span className="text-xs text-muted-foreground">chapters</span>
            </div>
            <Button
              size="sm"
              onClick={() => generateOutlineMutation.mutate({ bookId, numChapters })}
              disabled={generateOutlineMutation.isPending}
              className="btn-glow text-white text-xs w-full min-h-[44px]"
            >
              {generateOutlineMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Generating...</>
              ) : (
                <><Sparkles className="w-3 h-3 mr-1" /> Generate Outline</>
              )}
            </Button>
          </div>
        ) : !hasChapters ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1 mb-2">Outline ready! Review below, then start writing.</p>
            {outline.map((item) => (
              <div key={item.chapterNumber} className="p-2 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs text-primary/60 capitalize">{TYPE_LABEL[item.type] || item.type}</span>
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-1">{item.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.summary}</p>
              </div>
            ))}
            <Button
              size="sm"
              onClick={() => initChaptersMutation.mutate({ bookId })}
              disabled={initChaptersMutation.isPending}
              className="btn-glow text-white text-xs w-full min-h-[44px]"
            >
              {initChaptersMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Starting...</>
              ) : (
                <><PenLine className="w-3 h-3 mr-1" /> Start Writing</>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Voice panel */}
            <VoicePanel />

            {/* Generate All banner */}
            <GenerateAllBanner />

            {/* Generate All / Stop button */}
            {pendingChapters > 0 && (
              <div className="pb-1">
                {isGeneratingAll ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelGenerateAll}
                    className="w-full text-xs border-border min-h-[40px]"
                  >
                    <X className="w-3 h-3 mr-1" /> Pause Generation
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGenerateAll}
                    disabled={isGeneratingAll}
                    className="btn-glow text-white text-xs w-full min-h-[40px]"
                  >
                    <Play className="w-3 h-3 mr-1" /> Generate All ({pendingChapters} remaining)
                  </Button>
                )}
              </div>
            )}

            {chapters?.map((chapter) => (
              <div key={chapter.id} className="relative">
                <button
                  onClick={() => {
                    setSelectedChapterId(chapter.id);
                    setMobileView("editor");
                    setToneMenuChapterId(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all border min-h-[52px] ${
                    selectedChapterId === chapter.id
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "bg-transparent border-transparent hover:bg-muted/40 text-foreground active:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {regenerateChapterMutation.isPending && regenerateChapterMutation.variables?.chapterId === chapter.id
                      ? <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                      : STATUS_ICON[chapter.status]}
                    <span className="text-xs font-medium line-clamp-1 flex-1">{chapter.title}</span>
                    {chapter.status === "complete" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setToneMenuChapterId(toneMenuChapterId === chapter.id ? null : chapter.id);
                        }}
                        className="ml-auto p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground flex-shrink-0"
                        title="Regenerate with different tone"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{TYPE_LABEL[chapter.type] || chapter.type}</span>
                    {chapter.wordCount ? <span>· {chapter.wordCount.toLocaleString()}w</span> : null}
                  </div>
                </button>
                {/* Tone override dropdown */}
                {toneMenuChapterId === chapter.id && (
                  <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    <p className="text-xs text-muted-foreground px-3 py-2 border-b border-border">Regenerate with tone:</p>
                    {TONE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleRegenerateWithTone(chapter.id, opt.value)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted/60 text-foreground transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setToneMenuChapterId(null)}
                      className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted/40 border-t border-border"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </TabsContent>

      {/* Images Tab */}
      <TabsContent value="images" className="flex-1 overflow-y-auto p-3 mt-0">
        <div className="space-y-3">
          <Button
            size="sm"
            onClick={() => coverImageMutation.mutate({ bookId })}
            disabled={coverImageMutation.isPending}
            className="btn-glow text-white text-xs w-full min-h-[44px]"
          >
            {coverImageMutation.isPending ? (
              <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Generating...</>
            ) : (
              <><ImageIcon className="w-3 h-3 mr-1" /> Generate Cover</>
            )}
          </Button>
          <div className="space-y-2">
            <Input
              placeholder="Custom illustration prompt..."
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="bg-input border-border text-foreground text-xs h-10"
              inputMode="text"
              enterKeyHint="go"
              autoComplete="off"
              autoCorrect="off"
            />
            <Button
              size="sm"
              onClick={() => illustrationMutation.mutate({ bookId, prompt: imagePrompt })}
              disabled={illustrationMutation.isPending || !imagePrompt.trim()}
              variant="outline"
              className="text-xs w-full border-border min-h-[44px]"
            >
              {illustrationMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Generating...</>
              ) : (
                <><Wand2 className="w-3 h-3 mr-1" /> Generate Illustration</>
              )}
            </Button>
          </div>
          {images?.map((img) => (
            <div key={img.id} className="rounded-lg overflow-hidden border border-border">
              <img src={img.imageUrl || ""} alt={img.prompt || ""} className="w-full object-cover" />
              <p className="text-xs text-muted-foreground p-2 line-clamp-2">{img.prompt}</p>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* Export Tab */}
      <TabsContent value="export" className="p-3 mt-0">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Export your complete book</p>
          <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Book Stats</p>
            <p>{completedChapters} of {chapters?.length || 0} chapters complete</p>
            <p>{totalWords.toLocaleString()} total words</p>
          </div>
          <Button
            size="sm"
            onClick={() => exportDocxMutation.mutate({ bookId })}
            disabled={exportDocxMutation.isPending || completedChapters === 0}
            className="btn-glow text-white text-xs w-full min-h-[44px]"
          >
            {exportDocxMutation.isPending ? (
              <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Building Word doc...</>
            ) : (
              <><Download className="w-3 h-3 mr-1" /> Download as Word (.docx)</>
            )}
          </Button>
          <Button size="sm" onClick={() => handleExport("txt")} variant="outline" className="w-full text-xs border-border min-h-[44px]">
            <Download className="w-3 h-3 mr-1" /> Export as .txt
          </Button>
          <Button size="sm" onClick={() => handleExport("md")} variant="outline" className="w-full text-xs border-border min-h-[44px]">
            <Download className="w-3 h-3 mr-1" /> Export as .md
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );

  // ── Chapter Editor Panel ──
  const EditorPanel = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {selectedChapterId && selectedChapter ? (
        <>
          {/* Chapter Header */}
          <div className="p-3 md:p-4 border-b border-border flex items-start gap-2 bg-card/30">
            <button
              className="md:hidden mt-0.5 text-muted-foreground hover:text-foreground flex-shrink-0 p-1"
              onClick={() => setMobileView("list")}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground text-sm md:text-base line-clamp-1">{selectedChapter.title}</h2>
              <p className="text-xs text-muted-foreground capitalize">
                {TYPE_LABEL[selectedChapter.type] || selectedChapter.type} · {selectedChapter.wordCount?.toLocaleString() || 0} words
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {selectedChapter.status !== "complete" ? (
                <Button
                  size="sm"
                  onClick={() => handleGenerateChapter(selectedChapterId)}
                  disabled={generatingChapterId === selectedChapterId || isGeneratingAll}
                  className="btn-glow text-white text-xs gap-1 h-9 px-3"
                >
                  {generatingChapterId === selectedChapterId ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /><span className="hidden sm:inline"> Writing...</span></>
                  ) : (
                    <><Sparkles className="w-3 h-3" /><span className="hidden sm:inline"> Generate</span></>
                  )}
                </Button>
              ) : (
                <>
                  {isEditingContent ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingContent(false)} className="text-xs h-9 px-2">Cancel</Button>
                      <Button size="sm" onClick={handleSaveContent} disabled={updateChapterMutation.isPending} className="btn-glow text-white text-xs h-9 px-3">
                        {updateChapterMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingContent(true)} className="text-xs border-border gap-1 h-9 px-3">
                        <Edit3 className="w-3 h-3" /><span className="hidden sm:inline"> Edit</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleGenerateChapter(selectedChapterId)} disabled={generatingChapterId === selectedChapterId || isGeneratingAll} className="text-xs gap-1 h-9 px-2 text-muted-foreground">
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Chapter type hint for special sections */}
          {selectedChapter.type !== "chapter" && selectedChapter.status === "pending" && (
            <div className="mx-4 mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/15 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                {selectedChapter.type === "preface" && "This is your Preface — the AI will write it as a personal letter to the reader, explaining why you wrote the book."}
                {selectedChapter.type === "dedication" && "This is your Dedication — a short, heartfelt message to the people who matter most."}
                {selectedChapter.type === "epilogue" && "This is your Epilogue — a closing reflection that gives the reader a satisfying ending."}
                {selectedChapter.type === "acknowledgements" && "This is your Acknowledgements section — the AI will write it as a warm thank-you to contributors and supporters."}
              </p>
            </div>
          )}

          {/* Chapter Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {generatingChapterId === selectedChapterId ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-medium">
                    Writing {TYPE_LABEL[selectedChapter.type] || "chapter"}...
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">This may take 30-90 seconds</p>
                </div>
              </div>
            ) : selectedChapter.status === "pending" ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Not yet written</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Tap "Generate" to write this {TYPE_LABEL[selectedChapter.type]?.toLowerCase() || "chapter"} with AI
                  </p>
                </div>
                <Button onClick={() => handleGenerateChapter(selectedChapterId)} disabled={isGeneratingAll} className="btn-glow text-white gap-2 min-h-[44px]">
                  <Sparkles className="w-4 h-4" /> Generate {TYPE_LABEL[selectedChapter.type] || "Chapter"}
                </Button>
              </div>
            ) : isEditingContent ? (
              <Textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-full min-h-[60vh] bg-transparent border-none text-foreground text-sm leading-relaxed resize-none focus:ring-0 p-0"
                placeholder="Write or paste chapter content here..."
                inputMode="text"
                autoComplete="off"
                autoCorrect="on"
                spellCheck={true}
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap font-serif">
                  {selectedChapter.content || "No content yet."}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {hasChapters ? "Select a chapter" : hasOutline ? "Ready to start writing" : "Let's build your book"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            {hasChapters
              ? "Choose a chapter from the list to view or generate its content."
              : hasOutline
              ? "Your outline is ready. Click 'Start Writing' to create chapters."
              : "Start by generating an outline in the panel. The AI will create chapter titles and summaries for your book."}
          </p>
          <Button
            className="mt-4 md:hidden btn-glow text-white gap-2 min-h-[44px]"
            onClick={() => setMobileView("list")}
          >
            <List className="w-4 h-4" /> View Chapters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      {/* Book Header (mobile only) */}
      <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground p-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground text-sm truncate">{book.title}</h2>
          <p className="text-xs text-muted-foreground">{completedChapters}/{chapters?.length || 0} chapters · {totalWords.toLocaleString()} words</p>
        </div>
        <button
          onClick={() => setMobileView(mobileView === "list" ? "editor" : "list")}
          className="text-muted-foreground hover:text-foreground p-2 rounded-lg bg-muted/50 min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          {mobileView === "list" ? <FileText className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
      </div>

      {/* Desktop panels */}
      <div className="hidden md:flex h-screen overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 border-r border-border bg-card/50 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b border-border flex-shrink-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> All Books
            </button>
            <h2 className="font-semibold text-foreground text-sm line-clamp-2">{book.title}</h2>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{completedChapters}/{chapters?.length || 0} chapters</span>
              <span>{totalWords.toLocaleString()} words</span>
            </div>
          </div>
          <ChapterListPanel />
        </div>
        {/* Right Panel */}
        <EditorPanel />
      </div>

      {/* Mobile panels — w-full + overflow-x-hidden prevents horizontal scroll */}
      <div className="md:hidden flex flex-col overflow-hidden w-full" style={{ height: 'calc(100dvh - 112px)', maxWidth: '100vw' }}>
        {mobileView === "list" ? (
          <div className="flex flex-col flex-1 overflow-hidden bg-card/50">
            <ChapterListPanel />
          </div>
        ) : (
          <EditorPanel />
        )}
      </div>
    </AppLayout>
  );
}
