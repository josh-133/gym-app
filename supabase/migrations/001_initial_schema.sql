-- ============================================
-- GYM APP DATABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Extends Supabase auth.users with profile data

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  unit_system TEXT DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  fitness_goal TEXT CHECK (fitness_goal IN ('build_muscle', 'lose_weight', 'maintain', 'increase_strength', 'improve_endurance')),
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- EXERCISES TABLE
-- ============================================
-- Exercise library (system + user-defined)

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('strength', 'cardio', 'flexibility', 'sport')),
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  instructions TEXT[] DEFAULT '{}',
  video_url TEXT,
  image_url TEXT,
  is_compound BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_exercises_category ON public.exercises(category);
CREATE INDEX idx_exercises_user ON public.exercises(user_id);
CREATE INDEX idx_exercises_muscle_groups ON public.exercises USING GIN(muscle_groups);

-- ============================================
-- WORKOUT TEMPLATES TABLE
-- ============================================

CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  estimated_duration_min INTEGER,
  target_muscle_groups TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_templates_user ON public.workout_templates(user_id);

-- ============================================
-- TEMPLATE EXERCISES TABLE
-- ============================================

CREATE TABLE public.template_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  target_sets INTEGER,
  target_reps TEXT,
  target_weight_kg NUMERIC(6,2),
  target_duration_sec INTEGER,
  rest_sec INTEGER DEFAULT 60,
  notes TEXT
);

CREATE INDEX idx_template_exercises_template ON public.template_exercises(template_id);

-- ============================================
-- WORKOUT SESSIONS TABLE
-- ============================================

CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_sec INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  perceived_exertion INTEGER CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),
  calories_burned INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_user ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_user_date ON public.workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_workout_sessions_status ON public.workout_sessions(status);

-- ============================================
-- EXERCISE LOGS TABLE
-- ============================================

CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercise_logs_session ON public.exercise_logs(session_id);

-- ============================================
-- SETS TABLE
-- ============================================

CREATE TABLE public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_log_id UUID NOT NULL REFERENCES public.exercise_logs(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  set_type TEXT DEFAULT 'working' CHECK (set_type IN ('warmup', 'working', 'dropset', 'failure', 'amrap')),
  reps INTEGER,
  weight_kg NUMERIC(6,2),
  rpe NUMERIC(3,1) CHECK (rpe >= 1 AND rpe <= 10),
  is_pr BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_sets_exercise_log ON public.sets(exercise_log_id);

-- ============================================
-- CARDIO LOGS TABLE
-- ============================================

CREATE TABLE public.cardio_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_log_id UUID NOT NULL REFERENCES public.exercise_logs(id) ON DELETE CASCADE,
  duration_sec INTEGER NOT NULL,
  distance_km NUMERIC(8,3),
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  avg_pace_sec_per_km INTEGER,
  calories_burned INTEGER,
  elevation_gain_m NUMERIC(7,2),
  notes TEXT
);

CREATE INDEX idx_cardio_logs_exercise_log ON public.cardio_logs(exercise_log_id);

-- ============================================
-- PERSONAL RECORDS TABLE
-- ============================================

CREATE TABLE public.personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume', 'max_duration', 'max_distance', 'fastest_pace')),
  value NUMERIC(10,3) NOT NULL,
  unit TEXT NOT NULL,
  set_id UUID REFERENCES public.sets(id) ON DELETE SET NULL,
  cardio_log_id UUID REFERENCES public.cardio_logs(id) ON DELETE SET NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  previous_record NUMERIC(10,3),
  improvement_percent NUMERIC(5,2)
);

CREATE INDEX idx_personal_records_user ON public.personal_records(user_id);
CREATE INDEX idx_personal_records_user_exercise ON public.personal_records(user_id, exercise_id);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('consistency', 'strength', 'endurance', 'milestone', 'social')),
  criteria JSONB NOT NULL,
  points INTEGER DEFAULT 10
);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress NUMERIC(5,2) DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================
-- BODY MEASUREMENTS TABLE
-- ============================================

CREATE TABLE public.body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  weight_kg NUMERIC(5,2),
  body_fat_percent NUMERIC(4,2),
  muscle_mass_kg NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  hips_cm NUMERIC(5,2),
  bicep_cm NUMERIC(5,2),
  thigh_cm NUMERIC(5,2),
  notes TEXT
);

CREATE INDEX idx_body_measurements_user ON public.body_measurements(user_id);
CREATE INDEX idx_body_measurements_user_date ON public.body_measurements(user_id, measured_at DESC);

-- ============================================
-- AI INSIGHTS TABLE
-- ============================================

CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('recommendation', 'analysis', 'warning', 'celebration')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_exercise_id UUID REFERENCES public.exercises(id),
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_insights_user ON public.ai_insights(user_id);
CREATE INDEX idx_ai_insights_user_unread ON public.ai_insights(user_id) WHERE is_read = false AND is_dismissed = false;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Schema created successfully! Now run the RLS policies and seed data.';
END $$;
