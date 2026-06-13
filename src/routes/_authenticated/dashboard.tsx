import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Leaf, Flame, Trophy, Sparkles, LogOut, TreePine, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

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
  const baseline = p?.baseline_co2_kg ?? 0;
  const monthly = Math.round((Number(baseline) || 0) / 12);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)] opacity-40" />

      <header className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">EcoVerse AI</span>
        </Link>
        <span className="ml-auto hidden font-mono text-xs uppercase tracking-wider text-muted-foreground sm:block">
          {p?.display_name ?? "Architect"} · Level {p?.level ?? 1}
        </span>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono uppercase tracking-wider text-muted-foreground">
            Welcome back, {p?.display_name ?? "Earth Architect"}
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Your <span className="text-gradient-canopy">carbon dashboard</span>
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Baseline calibrated from your onboarding. The next phases unlock logging,
          challenges, your living island, and the EcoAI coach.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-16 md:grid-cols-3">
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
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl glass-strong p-8 shadow-elevated md:p-10">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-[var(--canopy-gold)]" />
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Coming next
            </h2>
          </div>
          <ul className="mt-5 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <li className="rounded-xl border border-border/40 bg-background/30 p-4">
              <span className="font-semibold text-foreground">Emission logging</span> — manual entries + food photo analyzer.
            </li>
            <li className="rounded-xl border border-border/40 bg-background/30 p-4">
              <span className="font-semibold text-foreground">EcoAI coach</span> — chat with a personalized AI advisor.
            </li>
            <li className="rounded-xl border border-border/40 bg-background/30 p-4">
              <span className="font-semibold text-foreground">Daily challenges</span> — XP, streaks, levels, badges.
            </li>
            <li className="rounded-xl border border-border/40 bg-background/30 p-4">
              <span className="font-semibold text-foreground">Living island</span> — 2.5D world that mirrors your habits.
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon, label, value, sub, tone,
}: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: "primary" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass-strong p-6 shadow-elevated">
      {tone === "primary" && <div className="absolute inset-0 -z-10 bg-[var(--gradient-canopy)] opacity-10" />}
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
