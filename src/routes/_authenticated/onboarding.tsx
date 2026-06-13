import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ArrowRight, ArrowLeft, Leaf, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getMyProfile, saveOnboarding } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

type Answers = {
  display_name?: string;
  country?: string;
  commute_mode?: string;
  weekly_km?: number;
  flights_per_year?: number;
  diet_type?: string;
  meals_out_per_week?: number;
  household_size?: number;
  heating_type?: string;
  renewable_pct?: number;
  fast_fashion_freq?: string;
  electronics_upgrade_years?: number;
  streaming_hours_per_week?: number;
};

const STEPS = ["You", "Transport", "Diet", "Home", "Lifestyle"] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const submit = useServerFn(saveOnboarding);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({});

  useEffect(() => {
    if (profile.data?.onboarding_complete) navigate({ to: "/dashboard", replace: true });
    if (profile.data?.display_name) setA((p) => ({ ...p, display_name: p.display_name ?? profile.data!.display_name! }));
  }, [profile.data, navigate]);

  const mutation = useMutation({
    mutationFn: () => submit({ data: a as never }),
    onSuccess: async (res) => {
      toast.success(`Baseline calibrated: ${res.baseline_co2_kg.toLocaleString()} kg CO₂e / yr`);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      navigate({ to: "/dashboard", replace: true });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't save"),
  });

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  function update<K extends keyof Answers>(k: K, v: Answers[K]) {
    setA((p) => ({ ...p, [k]: v }));
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else mutation.mutate();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)] opacity-50" />
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold">EcoVerse AI</span>
          <span className="ml-auto font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Step {step + 1} / {STEPS.length} · {STEPS[step]}
          </span>
        </div>

        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full gradient-canopy transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 rounded-3xl glass-strong p-8 shadow-elevated md:p-10">
          {step === 0 && (
            <StepShell
              title="Let's meet you"
              subtitle="A name and home base so your island feels yours."
            >
              <TextField label="Display name" value={a.display_name ?? ""} onChange={(v) => update("display_name", v)} placeholder="Earth Architect" />
              <TextField label="Country (optional)" value={a.country ?? ""} onChange={(v) => update("country", v)} placeholder="India" />
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="How you move" subtitle="Transport is usually the biggest lever.">
              <ChoiceGrid
                label="Primary commute"
                value={a.commute_mode}
                onChange={(v) => update("commute_mode", v)}
                options={[
                  { v: "walk_bike", l: "Walk / Bike" },
                  { v: "public", l: "Public transit" },
                  { v: "ev", l: "EV" },
                  { v: "car_pool", l: "Car (pooled)" },
                  { v: "car_solo", l: "Car (solo)" },
                  { v: "mixed", l: "Mixed" },
                ]}
              />
              <NumberField label="Weekly km travelled" value={a.weekly_km} onChange={(v) => update("weekly_km", v)} step={5} min={0} max={2000} />
              <NumberField label="Flights per year" value={a.flights_per_year} onChange={(v) => update("flights_per_year", v)} min={0} max={50} />
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="What you eat" subtitle="Even small shifts move the needle.">
              <ChoiceGrid
                label="Diet type"
                value={a.diet_type}
                onChange={(v) => update("diet_type", v)}
                options={[
                  { v: "omnivore", l: "Omnivore" },
                  { v: "flexitarian", l: "Flexitarian" },
                  { v: "vegetarian", l: "Vegetarian" },
                  { v: "vegan", l: "Vegan" },
                ]}
              />
              <NumberField label="Meals out / takeaway per week" value={a.meals_out_per_week} onChange={(v) => update("meals_out_per_week", v)} min={0} max={30} />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Your home energy" subtitle="Heating + electricity blend.">
              <NumberField label="Household size" value={a.household_size} onChange={(v) => update("household_size", v)} min={1} max={12} />
              <ChoiceGrid
                label="Primary heating"
                value={a.heating_type}
                onChange={(v) => update("heating_type", v)}
                options={[
                  { v: "gas", l: "Gas" },
                  { v: "electric", l: "Electric" },
                  { v: "heat_pump", l: "Heat pump" },
                  { v: "district", l: "District" },
                  { v: "wood", l: "Wood / biomass" },
                  { v: "none", l: "None" },
                ]}
              />
              <NumberField label="% renewable electricity" value={a.renewable_pct} onChange={(v) => update("renewable_pct", v)} min={0} max={100} step={5} />
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="Lifestyle & shopping" subtitle="The hidden footprint of stuff & screens.">
              <ChoiceGrid
                label="Fast fashion purchases"
                value={a.fast_fashion_freq}
                onChange={(v) => update("fast_fashion_freq", v)}
                options={[
                  { v: "never", l: "Never" },
                  { v: "rare", l: "Few / year" },
                  { v: "monthly", l: "Monthly" },
                  { v: "weekly", l: "Weekly+" },
                ]}
              />
              <NumberField label="Years between phone upgrades" value={a.electronics_upgrade_years} onChange={(v) => update("electronics_upgrade_years", v)} min={1} max={10} />
              <NumberField label="Streaming hours / week" value={a.streaming_hours_per_week} onChange={(v) => update("streaming_hours_per_week", v)} min={0} max={80} />
            </StepShell>
          )}

          <div className="mt-10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || mutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-full glass px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={mutation.isPending}
              className="group inline-flex items-center gap-2 rounded-full gradient-canopy px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step === STEPS.length - 1 ? (
                <>
                  <Sparkles className="h-4 w-4" /> Calibrate my baseline
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can refine any of these later from your profile.
        </p>
      </div>
    </main>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="animate-float-up">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={80}
        className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/60"
      />
    </label>
  );
}

function NumberField({ label, value, onChange, min = 0, max = 1000, step = 1 }: { label: string; value: number | undefined; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/60"
      />
    </label>
  );
}

function ChoiceGrid({ label, value, onChange, options }: { label: string; value: string | undefined; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "border-primary bg-primary/10 text-foreground shadow-glow-sm"
                  : "border-border/60 bg-background/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
