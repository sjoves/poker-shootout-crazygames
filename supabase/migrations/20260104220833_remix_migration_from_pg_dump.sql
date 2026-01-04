CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: game_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.game_mode AS ENUM (
    'classic_fc',
    'classic_cb',
    'blitz_fc',
    'blitz_cb',
    'ssc'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  clean_username TEXT;
BEGIN
  clean_username := new.raw_user_meta_data ->> 'username';
  
  -- Validate username if provided
  IF clean_username IS NOT NULL THEN
    -- Check length constraints
    IF length(clean_username) > 20 OR length(clean_username) < 2 THEN
      RAISE EXCEPTION 'Invalid username length';
    END IF;
    -- Check format (alphanumeric and underscores only)
    IF clean_username !~ '^[a-zA-Z0-9_]+$' THEN
      RAISE EXCEPTION 'Invalid username format';
    END IF;
  END IF;
  
  INSERT INTO public.profiles (user_id, username)
  VALUES (new.id, clean_username);
  RETURN new;
END;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    category text NOT NULL,
    requirement_type text NOT NULL,
    requirement_value integer DEFAULT 1 NOT NULL,
    reward_type text,
    reward_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    challenge_date date DEFAULT CURRENT_DATE NOT NULL,
    challenge_type text NOT NULL,
    target_value integer NOT NULL,
    current_value integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    reward_claimed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    claim_date date DEFAULT CURRENT_DATE NOT NULL,
    reward_type text NOT NULL,
    reward_value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leaderboard_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    game_mode public.game_mode NOT NULL,
    score integer NOT NULL,
    ssc_level integer,
    hands_played integer DEFAULT 0 NOT NULL,
    best_hand text,
    time_seconds integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    username text,
    avatar_url text,
    highest_ssc_level integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    selected_card_back text DEFAULT 'default'::text,
    selected_theme text DEFAULT 'emerald'::text,
    CONSTRAINT profiles_username_format CHECK (((username IS NULL) OR ((length(username) >= 2) AND (length(username) <= 20) AND (username ~ '^[a-zA-Z0-9_]+$'::text))))
);


--
-- Name: unlockables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unlockables (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    unlock_method text NOT NULL,
    unlock_requirement text,
    preview_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    achievement_id text NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_games integer DEFAULT 0 NOT NULL,
    total_hands integer DEFAULT 0 NOT NULL,
    total_score bigint DEFAULT 0 NOT NULL,
    flushes_made integer DEFAULT 0 NOT NULL,
    straights_made integer DEFAULT 0 NOT NULL,
    full_houses_made integer DEFAULT 0 NOT NULL,
    four_of_kinds_made integer DEFAULT 0 NOT NULL,
    straight_flushes_made integer DEFAULT 0 NOT NULL,
    royal_flushes_made integer DEFAULT 0 NOT NULL,
    highest_score integer DEFAULT 0 NOT NULL,
    fastest_hand_seconds integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_streaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    current_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    last_play_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_unlocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_unlocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    unlockable_id text NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: daily_challenges daily_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_challenges
    ADD CONSTRAINT daily_challenges_pkey PRIMARY KEY (id);


--
-- Name: daily_challenges daily_challenges_user_id_challenge_date_challenge_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_challenges
    ADD CONSTRAINT daily_challenges_user_id_challenge_date_challenge_type_key UNIQUE (user_id, challenge_date, challenge_type);


--
-- Name: daily_rewards daily_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_rewards
    ADD CONSTRAINT daily_rewards_pkey PRIMARY KEY (id);


--
-- Name: daily_rewards daily_rewards_user_id_claim_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_rewards
    ADD CONSTRAINT daily_rewards_user_id_claim_date_key UNIQUE (user_id, claim_date);


--
-- Name: leaderboard_entries leaderboard_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_entries
    ADD CONSTRAINT leaderboard_entries_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: unlockables unlockables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unlockables
    ADD CONSTRAINT unlockables_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_user_id_achievement_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);


--
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (id);


--
-- Name: user_stats user_stats_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_key UNIQUE (user_id);


--
-- Name: user_stats user_stats_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_unique UNIQUE (user_id);


--
-- Name: user_streaks user_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_pkey PRIMARY KEY (id);


--
-- Name: user_streaks user_streaks_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_key UNIQUE (user_id);


--
-- Name: user_streaks user_streaks_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_unique UNIQUE (user_id);


--
-- Name: user_unlocks user_unlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_unlocks
    ADD CONSTRAINT user_unlocks_pkey PRIMARY KEY (id);


--
-- Name: user_unlocks user_unlocks_user_id_unlockable_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_unlocks
    ADD CONSTRAINT user_unlocks_user_id_unlockable_id_key UNIQUE (user_id, unlockable_id);


--
-- Name: idx_leaderboard_mode_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_mode_score ON public.leaderboard_entries USING btree (game_mode, score DESC);


--
-- Name: idx_leaderboard_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_user ON public.leaderboard_entries USING btree (user_id);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_stats update_user_stats_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_streaks update_user_streaks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: daily_challenges daily_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_challenges
    ADD CONSTRAINT daily_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: daily_rewards daily_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_rewards
    ADD CONSTRAINT daily_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: leaderboard_entries leaderboard_entries_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_entries
    ADD CONSTRAINT leaderboard_entries_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: leaderboard_entries leaderboard_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_entries
    ADD CONSTRAINT leaderboard_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_stats user_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_streaks user_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_unlocks user_unlocks_unlockable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_unlocks
    ADD CONSTRAINT user_unlocks_unlockable_id_fkey FOREIGN KEY (unlockable_id) REFERENCES public.unlockables(id) ON DELETE CASCADE;


--
-- Name: user_unlocks user_unlocks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_unlocks
    ADD CONSTRAINT user_unlocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: achievements Anyone can view achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);


--
-- Name: leaderboard_entries Anyone can view leaderboard; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_entries FOR SELECT USING (true);


--
-- Name: profiles Anyone can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: unlockables Anyone can view unlockables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view unlockables" ON public.unlockables FOR SELECT USING (true);


--
-- Name: user_achievements Users can insert own achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: daily_challenges Users can insert own challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own challenges" ON public.daily_challenges FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: daily_rewards Users can insert own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own rewards" ON public.daily_rewards FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: leaderboard_entries Users can insert own scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own scores" ON public.leaderboard_entries FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_stats Users can insert own stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_streaks Users can insert own streaks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own streaks" ON public.user_streaks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_unlocks Users can insert own unlocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own unlocks" ON public.user_unlocks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: daily_challenges Users can update own challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own challenges" ON public.daily_challenges FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_stats Users can update own stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_streaks Users can update own streaks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own streaks" ON public.user_streaks FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_achievements Users can view own achievements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: daily_challenges Users can view own challenges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own challenges" ON public.daily_challenges FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: daily_rewards Users can view own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own rewards" ON public.daily_rewards FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_stats Users can view own stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own stats" ON public.user_stats FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_streaks Users can view own streaks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_unlocks Users can view own unlocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own unlocks" ON public.user_unlocks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_challenges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: leaderboard_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: unlockables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unlockables ENABLE ROW LEVEL SECURITY;

--
-- Name: user_achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

--
-- Name: user_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: user_streaks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_unlocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_unlocks ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;