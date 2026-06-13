import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Leaf,
  Flame,
  Trophy,
  Sparkles,
  Bot,
  TreePine,
  Swords,
  BarChart3,
  ArrowRight,
  PlayCircle,
  Globe2,
} from "lucide-react";
import heroImage from "@/assets/hero-canopy.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoVerse AI — Your Planet. Your Score. Your Legacy." },
      {
        name: "description",
        content:
          "The world's first gamified carbon intelligence platform. Track emissions with AI, battle friends, and grow your own living ecosystem.",
      },
      { property: "og:title", content: "EcoVerse AI — Gamified Carbon Intelligence" },
      {
        property: "og:description",
        content:
          "Track emissions. Beat your friends. Heal the planet. The behavioral change engine disguised as the most addictive sustainability game ever made.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AmbientParticles />
      <Nav />
      <Hero />
      <LiveCounterStrip />
      <FeatureGrid />
      <CategoryStrip />
      <GamificationShowcase />
      <CTASection />
      <Footer />
    </div>
  );
}

/* ───────── Navigation ───────── */
function Nav() {
  return (
    <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center gap-2">
        <div className="relative grid h-9 w-9 place-items-center rounded-xl gradient-canopy shadow-glow-sm">
          <Leaf className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="font-display text-xl font-bold tracking-tight">
          Eco<span className="text-gradient-canopy">Verse</span>
        </span>
        <span className="ml-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          AI
        </span>
      </Link>

      <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
        <a href="#features" className="transition-colors hover:text-foreground">Features</a>
        <a href="#gamify" className="transition-colors hover:text-foreground">Gamification</a>
        <a href="#impact" className="transition-colors hover:text-foreground">Impact</a>
        <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
      </nav>

      <div className="flex items-center gap-3">
        <button className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block">
          Sign in
        </button>
        <button className="group relative inline-flex items-center gap-1.5 rounded-full gradient-canopy px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-transform hover:scale-[1.03]">
          Start Free
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </header>
  );
}

/* ───────── Hero ───────── */
function Hero() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-12 md:pb-32 md:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-float-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono uppercase tracking-wider text-muted-foreground">
              Live · Hackathon Preview
            </span>
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Your Planet.
            <br />
            Your Score.
            <br />
            <span className="text-gradient-canopy">Your Legacy.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            The world's first gamified carbon intelligence platform. Track emissions
            with AI. Battle your friends. Grow a living ecosystem that mirrors how
            you treat the planet.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button className="group relative inline-flex items-center gap-2 rounded-full gradient-canopy px-6 py-3 text-base font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]">
              Start For Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-base font-semibold transition-colors hover:border-primary/40">
              <PlayCircle className="h-5 w-5 text-primary" />
              Watch 90-sec demo
            </button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border/50 pt-8">
            <Stat value="48K+" label="trees planted" />
            <Stat value="2.1M kg" label="CO₂ reduced" />
            <Stat value="12" label="college leagues" />
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/30 via-secondary/20 to-transparent blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 shadow-elevated">
            <img
              src={heroImage}
              alt="Glowing Earth floating in a bioluminescent rainforest canopy"
              width={1920}
              height={1280}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <FloatingStatCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-bold text-foreground md:text-3xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function FloatingStatCard() {
  return (
    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl glass-strong p-4 md:left-auto md:right-6 md:w-72">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Your Score
        </div>
        <div className="mt-1 font-mono text-3xl font-bold text-primary">1.42<span className="text-base text-muted-foreground">t CO₂</span></div>
        <div className="mt-0.5 text-xs text-canopy-glow">↓ 18% vs city avg</div>
      </div>
      <div className="relative h-14 w-14">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" className="text-foreground" />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="url(#ring)"
            strokeWidth="3"
            strokeDasharray="72, 100"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.82 0.24 152)" />
              <stop offset="100%" stopColor="oklch(0.78 0.14 188)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center font-mono text-xs font-bold">72%</div>
      </div>
    </div>
  );
}

/* ───────── Live Counter Strip ───────── */
function LiveCounterStrip() {
  const [ppm, setPpm] = useState(422.74);
  useEffect(() => {
    const id = setInterval(() => setPpm((p) => +(p + Math.random() * 0.001).toFixed(4)), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative z-10 border-y border-border/40 bg-card/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-5 text-sm">
        <div className="flex items-center gap-3">
          <Globe2 className="h-5 w-5 text-primary animate-ticker" />
          <span className="font-mono uppercase tracking-wider text-muted-foreground">
            Global CO₂
          </span>
          <span className="font-mono text-lg font-bold tabular-nums text-foreground">
            {ppm.toFixed(4)} <span className="text-muted-foreground text-xs">ppm</span>
          </span>
        </div>
        <Ticker label="India avg" value="1.56 t/yr" />
        <Ticker label="Paris target" value="2.50 t/yr" />
        <Ticker label="Your league" value="#127 / 4,892" accent />
      </div>
    </section>
  );
}

function Ticker({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

/* ───────── Feature Grid ───────── */
function FeatureGrid() {
  const features = [
    {
      icon: Bot,
      title: "EcoAI Coach",
      desc: "A memory-enabled AI that knows your habits. Asks follow-ups. Negotiates realistic goals. Never preachy.",
      tag: "Gemini Multimodal",
    },
    {
      icon: BarChart3,
      title: "Predictive Engine",
      desc: "30-day & 12-month CO₂ forecasts. Scenario modeling: 'switch to EV → save 0.8t/yr & ₹12K fuel.'",
      tag: "ML-powered",
    },
    {
      icon: Sparkles,
      title: "Image & Receipt OCR",
      desc: "Photograph a meal or scan an electricity bill. We extract, score, log, and award XP automatically.",
      tag: "Gemini Vision",
    },
    {
      icon: TreePine,
      title: "Living Island",
      desc: "Your behavior grows a 3D ecosystem — from barren shore to glowing bioluminescent Eden.",
      tag: "Flagship",
    },
    {
      icon: Swords,
      title: "Carbon Battles",
      desc: "1v1, team, college, and city leagues. Real-time leaderboards. Loser plants a tree for the winner.",
      tag: "Realtime",
    },
    {
      icon: Trophy,
      title: "40+ Achievements",
      desc: "Streaks, badges, hidden quests, level-up ceremonies. The dopamine loop, but for the planet.",
      tag: "Gamified",
    },
  ];

  return (
    <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
      <SectionHeader
        eyebrow="The platform"
        title="Not a calculator. A behavioral change engine."
        subtitle="Most carbon apps ask you to input numbers. EcoVerse watches, learns, predicts, and rewards — turning sustainability into the most addictive game you've ever played."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <article
            key={f.title}
            style={{ animationDelay: `${i * 60}ms` }}
            className="group relative animate-float-up rounded-2xl glass p-6 transition-all hover:border-primary/40 hover:shadow-glow-sm"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="rounded-full bg-secondary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-secondary">
                {f.tag}
              </span>
            </div>
            <h3 className="font-display text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</div>
      <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">{subtitle}</p>
    </div>
  );
}

/* ───────── Category Strip ───────── */
function CategoryStrip() {
  const cats = [
    { e: "🚗", l: "Transport" }, { e: "⚡", l: "Electricity" }, { e: "🍔", l: "Food" },
    { e: "🛍", l: "Shopping" }, { e: "🗑", l: "Waste" }, { e: "🚿", l: "Water" },
    { e: "✈️", l: "Flights" }, { e: "💻", l: "Digital" }, { e: "👗", l: "Fashion" },
    { e: "📦", l: "Deliveries" }, { e: "🏠", l: "Home" }, { e: "🐄", l: "Diet" },
  ];
  return (
    <section id="impact" className="relative z-10 border-y border-border/40 bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <h3 className="font-display text-lg font-semibold">12 emission categories tracked</h3>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            including the hidden ones
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
          {cats.map((c) => (
            <div
              key={c.l}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-background/40 py-4 transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="text-2xl transition-transform group-hover:scale-110">{c.e}</span>
              <span className="text-[11px] font-medium text-muted-foreground">{c.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Gamification Showcase ───────── */
function GamificationShowcase() {
  return (
    <section id="gamify" className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary">The loop</div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Duolingo × Clash of Clans × Fitbit — <span className="text-gradient-canopy">for the planet.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Streaks. Levels. Guild wars. A living island that thrives when you make good
            choices and wilts when you don't. Real social accountability — the only kind that makes habits stick.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { icon: Flame, t: "30-day streak system", d: "Green → Blue → Purple flames. Shields protect lapses." },
              { icon: Swords, t: "Live carbon battles", d: "1v1, teams, colleges, and city-vs-city leagues." },
              { icon: TreePine, t: "Your living island", d: "5 evolution stages from barren shore to legendary Eden." },
            ].map((item) => (
              <li key={item.t} className="flex gap-4 rounded-xl glass p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{item.t}</div>
                  <div className="text-sm text-muted-foreground">{item.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Mock dashboard card */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-primary/20 via-secondary/15 to-transparent blur-3xl" />
          <div className="relative rounded-2xl glass-strong p-6 shadow-elevated">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full gradient-canopy font-mono text-sm font-bold text-primary-foreground">
                  14
                </div>
                <div>
                  <div className="text-sm font-semibold">Climate Guardian</div>
                  <div className="font-mono text-xs text-muted-foreground">Level 14 · 3,420 XP</div>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-canopy-amber/15 px-3 py-1 text-sm font-bold text-canopy-amber">
                <Flame className="h-4 w-4" /> 27
              </div>
            </div>

            {/* XP bar */}
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>XP to Level 15</span>
                <span>3,420 / 3,500</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[97%] gradient-canopy shadow-glow-sm" />
              </div>
            </div>

            {/* Weekly challenges */}
            <div className="mt-6 space-y-2">
              {[
                { t: "Skip one meat meal", xp: 50, done: true },
                { t: "Public transport all day", xp: 100, done: true },
                { t: "Zero delivery orders this week", xp: 200, done: false },
              ].map((c) => (
                <div
                  key={c.t}
                  className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                    c.done ? "border-primary/30 bg-primary/5" : "border-border bg-background/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                        c.done ? "gradient-canopy text-primary-foreground" : "border border-border"
                      }`}
                    >
                      {c.done && "✓"}
                    </div>
                    <span className={c.done ? "line-through text-muted-foreground" : ""}>{c.t}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-canopy-gold">+{c.xp} XP</span>
                </div>
              ))}
            </div>

            {/* Live battle */}
            <div className="mt-6 rounded-xl border border-secondary/30 bg-secondary/5 p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-mono uppercase tracking-wider text-secondary">Live Battle · 3d left</span>
                <span className="font-mono text-muted-foreground">You vs Ravi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-mono text-lg font-bold text-primary">8.2 kg</div>
                  <div className="text-[11px] text-muted-foreground">your week</div>
                </div>
                <div className="font-display text-xl font-bold text-muted-foreground">vs</div>
                <div className="flex-1 text-right">
                  <div className="font-mono text-lg font-bold">11.4 kg</div>
                  <div className="text-[11px] text-muted-foreground">opponent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── CTA ───────── */
function CTASection() {
  return (
    <section id="pricing" className="relative z-10 mx-auto max-w-5xl px-6 py-24 md:py-32">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-10 text-center shadow-elevated md:p-16">
        <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)]" />
        <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
          Your move, <span className="text-gradient-canopy">Earth Architect.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Free forever for individuals. Pro at ₹99/mo. Team plans for colleges & companies.
          Join 4,800+ players already battling for the planet.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <button className="group inline-flex items-center gap-2 rounded-full gradient-canopy px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]">
            Claim your island
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="rounded-full glass px-7 py-3.5 text-base font-semibold transition-colors hover:border-primary/40">
            See Pro features
          </button>
        </div>
      </div>
    </section>
  );
}

/* ───────── Footer ───────── */
function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-foreground">EcoVerse AI</span>
          <span className="text-xs">· Built for the planet. Designed to win.</span>
        </div>
        <div className="font-mono text-xs uppercase tracking-wider">v0.1 · hackathon edition</div>
      </div>
    </footer>
  );
}

/* ───────── Ambient particles ───────── */
function AmbientParticles() {
  const dots = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {dots.map((_, i) => {
        const left = (i * 53) % 100;
        const top = (i * 37) % 100;
        const delay = (i % 6) * 0.6;
        const size = 2 + (i % 4);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-primary/60 blur-[1px] animate-drift"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              animationDelay: `${delay}s`,
              opacity: 0.35 + ((i % 5) * 0.1),
            }}
          />
        );
      })}
    </div>
  );
}
