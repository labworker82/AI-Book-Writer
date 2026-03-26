import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Settings2, Key, Cpu, Image, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";

const TEXT_MODELS = [
  { value: "gpt-4o", label: "GPT-4o — Fast & Reliable (Recommended)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini — Budget Friendly" },
  { value: "gpt-4.1", label: "GPT-4.1 — High Quality" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini — Fast & Efficient" },
  { value: "o4-mini", label: "o4-mini — Advanced Reasoning" },
  { value: "gpt-5", label: "GPT-5 — Flagship Model" },
  { value: "gpt-5.4", label: "GPT-5.4 — Latest Frontier" },
];

const IMAGE_MODELS = [
  { value: "gpt-image-1", label: "GPT Image 1 — Latest (Recommended)" },
  { value: "dall-e-3", label: "DALL-E 3 — High Quality" },
  { value: "dall-e-2", label: "DALL-E 2 — Fast & Affordable" },
];

export default function Settings() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [textModel, setTextModel] = useState("gpt-4o");
  const [imageModel, setImageModel] = useState("gpt-image-1");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const { data: settings, isLoading } = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (settings) {
      setTextModel(settings.textModel || "gpt-4o");
      setImageModel(settings.imageModel || "gpt-image-1");
    }
  }, [settings]);

  const saveMutation = trpc.settings.save.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Settings saved successfully!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => toast.error("Failed to save: " + err.message),
  });

  const handleSave = () => {
    const data: { openaiApiKey?: string; textModel: string; imageModel: string } = {
      textModel,
      imageModel,
    };
    if (apiKey.trim() && apiKey !== "sk-...") {
      data.openaiApiKey = apiKey.trim();
    }
    saveMutation.mutate(data);
  };

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
            <p className="text-muted-foreground text-sm mt-0.5">Configure your AI models and API key</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Key Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">OpenAI API Key</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Your API key is stored securely and used only to call OpenAI on your behalf.
              Get your key at{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                platform.openai.com/api-keys
              </a>
            </p>

            {settings?.hasApiKey && (
              <div className="flex items-center gap-2 mb-3 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>API key configured ({settings.openaiApiKey})</span>
              </div>
            )}

            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={settings?.hasApiKey ? "Enter new key to replace existing..." : "sk-..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-input border-border text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Text Model Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Text Generation Model</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Choose the model for writing book content. GPT-4o is recommended for the best balance of quality and speed.
            </p>
            <Select value={textModel} onValueChange={setTextModel}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {TEXT_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-foreground hover:bg-muted">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Model Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Image Generation Model</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Choose the model for generating book covers and illustrations.
            </p>
            <Select value={imageModel} onValueChange={setImageModel}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {IMAGE_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-foreground hover:bg-muted">
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
            className="w-full btn-glow text-white font-semibold py-3 rounded-xl"
          >
            {saveMutation.isPending ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
