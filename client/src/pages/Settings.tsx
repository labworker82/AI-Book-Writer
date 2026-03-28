import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Settings2, Key, Cpu, Image, ArrowLeft, CheckCircle2,
  Eye, EyeOff, ExternalLink, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";

// Popular OpenRouter models — user can also type any model ID manually
const POPULAR_OPENROUTER_MODELS = [
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet — Best for long-form writing" },
  { value: "anthropic/claude-3-opus", label: "Claude 3 Opus — Most powerful Claude" },
  { value: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku — Fast & affordable" },
  { value: "google/gemini-pro-1.5", label: "Gemini 1.5 Pro — 1M token context" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash — Latest Google" },
  { value: "openai/gpt-4o", label: "GPT-4o via OpenRouter" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini via OpenRouter" },
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B — Open source" },
  { value: "deepseek/deepseek-chat", label: "DeepSeek V3 — Budget friendly" },
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1 — Reasoning model" },
  { value: "mistralai/mistral-large", label: "Mistral Large" },
  { value: "custom", label: "Custom model ID (type below)..." },
];

const IMAGE_MODELS = [
  { value: "dall-e-3", label: "DALL-E 3 — High Quality (Recommended)" },
  { value: "gpt-image-1", label: "GPT Image 1 — Latest OpenAI" },
  { value: "dall-e-2", label: "DALL-E 2 — Fast & Affordable" },
];

export default function Settings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // OpenRouter (writing)
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showOrKey, setShowOrKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-3.5-sonnet");
  const [customModel, setCustomModel] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);

  // OpenAI (images only)
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [imageModel, setImageModel] = useState("dall-e-3");

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const { data: settings, isLoading } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (settings) {
      setImageModel(settings.imageModel || "dall-e-3");

      // Determine if the saved textModel is in the popular list or custom
      const savedModel = settings.textModel || "anthropic/claude-3.5-sonnet";
      const isInList = POPULAR_OPENROUTER_MODELS.some(
        (m) => m.value === savedModel && m.value !== "custom"
      );
      if (isInList) {
        setSelectedModel(savedModel);
        setIsCustomModel(false);
      } else {
        setSelectedModel("custom");
        setCustomModel(savedModel);
        setIsCustomModel(true);
      }
    }
  }, [settings]);

  const handleModelSelect = (val: string) => {
    setSelectedModel(val);
    if (val === "custom") {
      setIsCustomModel(true);
    } else {
      setIsCustomModel(false);
      setCustomModel("");
    }
  };

  const getEffectiveModel = () => {
    if (isCustomModel && customModel.trim()) return customModel.trim();
    if (selectedModel !== "custom") return selectedModel;
    return "anthropic/claude-3.5-sonnet";
  };

  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Settings saved!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => toast.error("Failed to save: " + err.message),
  });

  const handleSave = () => {
    const data: {
      openaiApiKey?: string;
      openrouterApiKey?: string;
      apiProvider: "openrouter";
      textModel: string;
      imageModel: string;
    } = {
      // Always use OpenRouter for writing
      apiProvider: "openrouter",
      textModel: getEffectiveModel(),
      imageModel,
    };

    if (apiKey.trim() && !apiKey.startsWith("sk-...")) {
      data.openaiApiKey = apiKey.trim();
    }
    if (openrouterKey.trim() && !openrouterKey.startsWith("sk-or-...")) {
      data.openrouterApiKey = openrouterKey.trim();
    }
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost" size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Configure your AI writing and image generation keys
            </p>
          </div>
        </div>

        <div className="space-y-6">

          {/* ── WRITING SECTION (OpenRouter) ── */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Book Writing</h2>
              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                OpenRouter
              </span>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              OpenRouter gives you access to Claude, Gemini, Llama, DeepSeek and hundreds of other models.
              All book writing uses OpenRouter exclusively.
            </p>

            {/* OpenRouter API Key */}
            <div>
              <Label className="text-foreground mb-1.5 block font-medium">
                OpenRouter API Key
              </Label>
              {settings?.hasOpenRouterKey && (
                <div className="flex items-center gap-2 mb-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved ({settings.openrouterApiKey})</span>
                </div>
              )}
              <div className="relative">
                <Input
                  type={showOrKey ? "text" : "password"}
                  placeholder={settings?.hasOpenRouterKey ? "Enter new key to replace..." : "sk-or-v1-..."}
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  className="bg-input border-border text-foreground pr-10 h-11"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  enterKeyHint="done"
                />
                <button
                  type="button"
                  onClick={() => setShowOrKey(!showOrKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {showOrKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1.5"
              >
                Get your free OpenRouter key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Writing Model Selector */}
            <div>
              <Label className="text-foreground mb-1.5 block font-medium">
                Writing Model
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Choose from the list or select "Custom" to enter any OpenRouter model ID.
              </p>
              <Select value={selectedModel} onValueChange={handleModelSelect}>
                <SelectTrigger className="bg-input border-border text-foreground h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-72">
                  {POPULAR_OPENROUTER_MODELS.map((m) => (
                    <SelectItem
                      key={m.value}
                      value={m.value}
                      className="text-foreground hover:bg-muted min-h-[44px]"
                    >
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom model input — shown when "Custom" is selected */}
              {isCustomModel && (
                <div className="mt-3">
                  <Label className="text-foreground mb-1.5 block text-sm">
                    Custom Model ID
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. anthropic/claude-opus-4-5"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="bg-input border-border text-foreground h-11"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="done"
                  />
                  <a
                    href="https://openrouter.ai/models"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1.5"
                  >
                    Browse all OpenRouter models <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Show the effective model that will be used */}
              {!isCustomModel && selectedModel !== "custom" && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  Active model: <span className="text-primary font-mono">{selectedModel}</span>
                </p>
              )}
              {isCustomModel && customModel.trim() && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  Active model: <span className="text-primary font-mono">{customModel.trim()}</span>
                </p>
              )}
            </div>
          </div>

          {/* ── IMAGE GENERATION SECTION (OpenAI) ── */}
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Image className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Image Generation</h2>
              <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                OpenAI Only
              </span>
            </div>
            <p className="text-sm text-muted-foreground -mt-2">
              Book covers and illustrations use OpenAI's image models (DALL-E 3, GPT Image 1).
              This key is <strong className="text-foreground">only</strong> used for image generation — not for writing.
            </p>

            {/* OpenAI API Key */}
            <div>
              <Label className="text-foreground mb-1.5 block font-medium">
                OpenAI API Key
              </Label>
              {settings?.hasApiKey && (
                <div className="flex items-center gap-2 mb-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved ({settings.openaiApiKey})</span>
                </div>
              )}
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={settings?.hasApiKey ? "Enter new key to replace..." : "sk-..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-input border-border text-foreground pr-10 h-11"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  enterKeyHint="done"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1.5"
              >
                Get your OpenAI key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Image Model */}
            <div>
              <Label className="text-foreground mb-1.5 block font-medium">
                Image Model
              </Label>
              <Select value={imageModel} onValueChange={setImageModel}>
                <SelectTrigger className="bg-input border-border text-foreground h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {IMAGE_MODELS.map((m) => (
                    <SelectItem
                      key={m.value}
                      value={m.value}
                      className="text-foreground hover:bg-muted min-h-[44px]"
                    >
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full btn-glow text-white font-semibold rounded-xl min-h-[52px] text-base"
          >
            {saveMutation.isPending ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
          </Button>

          {/* Help note */}
          <p className="text-center text-xs text-muted-foreground pb-4">
            Your API keys are stored securely and only used to call the respective APIs directly.
            They are never shared or used for any other purpose.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
