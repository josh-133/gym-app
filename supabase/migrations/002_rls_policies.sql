-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Run this AFTER 001_initial_schema.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- EXERCISES POLICIES
-- ============================================

-- Everyone can view system exercises
CREATE POLICY "Everyone can view system exercises"
  ON public.exercises FOR SELECT
  USING (is_system = true);

-- Users can view their own custom exercises
CREATE POLICY "Users can view own exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own exercises
CREATE POLICY "Users can create exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Users can update their own exercises
CREATE POLICY "Users can update own exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false)
  WITH CHECK (auth.uid() = user_id AND is_system = false);

-- Users can delete their own exercises
CREATE POLICY "Users can delete own exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- ============================================
-- WORKOUT TEMPLATES POLICIES
-- ============================================

-- Users can view their own templates
CREATE POLICY "Users can view own templates"
  ON public.workout_templates FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public templates
CREATE POLICY "Users can view public templates"
  ON public.workout_templates FOR SELECT
  USING (is_public = true);

-- Users can create templates
CREATE POLICY "Users can create templates"
  ON public.workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own templates
CREATE POLICY "Users can update own templates"
  ON public.workout_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own templates
CREATE POLICY "Users can delete own templates"
  ON public.workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TEMPLATE EXERCISES POLICIES
-- ============================================

-- Users can view template exercises for their templates
CREATE POLICY "Users can view own template exercises"
  ON public.template_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates
      WHERE id = template_id AND (user_id = auth.uid() OR is_public = true)
    )
  );

-- Users can manage template exercises for their templates
CREATE POLICY "Users can insert template exercises"
  ON public.template_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_templates
      WHERE id = template_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update template exercises"
  ON public.template_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates
      WHERE id = template_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete template exercises"
  ON public.template_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_templates
      WHERE id = template_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- WORKOUT SESSIONS POLICIES
-- ============================================

-- Users can view their own workout sessions
CREATE POLICY "Users can view own workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create workout sessions
CREATE POLICY "Users can create workout sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own workout sessions
CREATE POLICY "Users can update own workout sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own workout sessions
CREATE POLICY "Users can delete own workout sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- EXERCISE LOGS POLICIES
-- ============================================

-- Users can view exercise logs for their workout sessions
CREATE POLICY "Users can view own exercise logs"
  ON public.exercise_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can manage exercise logs for their workout sessions
CREATE POLICY "Users can insert exercise logs"
  ON public.exercise_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercise logs"
  ON public.exercise_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercise logs"
  ON public.exercise_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- SETS POLICIES
-- ============================================

-- Users can view sets for their exercise logs
CREATE POLICY "Users can view own sets"
  ON public.sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_logs el
      JOIN public.workout_sessions ws ON el.session_id = ws.id
      WHERE el.id = exercise_log_id AND ws.user_id = auth.uid()
    )
  );

-- Users can manage sets for their exercise logs
CREATE POLICY "Users can insert sets"
  ON public.sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exercise_logs el
      JOIN public.workout_sessions ws ON el.session_id = ws.id
      WHERE el.id = exercise_log_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sets"
  ON public.sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_logs el
      JOIN public.workout_sessions ws ON el.session_id = ws.id
      WHERE el.id = exercise_log_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sets"
  ON public.sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_logs el
      JOIN public.workout_sessions ws ON el.session_id = ws.id
      WHERE el.id = exercise_log_id AND ws.user_id = auth.uid()
    )
  );

-- ============================================
-- CARDIO LOGS POLICIES
-- ============================================

CREATE POLICY "Users can view own cardio logs"
  ON public.cardio_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_logs el
      JOIN public.workout_sessions ws ON el.session_id = ws.id
      WHERE el.id = exercise_log_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cardio logs"
  ON public.cardio_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exercise_logs el
      JOIN public.workout_sessions ws ON el.session_id = ws.id
      WHERE el.id = exercise_log_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cardio logs"
  ON public.cardio_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_logs el
      JOIN public.workout_sessions ws ON el.session_id = ws.id
      WHERE el.id = exercise_log_id AND ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cardio logs"
  ON public.cardio_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exercise_logs el
      JOIN public.workout_sessions ws ON el.session_id = ws.id
      WHERE el.id = exercise_log_id AND ws.user_id = auth.uid()
    )
  );

-- ============================================
-- PERSONAL RECORDS POLICIES
-- ============================================

CREATE POLICY "Users can view own personal records"
  ON public.personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert personal records"
  ON public.personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personal records"
  ON public.personal_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personal records"
  ON public.personal_records FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ACHIEVEMENTS POLICIES
-- ============================================

-- Everyone can view achievements (they're global)
CREATE POLICY "Everyone can view achievements"
  ON public.achievements FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- USER ACHIEVEMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- BODY MEASUREMENTS POLICIES
-- ============================================

CREATE POLICY "Users can view own body measurements"
  ON public.body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert body measurements"
  ON public.body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body measurements"
  ON public.body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body measurements"
  ON public.body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AI INSIGHTS POLICIES
-- ============================================

CREATE POLICY "Users can view own ai insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ai insights"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai insights"
  ON public.ai_insights FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully! Now run the seed data.';
END $$;
