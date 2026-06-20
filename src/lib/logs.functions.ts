import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const logSchema = z.object({
  category: z.enum(["transport", "food", "energy", "shopping", "other"]),
  activity: z.string().trim().min(1).max(120),
  co2_kg: z.coerce.number().min(0).max(10000),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const createLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => logSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("emission_logs")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("emission_logs")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("emission_logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const analyzeFoodPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageBase64: string; mimeType: string }) =>
    z
      .object({
        imageBase64: z.string().min(1),
        mimeType: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const hasKey =
      process.env.LOVABLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!hasKey) {
      console.warn("No API keys detected. Falling back to mock food analysis.");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mocks = [
        {
          activity: "Plant-based Buddha Bowl (Mock)",
          co2_kg: 0.9,
          notes:
            "Plant-based diets have the lowest emission rates. Ingredients like quinoa, spinach, and chickpeas require minimal carbon footprint to cultivate.",
        },
        {
          activity: "Gourmet Beef Burger & Fries (Mock)",
          co2_kg: 7.2,
          notes:
            "Red meat, especially beef, has a very high carbon intensity due to land use, methane emissions, and feed production. Opting for poultry or veggie patties reduces footprint by up to 80%.",
        },
        {
          activity: "Paneer Butter Masala with Roti (Mock)",
          co2_kg: 2.8,
          notes:
            "Dairy-based meals have a moderate footprint. While lower than red meat, dairy production still carries notable carbon costs. Try plant-based milks to reduce impact.",
        },
      ];
      const index = data.imageBase64.length % mocks.length;
      return mocks[index];
    }

    let base64Part = data.imageBase64;
    let mime = data.mimeType;
    if (base64Part.startsWith("data:")) {
      const match = base64Part.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mime = match[1];
        base64Part = match[2];
      }
    }

    const { getAiModel } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const model = getAiModel();

    try {
      const result = await generateText({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'Analyze this food photo. Estimate its carbon footprint (in kg CO2 equivalent) based on standard ecological impact databases. Identify the meal/ingredients, provide a short, friendly explanation of why the score is what it is (mention if it\'s high impact like beef/dairy, or low impact like local plants, and maybe a tip to reduce it). You MUST respond ONLY with a JSON object in this format: { "activity": "Name of the meal / main items (e.g. Avocado Toast with Egg)", "co2_kg": 1.2, "notes": "Brief explanation of the carbon footprint estimate." }',
              },
              {
                type: "image",
                image: base64Part,
                mediaType: mime,
              },
            ],
          },
        ],
      });

      const text = result.text.trim();
      const cleanJsonText = text
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();
      const parsed = JSON.parse(cleanJsonText) as {
        activity: string;
        co2_kg: number;
        notes: string;
      };

      if (!parsed.activity || typeof parsed.co2_kg !== "number") {
        throw new Error("Invalid response structure from AI model");
      }

      return parsed;
    } catch (err: unknown) {
      console.error("Error analyzing food photo:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/402/.test(msg)) throw new Error("AI credits exhausted. Add credits in your workspace.");
      if (/429/.test(msg)) throw new Error("Rate limit reached. Try again in a moment.");
      if (msg.includes("Missing LOVABLE_API_KEY")) throw err;
      throw new Error(
        "Failed to analyze the food photo. Please make sure the image is clear and try again.",
      );
    }
  });
