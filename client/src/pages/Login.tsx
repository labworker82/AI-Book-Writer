import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { BookOpen, Sparkles } from "lucide-react";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center dot-grid-bg">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl btn-glow flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-sora">AI Book Writer</h1>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Sign in to access your personal AI book writing studio
          </p>
          <a
            href={getLoginUrl()}
            className="btn-glow inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all"
          >
            Sign in to continue
          </a>
        </div>
      </div>
    </div>
  );
}
