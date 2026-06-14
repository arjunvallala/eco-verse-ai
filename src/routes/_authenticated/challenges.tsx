import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Check, Plus, X, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import {
  listChallenges,
  acceptChallenge,
  completeChallenge,
  abandonChallenge,
} from "@/lib/challenges.functions";

export const Route = createFileRoute("/_authenticated/challenges")({ component: ChallengesPage });

function ChallengesPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listChallenges);
  const accept = useServerFn(acceptChallenge);
  const complete = useServerFn(completeChallenge);
  const abandon = useServerFn(abandonChallenge);
  const data = useQuery({ queryKey: ["challenges"], queryFn: () => fetchAll() });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["challenges"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const acceptM = useMutation({
    mutationFn: (cid: string) => accept({ data: { challenge_id: cid } }),
    onSuccess: () => {
      toast.success("Quest accepted");
      invalidateAll();
    },
  });
  const completeM = useMutation({
    mutationFn: (id: string) => complete({ data: { id } }),
    onSuccess: () => {
      toast.success("Quest complete · XP earned");
      invalidateAll();
    },
  });
  const abandonM = useMutation({
    mutationFn: (id: string) => abandon({ data: { id } }),
    onSuccess: invalidateAll,
  });

  const mine = data.data?.mine ?? [];
  const challenges = data.data?.challenges ?? [];
  const status = (cid: string) => mine.find((m) => m.challenge_id === cid);

  const active = mine.filter((m) => m.status === "active");

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)] opacity-30" />
      <header className="mx-auto max-w-7xl px-6 py-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Daily <span className="text-gradient-canopy">quests</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accept a quest, complete it, earn XP and shrink your footprint.
        </p>
      </header>
      <AppNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        {data.isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Active
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {active.map((uc) => {
                    const c = challenges.find((x) => x.id === uc.challenge_id);
                    if (!c) return null;
                    return (
                      <div
                        key={uc.id}
                        className="rounded-2xl glass-strong p-5 shadow-elevated"
                      >
                        <div className="flex items-start gap-3">
                          <Trophy className="h-5 w-5 text-[var(--canopy-gold)]" />
                          <div className="flex-1">
                            <div className="font-display font-bold">{c.title}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => completeM.mutate(uc.id)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            <Check className="h-3.5 w-3.5" /> Mark done · +{c.xp_reward} XP
                          </button>
                          <button
                            onClick={() => abandonM.mutate(uc.id)}
                            className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" /> Drop
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              All quests
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((c) => {
                const s = status(c.id);
                const done = s?.status === "completed";
                const isActive = s?.status === "active";
                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl glass p-5 transition-colors ${done ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                        {c.category} · {c.difficulty}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        +{c.xp_reward} XP · −{c.co2_savings_kg}kg
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold tracking-tight">
                      {c.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                    <div className="mt-4">
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <Check className="h-3.5 w-3.5" /> Completed
                        </span>
                      ) : isActive ? (
                        <span className="text-xs text-muted-foreground">In progress…</span>
                      ) : (
                        <button
                          onClick={() => acceptM.mutate(c.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                        >
                          <Plus className="h-3.5 w-3.5" /> Accept
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
