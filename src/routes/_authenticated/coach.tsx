import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Trash2, Leaf, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/app-nav";
import { listChatHistory, sendCoachMessage, clearChatHistory } from "@/lib/coach.functions";
import { checkAiConfig } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/_authenticated/coach")({ component: CoachPage });

function CoachPage() {
  const qc = useQueryClient();
  const fetchHistory = useServerFn(listChatHistory);
  const send = useServerFn(sendCoachMessage);
  const clear = useServerFn(clearChatHistory);
  const checkConfig = useServerFn(checkAiConfig);

  const history = useQuery({ queryKey: ["coach"], queryFn: () => fetchHistory() });
  const configQuery = useQuery({ queryKey: ["aiConfig"], queryFn: () => checkConfig() });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [apiKeyError, setApiKeyError] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.data]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const mutation = useMutation({
    mutationFn: (text: string) => send({ data: { content: text } }),
    onMutate: (text) => {
      // optimistic
      qc.setQueryData(["coach"], (old: unknown[] | undefined) => [
        ...(old ?? []),
        { id: "temp", role: "user", content: text, created_at: new Date().toISOString() },
      ]);
      setInput("");
      setApiKeyError(false);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach"] });
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Missing LOVABLE_API_KEY") || msg.includes("LOVABLE_API_KEY")) {
        setApiKeyError(true);
      }
      toast.error(e instanceof Error ? e.message : "Couldn't reach EcoAI");
      qc.invalidateQueries({ queryKey: ["coach"] });
    },
  });

  const clearM = useMutation({
    mutationFn: () => clear(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach"] }),
  });

  const msgs = history.data ?? [];

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)] opacity-30" />
      <header className="mx-auto w-full max-w-3xl px-6 py-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          <span className="text-gradient-canopy">EcoAI</span> coach
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask anything — diet swaps, commute tweaks, your footprint. Grounded in your profile.
        </p>
      </header>
      <AppNav />

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-6">
        <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl glass-strong p-6 shadow-elevated">
          {/* Lovable API Key info banner */}
          {configQuery.data?.hasKey ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3 text-sm leading-relaxed text-emerald-200/90">
              <Leaf className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5 animate-pulse" />
              <div>
                <p className="font-semibold text-base mb-1">Live Mode Enabled</p>
                EcoAI is running in live mode powered by{" "}
                {configQuery.data.keyType === "lovable" ? "Lovable AI Gateway" : "Google Gemini"}.
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 text-sm leading-relaxed text-amber-200/90">
              <Info className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-base mb-1">Demo Mode Enabled</p>
                No API key detected in <code>.env</code>. EcoAI is running in simulated response
                mode. Add a <code>LOVABLE_API_KEY</code> or <code>GEMINI_API_KEY</code> to enable
                live Gemini Coach conversations.
              </div>
            </div>
          )}

          {msgs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Leaf className="h-8 w-8 text-primary" />
              <p className="font-display text-lg">Hi, I'm EcoAI.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Try: "What's the easiest way to cut my commute footprint?" or "Suggest a meal plan
                for this week."
              </p>
            </div>
          )}
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/40 bg-background/40 text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border/40 bg-background/40 px-4 py-2.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> EcoAI is thinking…
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = input.trim();
            if (!v || mutation.isPending) return;
            mutation.mutate(v);
          }}
          className="mt-4 flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const v = input.trim();
                if (v && !mutation.isPending) mutation.mutate(v);
              }
            }}
            placeholder="Ask EcoAI…"
            className="flex-1 resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={mutation.isPending || !input.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
          {msgs.length > 0 && (
            <button
              type="button"
              onClick={() => clearM.mutate()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full glass text-muted-foreground hover:text-destructive"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
