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
    const hasKey =
      process.env.LOVABLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!hasKey) {
      console.warn("No API keys detected. Falling back to mock coach message.");
      await context.supabase
        .from("chat_messages")
        .insert({ user_id: context.userId, role: "user", content: data.content });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const coachReplies = [
        "That's a great question! For a sustainable lifestyle, try making small changes: swapping incandescent bulbs for LEDs, washing laundry in cold water, or walking/biking for short trips.",
        "To reduce food-related emissions, the most effective step is reducing meat and dairy consumption. Doing 'Meatless Mondays' can save about 150kg of CO2 per year!",
        "Commuting is a major contributor to individual footprints. If public transit or biking is available for just 2 days a week, it can cut your transport footprint by over 30%!",
        "Every small habit adds up. Your streak on EcoVerse represents real consistency—keep tracking and earning XP to grow your living island!",
      ];

      let replyText = "";
      const lower = data.content.toLowerCase();
      if (lower.includes("recipe") || lower.includes("alternative") || lower.includes("swap")) {
        replyText = `Here is a delicious, low-carbon alternative for your meal!
        
**Recipe: Plant-Based Portobello Mushroom & Black Bean Burger**
* **Estimated Carbon Footprint:** ~0.8 kg CO₂e (an 88% reduction!)
* **Ingredients:** Portobello mushrooms, black beans, onion, oats, garlic, olive oil, whole wheat bun, lettuce, tomato.
* **Instructions:**
  1. Roast or grill the seasoned Portobello mushroom cap.
  2. Mash black beans with minced garlic, onions, and ground oats to form a patty; pan-sear until crispy.
  3. Toast the whole wheat bun and assemble with fresh lettuce and tomato slices.
* **Eco Tip:** Choosing local organic mushrooms saves transportation energy!`;
      } else {
        replyText = coachReplies[Math.floor(Math.random() * coachReplies.length)];
      }

      const reply = `${replyText}\n\n(Demo Mode: Set LOVABLE_API_KEY or GEMINI_API_KEY in your .env file to enable real Gemini Coach conversations.)`;

      await context.supabase
        .from("chat_messages")
        .insert({ user_id: context.userId, role: "assistant", content: reply });

      return { content: reply };
    }

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

    const { getAiModel } = await import("./ai-gateway.server");
    const model = getAiModel();

    let assistantText = "";
    try {
      const result = await generateText({
        model,
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
