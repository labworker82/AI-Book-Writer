/**
 * First-Run Onboarding Wizard
 * Shown once to new users who haven't configured their OpenRouter API key.
 * Step 1: Add OpenRouter key (required to write books)
 * Step 2: Optional Author Profile setup
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Key, User, ChevronRight, Check, ExternalLink, Sparkles } from "lucide-react";

const STEPS = [
  { id: 1, label: "API Key" },
  { id: 2, label: "Author Profile" },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);

  // Step 2 state
  const [penName, setPenName] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [includeAuthorInPrompts, setIncludeAuthorInPrompts] = useState(false);

  const saveSettingsMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      if (step === 1) {
        toast.success("API key saved!");
        setStep(2);
      } else {
        toast.success("Profile saved! Welcome to AI Book Writer.");
        // Mark onboarding complete in localStorage
        localStorage.setItem("onboarding_complete", "true");
        navigate("/dashboard");
      }
    },
    onError: (err) => toast.error("Failed to save: " + err.message),
  });

  const handleSaveKey = () => {
    if (!openrouterKey.trim()) {
      toast.error("Please enter your OpenRouter API key.");
      return;
    }
    saveSettingsMutation.mutate({ openrouterApiKey: openrouterKey.trim() });
  };

  const handleSaveProfile = () => {
    saveSettingsMutation.mutate({
      penName: penName.trim() || undefined,
      authorBio: authorBio.trim() || undefined,
      includeAuthorInPrompts,
    });
  };

  const handleSkipProfile = () => {
    localStorage.setItem("onboarding_complete", "true");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground">AI Book Writer</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step > s.id
                ? "bg-green-500 text-white"
                : step === s.id
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground"
            }`}>
              {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
            </div>
            <span className={`text-xs ${step === s.id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-lg">

        {/* ── Step 1: API Key ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Connect OpenRouter</h1>
                <p className="text-xs text-muted-foreground">Required to generate book content</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              AI Book Writer uses <strong className="text-foreground">OpenRouter</strong> to write your books.
              OpenRouter gives you access to 200+ AI models including Claude, GPT-4, Gemini, and more —
              you only pay for what you use.
            </p>

            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-xs font-medium text-foreground">How to get your key:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">openrouter.ai/keys <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>Sign up or log in (free)</li>
                <li>Click "Create Key" and copy it</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">OpenRouter API Key</label>
              <div className="relative">
                <Input
                  type={keyVisible ? "text" : "password"}
                  placeholder="sk-or-v1-..."
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                  className="bg-input border-border text-foreground pr-16"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setKeyVisible(!keyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {keyVisible ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Your key is stored securely and never shared.</p>
            </div>

            <Button
              onClick={handleSaveKey}
              disabled={saveSettingsMutation.isPending || !openrouterKey.trim()}
              className="btn-glow text-white w-full"
            >
              {saveSettingsMutation.isPending ? "Saving..." : "Save & Continue"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Author Profile ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Author Profile</h1>
                <p className="text-xs text-muted-foreground">Optional — you can always add this later in Settings</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              If you want the AI to write in your voice or include your name, set that up here.
              This is completely optional — leave it blank to skip.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Pen Name (optional)</label>
                <Input
                  placeholder="e.g. Jane Smith"
                  value={penName}
                  onChange={(e) => setPenName(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Writing Style Notes (optional)</label>
                <Textarea
                  placeholder="e.g. I write in a warm, conversational style. I use short sentences and avoid jargon..."
                  value={authorBio}
                  onChange={(e) => setAuthorBio(e.target.value)}
                  className="bg-input border-border text-foreground text-sm resize-none"
                  rows={3}
                />
              </div>

              {(penName.trim() || authorBio.trim()) && (
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAuthorInPrompts}
                    onChange={(e) => setIncludeAuthorInPrompts(e.target.checked)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    Include my name and style notes in every book I generate
                  </span>
                </label>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkipProfile}
                className="flex-1 text-xs border-border"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saveSettingsMutation.isPending}
                className="btn-glow text-white flex-1"
              >
                {saveSettingsMutation.isPending ? "Saving..." : (
                  <><Sparkles className="w-3.5 h-3.5 mr-1" /> Start Writing</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        You can update all of these settings anytime from the Settings page.
      </p>
    </div>
  );
}
