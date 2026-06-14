
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_co2_saved_kg numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_log_date date,
  ADD COLUMN IF NOT EXISTS island_stage integer NOT NULL DEFAULT 1;

-- ============ emission_logs ============
CREATE TABLE public.emission_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('transport','food','energy','shopping','other')),
  activity text NOT NULL,
  co2_kg numeric NOT NULL CHECK (co2_kg >= 0),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emission_logs TO authenticated;
GRANT ALL ON public.emission_logs TO service_role;
ALTER TABLE public.emission_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs select" ON public.emission_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own logs insert" ON public.emission_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own logs update" ON public.emission_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own logs delete" ON public.emission_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX emission_logs_user_time_idx ON public.emission_logs(user_id, occurred_at DESC);

-- ============ challenges (catalog) ============
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('transport','food','energy','shopping','mindful')),
  xp_reward integer NOT NULL DEFAULT 25,
  co2_savings_kg numeric NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO authenticated, anon;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges public read" ON public.challenges FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.challenges (slug, title, description, category, xp_reward, co2_savings_kg, difficulty) VALUES
('meatless-monday','Meatless Monday','Skip meat for one full day this week.','food',30,4,'easy'),
('bike-commute','Bike or walk to work','Replace one car commute with bike or walking.','transport',40,5,'easy'),
('cold-wash','Cold-water laundry','Run your next two loads on cold.','energy',20,2,'easy'),
('no-fast-fashion','Pause fast fashion','Buy nothing new from fast-fashion brands for 30 days.','shopping',80,15,'medium'),
('plant-based-week','Plant-based week','Eat fully plant-based for 7 days.','food',120,25,'hard'),
('public-transit-week','Transit-only week','Use only public transit, bike or walking for a week.','transport',150,30,'hard'),
('unplug-evening','Unplug evening','Power down non-essentials for one evening.','energy',15,1,'easy'),
('mindful-purchase','24h purchase pause','Wait 24h before any non-essential purchase, for a week.','mindful',25,3,'easy');

-- ============ user_challenges ============
CREATE TABLE public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, challenge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_challenges TO authenticated;
GRANT ALL ON public.user_challenges TO service_role;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own uc select" ON public.user_challenges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own uc insert" ON public.user_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own uc update" ON public.user_challenges FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own uc delete" ON public.user_challenges FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ chat_messages ============
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat select" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own chat insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chat delete" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX chat_messages_user_time_idx ON public.chat_messages(user_id, created_at);

-- ============ Streak + XP trigger on emission_logs ============
CREATE OR REPLACE FUNCTION public.handle_emission_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prev date;
  new_streak int;
  new_xp int;
BEGIN
  SELECT last_log_date, streak_days, xp INTO prev, new_streak, new_xp
  FROM public.profiles WHERE id = NEW.user_id FOR UPDATE;

  IF prev IS NULL OR (CURRENT_DATE - prev) > 1 THEN
    new_streak := 1;
  ELSIF (CURRENT_DATE - prev) = 1 THEN
    new_streak := COALESCE(new_streak,0) + 1;
  END IF; -- same day: keep streak

  new_xp := COALESCE(new_xp,0) + 10;

  UPDATE public.profiles
  SET streak_days = new_streak,
      last_log_date = CURRENT_DATE,
      xp = new_xp,
      level = GREATEST(1, 1 + (new_xp / 100)),
      island_stage = LEAST(6, 1 + (new_xp / 200))
  WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_emission_log_insert
AFTER INSERT ON public.emission_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_emission_log();

-- ============ Challenge completion trigger ============
CREATE OR REPLACE FUNCTION public.handle_challenge_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reward_xp int;
  reward_co2 numeric;
  new_xp int;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT xp_reward, co2_savings_kg INTO reward_xp, reward_co2
    FROM public.challenges WHERE id = NEW.challenge_id;

    UPDATE public.profiles
    SET xp = xp + COALESCE(reward_xp,0),
        total_co2_saved_kg = total_co2_saved_kg + COALESCE(reward_co2,0),
        level = GREATEST(1, 1 + ((xp + COALESCE(reward_xp,0)) / 100)),
        island_stage = LEAST(6, 1 + ((xp + COALESCE(reward_xp,0)) / 200))
    WHERE id = NEW.user_id;

    IF NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_user_challenge_complete
BEFORE UPDATE ON public.user_challenges
FOR EACH ROW EXECUTE FUNCTION public.handle_challenge_complete();
