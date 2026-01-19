-- ============================================
-- USER GOALS TABLE
-- ============================================
-- Allows users to set personal fitness goals
-- Run this AFTER the previous migrations

CREATE TABLE public.user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight', 'strength', 'cardio', 'workout_frequency', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC(10,2) NOT NULL,
  current_value NUMERIC(10,2) DEFAULT 0,
  unit TEXT NOT NULL, -- 'kg', 'lbs', 'km', 'miles', 'workouts', etc.
  exercise_id TEXT, -- For strength goals, the exercise ID (e.g., 'bench-press')
  deadline DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_user_goals_user ON public.user_goals(user_id);
CREATE INDEX idx_user_goals_user_active ON public.user_goals(user_id) WHERE is_completed = false;

-- Enable RLS
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Users can view their own goals
CREATE POLICY "Users can view own goals"
  ON public.user_goals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own goals
CREATE POLICY "Users can create goals"
  ON public.user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update own goals"
  ON public.user_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own goals
CREATE POLICY "Users can delete own goals"
  ON public.user_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'User goals table created successfully!';
END $$;
