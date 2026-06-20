import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Leaf,
  Flame,
  Trophy,
  Sparkles,
  LogOut,
  TreePine,
  Zap,
  ArrowRight,
  Swords,
  TrendingDown,
  Award,
  Car,
  UtensilsCrossed,
  Camera,
  Loader2,
  Plus,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";
import { listMyLogs, createLog, analyzeFoodPhoto } from "@/lib/logs.functions";
import { sendCoachMessage } from "@/lib/coach.functions";
import { AppNav } from "@/components/app-nav";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const fetchLogs = useServerFn(listMyLogs);
  const logsQuery = useQuery({ queryKey: ["logs"], queryFn: () => fetchLogs() });

  const [hoveredRing, setHoveredRing] = useState<string | null>(null);

  const analyzePhoto = useServerFn(analyzeFoodPhoto);
  const addLog = useServerFn(createLog);
  const sendCoachMsg = useServerFn(sendCoachMessage);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    activity: string;
    co2_kg: number;
    notes: string;
  } | null>(null);

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
      setScanResult(null);

      try {
        const result = await analyzePhoto({
          data: {
            imageBase64: base64Data,
            mimeType: file.type,
          },
        });

        setScanResult(result);
        toast.success("Meal analyzed! You can now log it.");
      } catch (err: unknown) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : String(err);
        toast.error(errMsg || "Failed to analyze meal photo.");
        setPhotoPreview(null);
        setScanResult(null);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const logMutation = useMutation({
    mutationFn: () => {
      if (!scanResult) throw new Error("No scan result found");
      return addLog({
        data: {
          category: "food",
          activity: scanResult.activity,
          co2_kg: scanResult.co2_kg,
          notes: scanResult.notes || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Meal logged! +10 XP");
      setPhotoPreview(null);
      setScanResult(null);
      qc.invalidateQueries({ queryKey: ["logs"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to log meal");
    },
  });

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

  useEffect(() => {
    if (profile.data && !profile.data.onboarding_complete) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile.data, navigate]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const p = profile.data;
  const baseline = Number(p?.baseline_co2_kg ?? 0);
  const monthly = Math.round(baseline / 12) || 150;
  const saved = Number(p?.total_co2_saved_kg ?? 0);

  // Define badges dynamically based on profile metrics
  const badges = [
    {
      id: "green-pioneer",
      name: "Green Pioneer",
      icon: "🌱",
      desc: "Onboarding completed and carbon goals set.",
      hint: "Complete onboarding to unlock.",
      unlocked: !!p?.onboarding_complete,
    },
    {
      id: "zero-emission-commuter",
      name: "Green Commuter",
      icon: "🚲",
      desc: "Commute using eco-friendly transportation.",
      hint: "Use Walk/Bike or EV for commuting.",
      unlocked: p ? p.commute_mode === "walk_bike" || p.commute_mode === "ev" : false,
    },
    {
      id: "plant-powered",
      name: "Plant-Powered",
      icon: "🥗",
      desc: "Adopted a low-emissions vegetarian or vegan diet.",
      hint: "Set diet to Vegetarian or Vegan.",
      unlocked: p ? p.diet_type === "vegetarian" || p.diet_type === "vegan" : false,
    },
    {
      id: "habit-builder",
      name: "Habit Builder",
      icon: "🔥",
      desc: "Log your carbon footprint for 3+ consecutive days.",
      hint: "Maintain a logging streak of 3 days.",
      unlocked: p ? p.streak_days >= 3 : false,
    },
    {
      id: "carbon-offset-hero",
      name: "Carbon Hero",
      icon: "🌳",
      desc: "Saved 20+ kg of CO2e through completed quests.",
      hint: "Save 20kg of CO2e by completing quests.",
      unlocked: p ? p.total_co2_saved_kg >= 20 : false,
    },
    {
      id: "island-guardian",
      name: "Island Guardian",
      icon: "🏝️",
      desc: "Nurtured your island to Stage 3 or higher.",
      hint: "Reach Island Stage 3.",
      unlocked: p ? p.island_stage >= 3 : false,
    },
  ];

  // Daily budget calculations (defaults are scaled from baseline)
  const dailyBudget = Math.round(baseline / 365) || 15;
  const transportBudget = Math.round(dailyBudget * 0.4) || 6.0;
  const foodBudget = Math.round(dailyBudget * 0.3) || 4.5;

  // Today's logs calculations
  const todayLogs =
    logsQuery.data?.filter((log) => {
      const logDate = new Date(log.occurred_at).toDateString();
      const todayDate = new Date().toDateString();
      return logDate === todayDate;
    }) ?? [];

  const todayTotal = todayLogs.reduce((acc, log) => acc + Number(log.co2_kg), 0);
  const todayTransport = todayLogs
    .filter((log) => log.category === "transport")
    .reduce((acc, log) => acc + Number(log.co2_kg), 0);
  const todayFood = todayLogs
    .filter((log) => log.category === "food")
    .reduce((acc, log) => acc + Number(log.co2_kg), 0);

  const totalPct = dailyBudget > 0 ? Math.min(todayTotal / dailyBudget, 1) : 0;
  const transportPct = transportBudget > 0 ? Math.min(todayTransport / transportBudget, 1) : 0;
  const foodPct = foodBudget > 0 ? Math.min(todayFood / foodBudget, 1) : 0;

  // Dynamic Chart scaling based on user average
  const target = Math.round(monthly * 0.85); // 15% reduction goal
  const chartData = [
    { month: "Jan", actual: Math.round(monthly * 1.1), target },
    { month: "Feb", actual: Math.round(monthly * 1.05), target },
    { month: "Mar", actual: Math.round(monthly * 0.98), target },
    { month: "Apr", actual: Math.round(monthly * 1.02), target },
    { month: "May", actual: Math.round(monthly * 0.92), target },
    {
      month: "Jun",
      actual: Math.round(monthly * 0.88),
      target,
      projected: Math.round(monthly * 0.88),
    },
    { month: "Jul", target, projected: Math.round(monthly * 0.84) },
    { month: "Aug", target, projected: Math.round(monthly * 0.78) },
    { month: "Sep", target, projected: Math.round(monthly * 0.75) },
  ];

  // Dynamic Standings based on user XP and Streak
  const userXp = p?.xp ?? 0;
  const userStreak = p?.streak_days ?? 0;
  const standings = [
    { name: p?.display_name ?? "You", xp: userXp, avatar: "🟢", streak: userStreak, isUser: true },
    { name: "Ravi K.", xp: 1250, avatar: "⚡", streak: 12 },
    { name: "Anya S.", xp: 1100, avatar: "🌸", streak: 8 },
    { name: "Nils M.", xp: 980, avatar: "❄️", streak: 0 },
    { name: "Chloe L.", xp: 850, avatar: "🦊", streak: 4 },
  ].sort((a, b) => b.xp - a.xp);

  // Custom tooltips inside recharts
  interface TooltipItem {
    name: string;
    value: number;
    color: string;
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: TooltipItem[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl glass-strong p-3 border border-border/60 shadow-elevated text-xs">
          <p className="font-semibold mb-1 text-foreground">{label}</p>
          {payload.map((pl) => (
            <p key={pl.name} className="font-mono text-xs" style={{ color: pl.color }}>
              {pl.name}: {pl.value} kg
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)] opacity-40" />

      <header className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">EcoVerse AI</span>
        </Link>
        <span className="ml-auto hidden font-mono text-xs uppercase tracking-wider text-muted-foreground sm:block">
          {p?.display_name ?? "Architect"} · Level {p?.level ?? 1} · {p?.xp ?? 0} XP
        </span>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>
      <AppNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono uppercase tracking-wider text-muted-foreground">
            Welcome back, {p?.display_name ?? "Earth Architect"}
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Your <span className="text-gradient-canopy">carbon dashboard</span>
        </h1>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-8 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<TreePine className="h-5 w-5" />}
          label="Yearly baseline"
          value={`${baseline.toLocaleString()} kg`}
          sub="CO₂e estimated"
          tone="primary"
        />
        <MetricCard
          icon={<Zap className="h-5 w-5" />}
          label="Monthly avg"
          value={`${monthly.toLocaleString()} kg`}
          sub="per month"
        />
        <MetricCard
          icon={<Flame className="h-5 w-5" />}
          label="Streak"
          value={`${p?.streak_days ?? 0} days`}
          sub="keep it alive"
        />
        <MetricCard
          icon={<Trophy className="h-5 w-5" />}
          label="CO₂ saved"
          value={`${saved.toLocaleString()} kg`}
          sub="via quests"
        />
      </section>

      {/* Main Insights Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Carbon Rings Card */}
          <div className="rounded-3xl glass-strong p-6 shadow-elevated relative overflow-hidden flex flex-col justify-between min-h-[380px]">
            <div>
              <h2 className="font-display font-bold text-xl tracking-tight">Daily Carbon Budget</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hover or tap rings to view details
              </p>
            </div>

            <div className="relative flex items-center justify-center w-[200px] h-[200px] mx-auto my-4">
              <svg width="200" height="200" viewBox="0 0 200 200" className="select-none">
                {/* Outer Ring (Total) - Track */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="12"
                />
                {/* Outer Ring (Total) - Progress */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="transparent"
                  stroke="oklch(0.82 0.24 152)"
                  strokeWidth="12"
                  strokeDasharray="502.65"
                  strokeDashoffset={502.65 * (1 - totalPct)}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredRing("total")}
                  onMouseLeave={() => setHoveredRing(null)}
                  opacity={hoveredRing === null || hoveredRing === "total" ? 1 : 0.3}
                />

                {/* Middle Ring (Transport) - Track */}
                <circle
                  cx="100"
                  cy="100"
                  r="62"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="12"
                />
                {/* Middle Ring (Transport) - Progress */}
                <circle
                  cx="100"
                  cy="100"
                  r="62"
                  fill="transparent"
                  stroke="oklch(0.78 0.14 188)"
                  strokeWidth="12"
                  strokeDasharray="389.55"
                  strokeDashoffset={389.55 * (1 - transportPct)}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredRing("transport")}
                  onMouseLeave={() => setHoveredRing(null)}
                  opacity={hoveredRing === null || hoveredRing === "transport" ? 1 : 0.3}
                />

                {/* Inner Ring (Food) - Track */}
                <circle
                  cx="100"
                  cy="100"
                  r="44"
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="12"
                />
                {/* Inner Ring (Food) - Progress */}
                <circle
                  cx="100"
                  cy="100"
                  r="44"
                  fill="transparent"
                  stroke="oklch(0.8 0.19 70)"
                  strokeWidth="12"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 * (1 - foodPct)}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredRing("food")}
                  onMouseLeave={() => setHoveredRing(null)}
                  opacity={hoveredRing === null || hoveredRing === "food" ? 1 : 0.3}
                />
              </svg>

              {/* Dynamic Center Legend */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                {hoveredRing === "transport" ? (
                  <>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-secondary">
                      Transport
                    </span>
                    <span className="font-display text-lg font-bold text-foreground mt-0.5">
                      {todayTransport.toFixed(1)}kg
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      of {transportBudget}kg limit
                    </span>
                  </>
                ) : hoveredRing === "food" ? (
                  <>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400">
                      Food & Diet
                    </span>
                    <span className="font-display text-lg font-bold text-foreground mt-0.5">
                      {todayFood.toFixed(1)}kg
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      of {foodBudget}kg limit
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-primary">
                      Daily Total
                    </span>
                    <span className="font-display text-xl font-bold text-foreground mt-0.5 animate-fade-in">
                      {todayTotal.toFixed(1)}kg
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      of {dailyBudget}kg budget
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Legend at the bottom of card */}
            <div className="flex justify-around text-[10px] font-mono uppercase tracking-wider border-t border-border/20 pt-3">
              <span
                className={`flex items-center gap-1 cursor-default transition-opacity ${
                  hoveredRing && hoveredRing !== "total" ? "opacity-40" : "opacity-100"
                }`}
                onMouseEnter={() => setHoveredRing("total")}
                onMouseLeave={() => setHoveredRing(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Total
              </span>
              <span
                className={`flex items-center gap-1 cursor-default transition-opacity ${
                  hoveredRing && hoveredRing !== "transport" ? "opacity-40" : "opacity-100"
                }`}
                onMouseEnter={() => setHoveredRing("transport")}
                onMouseLeave={() => setHoveredRing(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" /> Transport
              </span>
              <span
                className={`flex items-center gap-1 cursor-default transition-opacity ${
                  hoveredRing && hoveredRing !== "food" ? "opacity-40" : "opacity-100"
                }`}
                onMouseEnter={() => setHoveredRing("food")}
                onMouseLeave={() => setHoveredRing(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Food
              </span>
            </div>
          </div>

          {/* Chart Card */}
          <div className="rounded-3xl glass-strong p-6 shadow-elevated relative overflow-hidden flex flex-col justify-between min-h-[380px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-xl tracking-tight">
                  Emissions Trend & AI Forecast
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  30-day history with 3-month projected path
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 rounded-full px-2.5 py-1 font-semibold">
                <TrendingDown className="h-3.5 w-3.5" /> -12% vs last month
              </span>
            </div>

            <div className="flex-1 w-full min-h-[260px] text-foreground">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.82 0.24 152)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="oklch(0.82 0.24 152)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="projectGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.14 188)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="oklch(0.78 0.14 188)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="oklch(0.66 0.04 150)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="oklch(0.66 0.04 150)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    name="Actual"
                    type="monotone"
                    dataKey="actual"
                    stroke="oklch(0.82 0.24 152)"
                    strokeWidth={2}
                    fill="url(#actualGrad)"
                  />
                  <Area
                    name="Target"
                    type="monotone"
                    dataKey="target"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                  <Area
                    name="AI Projection"
                    type="monotone"
                    dataKey="projected"
                    stroke="oklch(0.78 0.14 188)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    fill="url(#projectGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Gamification Sidebar */}
        <div className="grid gap-6">
          {/* Quick-Scan Meal Card */}
          <div className="rounded-3xl glass-strong p-5 shadow-elevated border border-primary/10 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-primary" /> Quick-Scan Meal
                </span>
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  Powered by Gemini <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                </span>
              </div>

              {photoPreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/20 h-44 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="Meal preview"
                    className="w-full h-full object-cover"
                  />
                  {analyzing ? (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan shadow-[0_0_8px_oklch(0.82_0.24_152)]" />
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-1.5" />
                      <p className="font-display font-semibold text-xs text-foreground">
                        EcoAI is analyzing...
                      </p>
                    </div>
                  ) : scanResult ? (
                    <div className="absolute inset-0 bg-background/85 backdrop-blur-sm flex flex-col justify-between p-3.5">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                              Detected Meal
                            </div>
                            <div className="font-display font-bold text-sm text-foreground truncate max-w-[120px] mt-0.5">
                              🥑 {scanResult.activity}
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
                            {scanResult.co2_kg < 2 ? "Low" : scanResult.co2_kg < 5 ? "Mod" : "High"}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block">
                            Footprint
                          </span>
                          <span className="font-display font-bold text-sm text-primary">
                            {scanResult.co2_kg} kg CO₂e
                          </span>
                        </div>
                      </div>

                      {scanResult.co2_kg >= 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleGenerateAlternative(scanResult.activity, scanResult.co2_kg)
                          }
                          className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-secondary/30 bg-secondary/10 px-2 py-1 text-[10px] font-semibold text-secondary hover:bg-secondary/20 transition-all mb-1 animate-fade-in"
                        >
                          <Sparkles className="h-3 w-3 text-secondary animate-pulse" />
                          Generate Eco-Alternative
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setScanResult(null);
                          }}
                          className="flex-1 rounded-xl glass py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground text-center transition-all"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          disabled={logMutation.isPending}
                          onClick={() => logMutation.mutate()}
                          className="flex-[2] rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground py-1 text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-glow-sm"
                        >
                          {logMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Log Meal
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <label className="group relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/5 py-7 px-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                    disabled={analyzing}
                  />
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30 group-hover:scale-105 transition-transform mb-2">
                    <Camera className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="font-display font-semibold text-xs">Upload & Scan Meal</div>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                    Auto-estimate carbon and log in one tap
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Live Carbon Duel Card */}
          <div className="rounded-3xl glass-strong p-6 shadow-elevated border border-primary/20 relative overflow-hidden flex flex-col justify-between min-h-[170px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <Swords className="h-3.5 w-3.5 text-secondary animate-pulse" /> Live Carbon Duel
                </span>
                <span className="rounded-full bg-canopy-amber/15 px-2.5 py-0.5 font-mono text-[9px] font-bold text-canopy-amber">
                  3d Left
                </span>
              </div>
              <h3 className="font-display font-bold text-lg mt-2">Wager: Tree planting</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                The loser pays to plant a tree in the other's name.
              </p>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-primary">You ({Math.round(monthly * 0.2)} kg)</span>
                  <span className="text-muted-foreground">
                    Ravi K. ({Math.round(monthly * 0.25)} kg)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted flex">
                  <div className="h-full bg-primary" style={{ width: "45%" }} />
                  <div className="h-full bg-secondary/50" style={{ width: "55%" }} />
                </div>
                <div className="text-[10px] text-primary flex items-center justify-between font-mono mt-1">
                  <span>
                    ↓ Leading by {Math.max(0, Math.round(monthly * 0.25 - monthly * 0.2))} kg!
                  </span>
                  <span>Keep logging to win</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaf League Rankings Card */}
          <div className="rounded-3xl glass-strong p-5 shadow-elevated flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-primary" /> Leaf League Rankings
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">League #48</span>
              </div>

              <ul className="space-y-2">
                {standings.map((s, idx) => (
                  <li
                    key={s.name}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors ${
                      s.isUser ? "bg-primary/10 border border-primary/20" : "bg-background/20"
                    }`}
                  >
                    <span className="font-mono text-muted-foreground w-3">{idx + 1}</span>
                    <span className="text-base">{s.avatar}</span>
                    <span
                      className={`flex-1 font-medium ${s.isUser ? "text-primary" : "text-foreground"}`}
                    >
                      {s.name} {s.isUser && " (You)"}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-right">
                      {s.streak > 0 && (
                        <span className="text-[10px] text-canopy-amber flex items-center gap-0.5">
                          🔥{s.streak}
                        </span>
                      )}
                      <span className="font-bold">
                        {s.xp} <span className="text-[9px] text-muted-foreground">XP</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="rounded-3xl glass-strong p-6 shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="mb-4">
            <h2 className="font-display font-bold text-xl tracking-tight flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Eco-Achievements
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your environmental milestones. Complete quests and log daily to unlock them.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                  badge.unlocked
                    ? "bg-primary/5 border-primary/20 text-foreground scale-100 hover:-translate-y-1 hover:shadow-glow-sm cursor-pointer"
                    : "bg-background/20 border-border/40 text-muted-foreground opacity-50"
                }`}
                title={badge.unlocked ? `Unlocked! ${badge.desc}` : `Locked: ${badge.hint}`}
              >
                <div
                  className={`text-3xl mb-2 transition-all duration-300 ${
                    badge.unlocked
                      ? "filter-none drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                      : "grayscale opacity-40"
                  }`}
                >
                  {badge.icon}
                </div>
                <div className="text-xs font-semibold text-center truncate w-full">
                  {badge.name}
                </div>
                <div className="text-[9px] text-muted-foreground text-center mt-1 font-mono uppercase tracking-wider">
                  {badge.unlocked ? "Unlocked" : "Locked"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 pb-24 md:grid-cols-2 lg:grid-cols-4">
        <ShortcutCard to="/log" title="Log emission" desc="Track what you did today" />
        <ShortcutCard to="/challenges" title="Pick a quest" desc="Earn XP, cut CO₂" />
        <ShortcutCard to="/coach" title="Ask EcoAI" desc="Personalized advice" />
        <ShortcutCard to="/island" title="See your island" desc="Watch it grow" />
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "primary";
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass-strong p-6 shadow-elevated">
      {tone === "primary" && (
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-canopy)] opacity-10" />
      )}
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ShortcutCard({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl glass p-5 transition-colors hover:border-primary/40"
    >
      <div>
        <div className="font-display font-bold">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}
