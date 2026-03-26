import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, BookOpen, Image, Download, Edit3, Check, X,
  RefreshCw, ChevronUp, ChevronDown, FileText, Wand2, Loader2, PenLine, ImageIcon, List
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

export default function BookEditor() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const bookId = parseInt(params.id || "0");

  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [numChapters, setNumChapters] = useState(0); // 0 = use book's suggestedChapters
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingChapterId, setGeneratingChapterId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("chapters");
  // Mobile: show chapter panel or content panel
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const utils = trpc.useUtils();

  const { data: book, isLoading: bookLoading } = trpc.books.get.useQuery(
    { bookId },
    { enabled: isAuthenticated && bookId > 0, refetchInterval: 5000 }
  );

  const { data: chapters, refetch: refetchChapters } = trpc.chapters.list.useQuery(
    { bookId },
    { enabled: isAuthenticated && bookId > 0, refetchInterval: 3000 }
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
      toast.success(`Outline generated with ${data.outline.length} chapters!`);
      utils.books.get.invalidate({ bookId });
    },
    onError: (err) => toast.error("Outline generation failed: " + err.message),
  });

  const initChaptersMutation = trpc.generate.initChapters.useMutation({
    onSuccess: () => {
      toast.success("Chapters created! Select one to start writing.");
      refetchChapters();
    },
    onError: (err) => toast.error("Failed to initialize chapters: " + err.message),
  });

  const generateChapterMutation = trpc.generate.chapter.useMutation({
    onSuccess: () => {
      toast.success("Chapter written!");
      refetchChapters();
      refetchChapter();
    },
    onError: (err) => {
      toast.error("Chapter generation failed: " + err.message);
      setGeneratingChapterId(null);
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

  // ── Chapter List Panel (shared between desktop sidebar and mobile view) ──
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
                type="number"
                min={3}
                max={30}
                value={numChapters || book?.suggestedChapters || 15}
                onChange={(e) => setNumChapters(parseInt(e.target.value) || 0)}
                className="bg-input border-border text-foreground text-xs h-8 w-20"
              />
              <span className="text-xs text-muted-foreground">chapters</span>
            </div>
            <Button
              size="sm"
              onClick={() => generateOutlineMutation.mutate({ bookId, numChapters })}
              disabled={generateOutlineMutation.isPending}
              className="btn-glow text-white text-xs w-full"
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
                <p className="text-xs font-medium text-foreground line-clamp-1">{item.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.summary}</p>
              </div>
            ))}
            <Button
              size="sm"
              onClick={() => initChaptersMutation.mutate({ bookId })}
              disabled={initChaptersMutation.isPending}
              className="btn-glow text-white text-xs w-full mt-2"
            >
              {initChaptersMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Starting...</>
              ) : (
                <><PenLine className="w-3 h-3 mr-1" /> Start Writing</>
              )}
            </Button>
          </div>
        ) : (
          chapters?.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => {
                setSelectedChapterId(chapter.id);
                setMobileView("editor"); // switch to editor on mobile
              }}
              className={`w-full text-left p-3 rounded-xl transition-all border ${
                selectedChapterId === chapter.id
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-transparent border-transparent hover:bg-muted/40 text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {STATUS_ICON[chapter.status]}
                <span className="text-xs font-medium line-clamp-1">{chapter.title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{chapter.type}</span>
                {chapter.wordCount ? <span>· {chapter.wordCount.toLocaleString()}w</span> : null}
              </div>
            </button>
          ))
        )}
      </TabsContent>

      {/* Images Tab */}
      <TabsContent value="images" className="flex-1 overflow-y-auto p-3 mt-0">
        <div className="space-y-3">
          <Button
            size="sm"
            onClick={() => coverImageMutation.mutate({ bookId })}
            disabled={coverImageMutation.isPending}
            className="btn-glow text-white text-xs w-full"
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
              className="bg-input border-border text-foreground text-xs h-8"
            />
            <Button
              size="sm"
              onClick={() => illustrationMutation.mutate({ bookId, prompt: imagePrompt })}
              disabled={illustrationMutation.isPending || !imagePrompt.trim()}
              variant="outline"
              className="text-xs w-full border-border"
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
          <Button size="sm" onClick={() => handleExport("txt")} variant="outline" className="w-full text-xs border-border">
            <Download className="w-3 h-3 mr-1" /> Export as .txt
          </Button>
          <Button size="sm" onClick={() => handleExport("md")} variant="outline" className="w-full text-xs border-border">
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
            {/* Mobile back to list */}
            <button
              className="md:hidden mt-0.5 text-muted-foreground hover:text-foreground flex-shrink-0"
              onClick={() => setMobileView("list")}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground text-sm md:text-base line-clamp-1">{selectedChapter.title}</h2>
              <p className="text-xs text-muted-foreground capitalize">
                {selectedChapter.type} · {selectedChapter.wordCount?.toLocaleString() || 0} words
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {selectedChapter.status !== "complete" ? (
                <Button
                  size="sm"
                  onClick={() => handleGenerateChapter(selectedChapterId)}
                  disabled={generatingChapterId === selectedChapterId}
                  className="btn-glow text-white text-xs gap-1 h-8 px-2.5"
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
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingContent(false)} className="text-xs h-8 px-2">Cancel</Button>
                      <Button size="sm" onClick={handleSaveContent} disabled={updateChapterMutation.isPending} className="btn-glow text-white text-xs h-8 px-2.5">
                        {updateChapterMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingContent(true)} className="text-xs border-border gap-1 h-8 px-2.5">
                        <Edit3 className="w-3 h-3" /><span className="hidden sm:inline"> Edit</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleGenerateChapter(selectedChapterId)} disabled={generatingChapterId === selectedChapterId} className="text-xs gap-1 h-8 px-2 text-muted-foreground">
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Chapter Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {generatingChapterId === selectedChapterId ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-foreground font-medium">Writing chapter...</p>
                  <p className="text-muted-foreground text-sm mt-1">This may take 30–60 seconds</p>
                </div>
              </div>
            ) : selectedChapter.status === "pending" ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Chapter not yet written</p>
                  <p className="text-muted-foreground text-sm mt-1">Tap "Generate" to write this chapter with AI</p>
                </div>
                <Button onClick={() => handleGenerateChapter(selectedChapterId)} className="btn-glow text-white gap-2">
                  <Sparkles className="w-4 h-4" /> Generate Chapter
                </Button>
              </div>
            ) : isEditingContent ? (
              <Textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-full min-h-[60vh] bg-transparent border-none text-foreground text-sm leading-relaxed resize-none focus:ring-0 p-0"
                placeholder="Write or paste chapter content here..."
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
          {/* On mobile, show a button to go back to list */}
          <Button
            className="mt-4 md:hidden btn-glow text-white gap-2"
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
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground text-sm truncate">{book.title}</h2>
          <p className="text-xs text-muted-foreground">{completedChapters}/{chapters?.length || 0} chapters · {totalWords.toLocaleString()} words</p>
        </div>
        {/* Toggle between list and editor on mobile */}
        <button
          onClick={() => setMobileView(mobileView === "list" ? "editor" : "list")}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg bg-muted/50"
        >
          {mobileView === "list" ? <FileText className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Desktop: Side-by-side panels ── */}
      <div className="hidden md:flex h-[calc(100vh-0px)] overflow-hidden">
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

      {/* ── Mobile: Single panel view ── */}
      <div className="md:hidden flex flex-col h-[calc(100vh-112px)] overflow-hidden">
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
