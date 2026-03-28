import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Settings2, Key, Cpu, Image, ArrowLeft, CheckCircle2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";

const OPENAI_TEXT_MODELS = [
  { value: "gpt-4o", label: "GPT-4o — Fast & Reliable (Recommended)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini — Budget Friendly" },
  { value: "gpt-4.1", label: "GPT-4.1 — High Quality" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini — Fast & Efficient" },
  { value: "gpt-4.1-nano", label: "GPT-4.1 Nano — Ultra Fast" },
  { value: "o4-mini", label: "o4-mini — Advanced Reasoning" },
  { value: "o3-mini", label: "o3-mini — Strong Reasoning" },
  { value: "gpt-5", label: "GPT-5 — Flagship Model" },
];

const OPENROUTER_TEXT_MODELS = [
  { value: "anthropic/claude-opus-4", label: "Claude Opus 4 — Most Powerful" },
  { value: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5 — Best Balance" },
  { value: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet — Fast & Smart" },
  { value: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku — Fast & Cheap" },
  { value: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro — Google Flagship" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash — Very Fast" },
  { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick — Open Source" },
  { value: "meta-llama/llama-4-scout", label: "Llama 4 Scout — Efficient" },
  { value: "deepseek/deepseek-r2", label: "DeepSeek R2 — Reasoning" },
  { value: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3 — Budget Friendly" },
  { value: "openai/gpt-4o", label: "GPT-4o (via OpenRouter)" },
  { value: "openai/gpt-4.1", label: "GPT-4.1 (via OpenRouter)" },
  { value: "x-ai/grok-3", label: "Grok 3 — xAI Flagship" },
  { value: "mistralai/mistral-large-2411", label: "Mistral Large — European AI" },
];

const IMAGE_MODELS = [
  { value: "dall-e-3", label: "DALL-E 3 — High Quality (Recommended)" },
  { value: "gpt-image-1", label: "GPT Image 1 — Latest OpenAI" },
  { value: "dall-e-2", label: "DALL-E 2 — Fast & Affordable" },
];

export default function Settings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [apiKey, setApiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showOrKey, setShowOrKey] = useState(false);
  const [apiProvider, setApiProvider] = useState<"openai" | "openrouter">("openai");
  const [textModel, setTextModel] = useState("gpt-4o");
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
      setApiProvider((settings.apiProvider as "openai" | "openrouter") || "openai");
      setTextModel(settings.textModel || "gpt-4o");
      setImageModel(settings.imageModel || "dall-e-3");
    }
  }, [settings]);

  const handleProviderChange = (val: "openai" | "openrouter") => {
    setApiProvider(val);
    if (val === "openai") setTextModel("gpt-4o");
    else setTextModel("anthropic/claude-sonnet-4-5");
  };

  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Settings saved successfully!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => toast.error("Failed to save: " + err.message),
  });

  const handleSave = () => {
    const data: {
      openaiApiKey?: string;
      openrouterApiKey?: string;
      apiProvider: "openai" | "openrouter";
      textModel: string;
      imageModel: string;
    } = { apiProvider, textModel, imageModel };

    if (apiKey.trim() && !apiKey.includes("sk-...")) {
      data.openaiApiKey = apiKey.trim();
    }
    if (openrouterKey.trim() && !openrouterKey.includes("sk-or-...")) {
      data.openrouterApiKey = openrouterKey.trim();
    }
    saveMutation.mutate(data);
  };

  const textModels = apiProvider === "openrouter" ? OPENROUTER_TEXT_MODELS : OPENAI_TEXT_MODELS;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Configure your AI provider, models, and API keys</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Provider Selector */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">AI Text Provider</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Choose your AI provider for writing. OpenAI is direct; OpenRouter gives access to Claude, Gemini, Llama, and more.
              <strong className="text-foreground"> Images always use OpenAI regardless of this setting.</strong>
            </p>
            <Tabs value={apiProvider} onValueChange={(v) => handleProviderChange(v as "openai" | "openrouter")}>
              <TabsList className="grid grid-cols-2 bg-muted/50 w-full">
                <TabsTrigger value="openai" className="data-[state=active]:bg-primary data-[state=active]:text-white min-h-[40px]">
                  OpenAI
                </TabsTrigger>
                <TabsTrigger value="openrouter" className="data-[state=active]:bg-primary data-[state=active]:text-white min-h-[40px]">
                  OpenRouter
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* API Keys */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
            </div>

            {/* OpenAI Key */}
            <div>
              <Label className="text-foreground mb-1.5 block flex items-center gap-2">
                OpenAI API Key
                <span className="text-xs text-muted-foreground">(required for images)</span>
              </Label>
              {settings?.hasApiKey && (
                <div className="flex items-center gap-2 mb-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configured ({settings.openaiApiKey})</span>
                </div>
              )}
              <div className="relative">
                {/*
                  FIX: Use type="text" when showing key, prevent password autofill.
                  - autoComplete="off" prevents browser autofill
                  - autoCorrect="off" prevents iOS autocorrect
                  - autoCapitalize="off" prevents iOS autocapitalize
                  - spellCheck={false} prevents spell check UI
                  - data-1p-ignore prevents 1Password from detecting this field
                  - data-lpignore prevents LastPass from detecting this field
                  - inputMode="text" ensures full text keyboard on mobile
                */}
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={settings?.hasApiKey ? "Enter new key to replace..." : "sk-..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-input border-border text-foreground pr-10 h-10"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  enterKeyHint="done"
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                Get OpenAI key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* OpenRouter Key */}
            <div>
              <Label className="text-foreground mb-1.5 block flex items-center gap-2">
                OpenRouter API Key
                <span className="text-xs text-muted-foreground">(required if using OpenRouter)</span>
              </Label>
              {settings?.hasOpenRouterKey && (
                <div className="flex items-center gap-2 mb-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configured ({settings.openrouterApiKey})</span>
                </div>
              )}
              <div className="relative">
                <Input
                  type={showOrKey ? "text" : "password"}
                  placeholder={settings?.hasOpenRouterKey ? "Enter new key to replace..." : "sk-or-..."}
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  className="bg-input border-border text-foreground pr-10 h-10"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  enterKeyHint="done"
                />
                <button type="button" onClick={() => setShowOrKey(!showOrKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                  {showOrKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                Get OpenRouter key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Text Model */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Writing Model</h2>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {apiProvider === "openrouter" ? "OpenRouter" : "OpenAI"}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {apiProvider === "openrouter"
                ? "Choose from Claude, Gemini, Llama, DeepSeek and more via OpenRouter."
                : "Choose the OpenAI model for writing book content."}
            </p>
            <Select value={textModel} onValueChange={setTextModel}>
              <SelectTrigger className="bg-input border-border text-foreground h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-64">
                {textModels.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-foreground hover:bg-muted min-h-[40px]">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Model */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Image Generation Model</h2>
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">OpenAI Only</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Always uses your OpenAI key. DALL-E 3 is recommended for book covers and illustrations.
            </p>
            <Select value={imageModel} onValueChange={setImageModel}>
              <SelectTrigger className="bg-input border-border text-foreground h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {IMAGE_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-foreground hover:bg-muted min-h-[40px]">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full btn-glow text-white font-semibold py-3 rounded-xl min-h-[48px]"
          >
            {saveMutation.isPending ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
