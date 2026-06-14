import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trash2, Car, UtensilsCrossed, Zap, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { createLog, listMyLogs, deleteLog } from "@/lib/logs.functions";

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
  const qc = useQueryClient();
  const fetchLogs = useServerFn(listMyLogs);
  const add = useServerFn(createLog);
  const remove = useServerFn(deleteLog);
  const logs = useQuery({ queryKey: ["logs"], queryFn: () => fetchLogs() });

  const [cat, setCat] = useState<(typeof CATEGORIES)[number]["key"]>("transport");
  const [activity, setActivity] = useState("");
  const [co2, setCo2] = useState<number>(5);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      add({ data: { category: cat, activity: activity.trim(), co2_kg: co2, notes: notes || null } }),
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
