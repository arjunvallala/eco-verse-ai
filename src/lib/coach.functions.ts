import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const clearChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { content: string }) =>
    z.object({ content: z.string().trim().min(1).max(2000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // Persist user message
    await context.supabase
      .from("chat_messages")
      .insert({ user_id: context.userId, role: "user", content: data.content });

    // Load profile + recent history for grounding
    const [profileRes, historyRes, recentLogsRes] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase
        .from("chat_messages")
        .select("role,content")
        .order("created_at", { ascending: true })
        .limit(20),
      context.supabase
        .from("emission_logs")
        .select("category,activity,co2_kg,occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(10),
    ]);

    const p = profileRes.data;
    const recentLogs = (recentLogsRes.data ?? [])
      .map((l) => `- ${l.category} · ${l.activity} · ${l.co2_kg}kg`)
      .join("\n");

    const system = [
      "You are EcoAI, a warm, pragmatic personal climate coach inside EcoVerse AI.",
      "Be concise (2–4 short paragraphs max). Use plain language. Offer one concrete next step.",
      "Avoid guilt; celebrate progress. Numbers are estimates — be honest about uncertainty.",
      "",
      p
        ? `User profile: name=${p.display_name ?? "friend"}, diet=${p.diet_type ?? "?"}, commute=${p.commute_mode ?? "?"}, heating=${p.heating_type ?? "?"}, baseline≈${p.baseline_co2_kg ?? "?"} kg/yr, level=${p.level}, streak=${p.streak_days}d, saved=${p.total_co2_saved_kg}kg.`
        : "",
      recentLogs ? `Recent logs:\n${recentLogs}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    let assistantText = "";
    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        messages: (historyRes.data ?? []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });
      assistantText = result.text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/402/.test(msg)) throw new Error("AI credits exhausted. Add credits in your workspace.");
      if (/429/.test(msg)) throw new Error("Rate limit reached. Try again in a moment.");
      throw new Error("EcoAI couldn't respond. Please try again.");
    }

    await context.supabase
      .from("chat_messages")
      .insert({ user_id: context.userId, role: "assistant", content: assistantText });

    return { content: assistantText };
  });
