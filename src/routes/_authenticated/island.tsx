import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, TreePine, Flame, Trophy } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { getMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/island")({ component: IslandPage });

const STAGE_NAMES = ["Seed", "Sprout", "Sapling", "Grove", "Canopy", "Old-growth"];

function IslandPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const p = profile.data;
  const stage = Math.min(6, Math.max(1, p?.island_stage ?? 1));
  const xp = p?.xp ?? 0;
  const toNext = (Math.floor(xp / 200) + 1) * 200;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)] opacity-40" />
      <header className="mx-auto max-w-7xl px-6 py-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Your living <span className="text-gradient-canopy">island</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A world that grows as you do. Stage{" "}
          <span className="text-foreground">{stage} · {STAGE_NAMES[stage - 1]}</span>.
        </p>
      </header>
      <AppNav />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-2 shadow-elevated">
          <IslandScene stage={stage} />
        </div>

        <div className="space-y-4">
          <Stat icon={<Sparkles className="h-4 w-4" />} label="XP" value={`${xp} / ${toNext}`} />
          <Stat icon={<Trophy className="h-4 w-4" />} label="Level" value={`${p?.level ?? 1}`} />
          <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${p?.streak_days ?? 0}d`} />
          <Stat
            icon={<TreePine className="h-4 w-4" />}
            label="CO₂ saved"
            value={`${Number(p?.total_co2_saved_kg ?? 0).toLocaleString()} kg`}
          />

          <div className="rounded-2xl glass p-5">
            <h3 className="font-display font-bold">Stages</h3>
            <ol className="mt-3 space-y-1.5 text-sm">
              {STAGE_NAMES.map((n, i) => (
                <li
                  key={n}
                  className={`flex items-center gap-2 ${
                    i + 1 === stage
                      ? "text-primary"
                      : i + 1 < stage
                      ? "text-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="font-mono text-xs">{i + 1}</span>
                  {n}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl glass-strong p-4 shadow-elevated">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="font-display text-lg font-bold">{value}</div>
      </div>
    </div>
  );
}

function IslandScene({ stage }: { stage: number }) {
  // SVG scene — tree count and biodiversity scale with stage
  const trees = Array.from({ length: stage * 3 }).map((_, i) => ({
    x: 60 + ((i * 53) % 540),
    y: 230 + ((i * 31) % 60),
    h: 30 + ((i * 7) % 30) + stage * 4,
    hue: 140 + ((i * 17) % 40),
  }));
  const fireflies = stage >= 4 ? Array.from({ length: stage * 4 }) : [];

  return (
    <svg
      viewBox="0 0 700 360"
      className="block h-full w-full rounded-2xl"
      style={{ background: "linear-gradient(180deg, #06241c 0%, #0a3a2b 60%, #0a4636 100%)" }}
    >
      <defs>
        <radialGradient id="sun" cx="50%" cy="20%" r="45%">
          <stop offset="0%" stopColor="oklch(0.95 0.18 145)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="oklch(0.16 0.018 155)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="water" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0d5247" />
          <stop offset="100%" stopColor="#062a25" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="700" height="360" fill="url(#sun)" />

      {/* water */}
      <ellipse cx="350" cy="320" rx="380" ry="50" fill="url(#water)" />

      {/* island base */}
      <ellipse cx="350" cy="280" rx="300" ry="50" fill="#0a3a2b" />
      <ellipse cx="350" cy="270" rx="280" ry="40" fill="#10573f" />
      <ellipse cx="350" cy="262" rx="250" ry="32" fill="#137a52" opacity="0.85" />

      {/* trees */}
      {trees.map((t, i) => (
        <g key={i} transform={`translate(${t.x},${t.y})`}>
          <rect x="-3" y="0" width="6" height={t.h * 0.4} fill="#3a2618" />
          <circle cx="0" cy="-2" r={t.h * 0.5} fill={`oklch(0.55 0.18 ${t.hue})`} opacity="0.95" />
          <circle cx="-10" cy="6" r={t.h * 0.4} fill={`oklch(0.5 0.18 ${t.hue + 10})`} opacity="0.85" />
          <circle cx="10" cy="4" r={t.h * 0.42} fill={`oklch(0.6 0.2 ${t.hue - 10})`} opacity="0.9" />
        </g>
      ))}

      {/* a glowing centerpiece tree at stage >= 3 */}
      {stage >= 3 && (
        <g transform="translate(350,240)">
          <rect x="-6" y="0" width="12" height="40" fill="#2a1b10" />
          <circle r="48" fill="oklch(0.72 0.22 152)" opacity="0.95">
            <animate attributeName="r" values="46;52;46" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* fireflies */}
      {fireflies.map((_, i) => {
        const cx = 100 + ((i * 47) % 500);
        const cy = 120 + ((i * 31) % 140);
        return (
          <circle key={i} cx={cx} cy={cy} r="2.2" fill="oklch(0.92 0.2 150)">
            <animate
              attributeName="opacity"
              values="0.2;1;0.2"
              dur={`${2 + (i % 3)}s`}
              repeatCount="indefinite"
              begin={`${i * 0.2}s`}
            />
          </circle>
        );
      })}

      {/* moon at peak stages */}
      {stage >= 5 && (
        <circle cx="600" cy="60" r="22" fill="oklch(0.95 0.05 90)" opacity="0.85" />
      )}
    </svg>
  );
}
