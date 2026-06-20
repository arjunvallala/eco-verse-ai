import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const onboardingSchema = z.object({
  display_name: z.string().trim().min(1).max(80).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  commute_mode: z
    .enum(["walk_bike", "public", "car_solo", "car_pool", "ev", "mixed"])
    .optional()
    .nullable(),
  weekly_km: z.coerce.number().min(0).max(5000).optional().nullable(),
  flights_per_year: z.coerce.number().int().min(0).max(200).optional().nullable(),
  diet_type: z.enum(["omnivore", "flexitarian", "vegetarian", "vegan"]).optional().nullable(),
  meals_out_per_week: z.coerce.number().int().min(0).max(50).optional().nullable(),
  household_size: z.coerce.number().int().min(1).max(20).optional().nullable(),
  heating_type: z
    .enum(["gas", "electric", "heat_pump", "district", "wood", "none"])
    .optional()
    .nullable(),
  renewable_pct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  fast_fashion_freq: z.enum(["never", "rare", "monthly", "weekly"]).optional().nullable(),
  electronics_upgrade_years: z.coerce.number().int().min(1).max(20).optional().nullable(),
  streaming_hours_per_week: z.coerce.number().int().min(0).max(168).optional().nullable(),
});

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => onboardingSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Rough baseline calc (kg CO2e / year). Order-of-magnitude only.
    const transport =
      (data.weekly_km ?? 0) * 52 * commuteFactor(data.commute_mode) +
      (data.flights_per_year ?? 0) * 600;
    const diet = dietBaseline(data.diet_type) + (data.meals_out_per_week ?? 0) * 52 * 3;
    const home =
      heatingBaseline(data.heating_type) *
      Math.max(1, data.household_size ?? 1) *
      (1 - (data.renewable_pct ?? 0) / 100);
    const lifestyle =
      fastFashionBaseline(data.fast_fashion_freq) +
      300 / Math.max(1, data.electronics_upgrade_years ?? 4) +
      (data.streaming_hours_per_week ?? 0) * 52 * 0.055;

    const baseline_co2_kg = Math.round(transport + diet + home + lifestyle);

    const { error } = await context.supabase
      .from("profiles")
      .update({ ...data, baseline_co2_kg, onboarding_complete: true })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { baseline_co2_kg };
  });

function commuteFactor(mode?: string | null) {
  switch (mode) {
    case "walk_bike":
      return 0;
    case "public":
      return 0.04;
    case "ev":
      return 0.05;
    case "car_pool":
      return 0.09;
    case "car_solo":
      return 0.19;
    case "mixed":
      return 0.11;
    default:
      return 0.12;
  }
}
function dietBaseline(d?: string | null) {
  switch (d) {
    case "vegan":
      return 1100;
    case "vegetarian":
      return 1700;
    case "flexitarian":
      return 2300;
    case "omnivore":
      return 3300;
    default:
      return 2500;
  }
}
function heatingBaseline(h?: string | null) {
  switch (h) {
    case "heat_pump":
      return 600;
    case "electric":
      return 1400;
    case "district":
      return 900;
    case "wood":
      return 500;
    case "none":
      return 200;
    case "gas":
    default:
      return 1800;
  }
}
function fastFashionBaseline(f?: string | null) {
  switch (f) {
    case "never":
      return 100;
    case "rare":
      return 250;
    case "monthly":
      return 600;
    case "weekly":
      return 1400;
    default:
      return 400;
  }
}
