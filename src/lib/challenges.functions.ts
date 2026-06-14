import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listChallenges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [challengesRes, mineRes] = await Promise.all([
      context.supabase.from("challenges").select("*").order("xp_reward"),
      context.supabase.from("user_challenges").select("*").eq("user_id", context.userId),
    ]);
    if (challengesRes.error) throw new Error(challengesRes.error.message);
    if (mineRes.error) throw new Error(mineRes.error.message);
    return { challenges: challengesRes.data ?? [], mine: mineRes.data ?? [] };
  });

export const acceptChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { challenge_id: string }) =>
    z.object({ challenge_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_challenges")
      .upsert(
        { user_id: context.userId, challenge_id: data.challenge_id, status: "active" },
        { onConflict: "user_id,challenge_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_challenges")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const abandonChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_challenges")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
