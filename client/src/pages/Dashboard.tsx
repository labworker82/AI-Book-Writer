import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { PlusCircle, BookOpen, Trash2, Edit3, Clock, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";

const STATUS_COLORS = {
  draft: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  generating: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  complete: "text-green-400 bg-green-400/10 border-green-400/20",
};

const STATUS_LABELS = {
  draft: "Draft",
  generating: "Generating",
  complete: "Complete",
};

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Check if onboarding is needed (new user, no API key configured)
  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    // Redirect new users to onboarding if they haven't set up their OpenRouter key
    if (isAuthenticated && !settingsLoading && settings) {
      const onboardingDone = localStorage.getItem("onboarding_complete");
      if (!settings.hasOpenRouterKey && !onboardingDone) {
        navigate("/onboarding");
      }
    }
  }, [isAuthenticated, authLoading, settings, settingsLoading, navigate]);

  const { data: books, isLoading, refetch } = trpc.books.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteMutation = trpc.books.delete.useMutation({
    onSuccess: () => {
      toast.success("Book deleted");
      refetch();
    },
    onError: (err) => toast.error("Failed to delete: " + err.message),
  });

  const handleDelete = (bookId: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate({ bookId });
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Books</h1>
            <p className="text-muted-foreground mt-1">
              {books?.length ? `${books.length} book${books.length !== 1 ? "s" : ""} in your library` : "Start writing your first book"}
            </p>
          </div>
          <Button
            onClick={() => navigate("/books/new")}
            className="btn-glow text-white font-semibold gap-2 text-sm px-3 md:px-4"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Book</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : books?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No books yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first AI-powered book. From outline to 50,000 words — all generated with your OpenAI key.
            </p>
            <Button
              onClick={() => navigate("/books/new")}
              className="btn-glow text-white font-semibold gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Write My First Book
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books?.map((book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/books/${book.id}`)}
                className="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/30 hover:bg-white/[0.06] transition-all group"
              >
                {/* Cover image or placeholder */}
                <div className="w-full h-32 rounded-xl mb-4 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-10 h-10 text-primary/40" />
                  )}
                </div>

                {/* Title & Genre */}
                <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {book.title}
                </h3>
                {book.genre && (
                  <p className="text-xs text-muted-foreground mb-3">{book.genre}{book.subgenre ? ` · ${book.subgenre}` : ""}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {book.totalChapters || 0} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    {(book.wordCount || 0).toLocaleString()} words
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[book.status]}`}>
                    {STATUS_LABELS[book.status]}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(book.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => handleDelete(book.id, book.title, e)}
                      className="ml-2 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
