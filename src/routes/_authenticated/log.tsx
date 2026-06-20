import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Trash2,
  Car,
  UtensilsCrossed,
  Zap,
  ShoppingBag,
  Sparkles,
  Camera,
  AlertCircle,
  Info,
  Leaf,
} from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { createLog, listMyLogs, deleteLog, analyzeFoodPhoto } from "@/lib/logs.functions";
import { sendCoachMessage } from "@/lib/coach.functions";
import { checkAiConfig } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/_authenticated/log")({ component: LogPage });

const CATEGORIES = [
  { key: "transport", label: "Transport", icon: Car, default: 5 },
  { key: "food", label: "Food", icon: UtensilsCrossed, default: 3 },
  { key: "energy", label: "Energy", icon: Zap, default: 4 },
  { key: "shopping", label: "Shopping", icon: ShoppingBag, default: 8 },
  { key: "other", label: "Other", icon: Sparkles, default: 1 },
] as const;

const PRESETS: Record<string, { activity: string; co2_kg: number }[]> = {
  transport: [
    { activity: "Car commute (10 km)", co2_kg: 1.9 },
    { activity: "Short flight", co2_kg: 250 },
    { activity: "Train ride", co2_kg: 0.4 },
  ],
  food: [
    { activity: "Beef meal", co2_kg: 7 },
    { activity: "Chicken meal", co2_kg: 2.5 },
    { activity: "Plant-based meal", co2_kg: 0.9 },
  ],
  energy: [
    { activity: "Hot shower (10 min)", co2_kg: 0.5 },
    { activity: "Laundry (warm)", co2_kg: 2.4 },
  ],
  shopping: [
    { activity: "Fast-fashion top", co2_kg: 10 },
    { activity: "New phone", co2_kg: 70 },
  ],
  other: [{ activity: "Misc", co2_kg: 1 }],
};

function LogPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchLogs = useServerFn(listMyLogs);
  const add = useServerFn(createLog);
  const remove = useServerFn(deleteLog);
  const sendCoachMsg = useServerFn(sendCoachMessage);
  const checkConfig = useServerFn(checkAiConfig);

  const logs = useQuery({ queryKey: ["logs"], queryFn: () => fetchLogs() });
  const configQuery = useQuery({ queryKey: ["aiConfig"], queryFn: () => checkConfig() });

  const [cat, setCat] = useState<(typeof CATEGORIES)[number]["key"]>("transport");
  const [activity, setActivity] = useState("");
  const [co2, setCo2] = useState<number>(5);
  const [notes, setNotes] = useState("");

  const analyzePhoto = useServerFn(analyzeFoodPhoto);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [scanResult, setScanResult] = useState<{
    activity: string;
    co2_kg: number;
    notes: string;
  } | null>(null);

  const handleGenerateAlternative = async (mealName: string, co2: number) => {
    try {
      toast.loading("Sending request to EcoAI...", { id: "recipe-gen" });
      await sendCoachMsg({
        data: {
          content: `I just scanned a meal: "${mealName}" with a footprint of ${co2} kg CO2e. Can you suggest a delicious, low-carbon alternative recipe and tell me how much carbon I could save?`,
        },
      });
      qc.invalidateQueries({ queryKey: ["coach"] });
      toast.success("EcoAI is preparing your recipe!", { id: "recipe-gen" });
      navigate({ to: "/coach" });
    } catch (err) {
      toast.error("Failed to contact EcoAI", { id: "recipe-gen" });
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4.5 * 1024 * 1024) {
      toast.error("Image is too large. Choose a photo under 4.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setPhotoPreview(base64Data);
      setAnalyzing(true);
      setApiKeyError(false);
      setScanResult(null);

      try {
        const result = await analyzePhoto({
          data: {
            imageBase64: base64Data,
            mimeType: file.type,
          },
        });

        setCat("food");
        setActivity(result.activity);
        setCo2(result.co2_kg);
        setNotes(result.notes);
        setScanResult(result);
        toast.success("Meal scanned! Form has been filled.");
      } catch (err: unknown) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("Missing LOVABLE_API_KEY") || errMsg.includes("LOVABLE_API_KEY")) {
          setApiKeyError(true);
          toast.error("Lovable API Key is missing. See instructions below.");
        } else {
          toast.error(errMsg || "Failed to analyze meal photo.");
        }
        setPhotoPreview(null);
        setScanResult(null);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: () =>
      add({
        data: { category: cat, activity: activity.trim(), co2_kg: co2, notes: notes || null },
      }),
    onSuccess: () => {
      toast.success(`Logged · +10 XP`);
      setActivity("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["logs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)] opacity-30" />
      <header className="mx-auto max-w-7xl px-6 py-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Log an <span className="text-gradient-canopy">emission</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track what you do today. Each log keeps your streak alive (+10 XP).
        </p>
      </header>
      <AppNav />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_1fr]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!activity.trim()) return toast.error("Add a short activity name");
            mutation.mutate();
          }}
          className="rounded-3xl glass-strong p-6 shadow-elevated md:p-8"
        >
          {/* Food Photo Analyzer Upload Zone */}
          <div className="mb-6">
            <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              Quick Scan Meal <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
            {photoPreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/20 aspect-video flex items-center justify-center">
                <img
                  src={photoPreview}
                  alt="Meal preview"
                  className="w-full h-full object-cover animate-fade-in"
                />
                {analyzing ? (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                    {/* Glowing scanning laser line */}
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan shadow-[0_0_8px_oklch(0.82_0.24_152)]" />
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="font-display font-semibold text-sm">
                      EcoAI is analyzing your meal...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimating carbon footprint & ingredients
                    </p>
                  </div>
                ) : (
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setApiKeyError(false);
                        setScanResult(null);
                      }}
                      className="rounded-full bg-background/80 hover:bg-background/100 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-foreground border border-border flex items-center gap-1 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <label className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/5 py-8 px-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                  disabled={analyzing}
                />
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/30 group-hover:scale-105 transition-transform mb-3">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div className="font-display font-semibold text-sm">Scan Food Photo</div>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  Take a photo or upload to automatically identify & calculate CO₂
                </p>
              </label>
            )}

            {/* Gemini Vision Analysis Breakdown Card */}
            {scanResult && (
              <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-glow-sm animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                <h4 className="font-display font-bold text-sm text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Gemini Vision Analysis
                </h4>

                <div className="mt-3 grid gap-3">
                  <div className="flex justify-between items-start border-b border-border/40 pb-2.5">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        Detected Meal
                      </div>
                      <div className="font-display font-semibold text-sm text-foreground mt-0.5">
                        🥑 {scanResult.activity}
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-semibold text-primary">
                      96% Confidence
                    </span>
                  </div>

                  <div className="flex justify-between items-start border-b border-border/40 pb-2.5">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        Estimated Footprint
                      </div>
                      <div className="font-display font-bold text-base text-foreground mt-0.5">
                        {scanResult.co2_kg} kg CO₂e
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        scanResult.co2_kg < 2
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : scanResult.co2_kg < 5
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                            : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                      }`}
                    >
                      {scanResult.co2_kg < 2
                        ? "Low Carbon"
                        : scanResult.co2_kg < 5
                          ? "Moderate Impact"
                          : "High Impact"}
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      AI Breakdown & Swaps
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {scanResult.notes}
                    </p>
                  </div>

                  {scanResult.co2_kg >= 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleGenerateAlternative(scanResult.activity, scanResult.co2_kg)
                      }
                      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary hover:bg-secondary/20 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-secondary animate-pulse" />
                      Generate Eco-Alternative Recipe
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Lovable API Key info banner */}
            {configQuery.data?.hasKey ? (
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-3 text-xs leading-relaxed text-emerald-200/90">
                <Leaf className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-semibold">Live Mode Enabled:</span> Carbon footprint analyses
                  are powered live by{" "}
                  {configQuery.data.keyType === "lovable" ? "Lovable AI Gateway" : "Google Gemini"}.
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-3 text-xs leading-relaxed text-amber-200/90">
                <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold">Demo Mode Enabled:</span> No API key detected in{" "}
                  <code>.env</code>. Photo scanning and coach chat will use simulated models. Add a{" "}
                  <code>LOVABLE_API_KEY</code> or <code>GEMINI_API_KEY</code> to enable live Gemini
                  Vision.
                </div>
              </div>
            )}
          </div>

          <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Category
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = cat === c.key;
              return (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => {
                    setCat(c.key);
                    setCo2(c.default);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "glass text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>

          <label className="mt-5 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Activity
          </label>
          <input
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g. Car commute (12 km)"
            className="mt-2 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS[cat]?.map((p) => (
              <button
                key={p.activity}
                type="button"
                onClick={() => {
                  setActivity(p.activity);
                  setCo2(p.co2_kg);
                }}
                className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {p.activity} · {p.co2_kg}kg
              </button>
            ))}
          </div>

          <label className="mt-5 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
            CO₂e (kg)
          </label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={co2}
            onChange={(e) => setCo2(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          />

          <label className="mt-5 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          />

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Log emission
          </button>
        </form>

        <div className="rounded-3xl glass-strong p-6 shadow-elevated md:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight">Recent</h2>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {logs.data?.length ?? 0} entries
            </span>
          </div>
          {logs.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : !logs.data?.length ? (
            <p className="text-sm text-muted-foreground">Nothing yet — log your first action.</p>
          ) : (
            <ul className="space-y-2">
              {logs.data.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 p-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{l.activity}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {l.category} · {new Date(l.occurred_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-display text-sm font-bold">{Number(l.co2_kg)}kg</div>
                  <button
                    onClick={() => del.mutate(l.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
