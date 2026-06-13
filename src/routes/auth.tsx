import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Leaf, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

const credsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in, jump straight to the app
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Welcome to EcoVerse — let's calibrate your island.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Welcome back, Earth Architect.");
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-radial-glow)] opacity-60" />
      <div className="absolute inset-0 -z-10 bg-[var(--gradient-aurora)] opacity-30" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight">EcoVerse AI</span>
        </Link>

        <div className="w-full rounded-3xl glass-strong p-8 shadow-elevated">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {mode === "signup" ? "Claim your island" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Sign up to start your gamified carbon journey."
              : "Sign in to keep your streak alive."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field icon={<Mail className="h-4 w-4" />} label="Email">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                placeholder="you@earth.io"
              />
            </Field>
            <Field icon={<Lock className="h-4 w-4" />} label="Password">
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                placeholder={mode === "signup" ? "Min 8 characters" : "Your password"}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-canopy px-6 py-3 text-base font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "signup" ? "Create account" : "Sign in"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already with us?" : "New to EcoVerse?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Your data · Your planet · Your rules
        </p>
      </div>
    </main>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 backdrop-blur-sm transition-colors focus-within:border-primary/60">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}
