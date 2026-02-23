-- ============================================
-- COMPETITOR FEATURES MIGRATION
-- ============================================
-- Adds all tables and columns for Phases 1-6

-- ============================================
-- PHASE 1: Exercise Notes, Template Folders, Per-Exercise Rest
-- ============================================

-- Persistent exercise notes
CREATE TABLE IF NOT EXISTS public.exercise_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  preferred_rest_sec INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_notes_user ON public.exercise_notes(user_id);

-- Template folders
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS folder TEXT;

-- Per-exercise rest timer in templates
ALTER TABLE public.template_exercises ADD COLUMN IF NOT EXISTS default_rest_sec INTEGER;

-- ============================================
-- PHASE 2: Tempo, Mood/Energy/Sleep
-- ============================================

-- Tempo tracking on sets
ALTER TABLE public.sets ADD COLUMN IF NOT EXISTS tempo TEXT;

-- Mood/Energy/Sleep on workout sessions
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS mood INTEGER CHECK (mood >= 1 AND mood <= 5);
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS energy INTEGER CHECK (energy >= 1 AND energy <= 5);
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5);

-- ============================================
-- PHASE 3: Storage & Media
-- ============================================

-- Workout media (photos/videos)
CREATE TABLE IF NOT EXISTS public.workout_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_media_session ON public.workout_media(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_media_user ON public.workout_media(user_id);

-- Progress photos
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'front' CHECK (category IN ('front', 'side', 'back')),
  notes TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user ON public.progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_date ON public.progress_photos(user_id, taken_at DESC);

-- ============================================
-- PHASE 4: Programs & Scheduling
-- ============================================

-- Training programs
CREATE TABLE IF NOT EXISTS public.training_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  goal TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_programs_user ON public.training_programs(user_id);

-- Program weeks
CREATE TABLE IF NOT EXISTS public.program_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  name TEXT,
  notes TEXT,
  is_deload BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_program_weeks_program ON public.program_weeks(program_id);

-- Program workouts
CREATE TABLE IF NOT EXISTS public.program_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_program_workouts_week ON public.program_workouts(week_id);

-- User active program
CREATE TABLE IF NOT EXISTS public.user_active_program (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_week INTEGER DEFAULT 1,
  current_workout_index INTEGER DEFAULT 0,
  UNIQUE(user_id)
);

-- Scheduled workouts
CREATE TABLE IF NOT EXISTS public.scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  program_workout_id UUID REFERENCES public.program_workouts(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  reminder_at TIMESTAMPTZ,
  completed_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_user ON public.scheduled_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_date ON public.scheduled_workouts(user_id, scheduled_date);

-- ============================================
-- PHASE 5: Social
-- ============================================

-- Profile visibility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT false;

-- Follow relationships
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- Social feed items
CREATE TABLE IF NOT EXISTS public.feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('workout', 'pr', 'achievement', 'photo')),
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_items_user ON public.feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_created ON public.feed_items(created_at DESC);

-- Likes
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feed_item_id UUID NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feed_item_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_feed_item ON public.likes(feed_item_id);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feed_item_id UUID NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_feed_item ON public.comments(feed_item_id);

-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('volume', 'frequency', 'streak', 'distance')),
  target_value NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.challenges(start_date, end_date);

-- Challenge participants
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_value NUMERIC(10,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);

-- ============================================
-- PHASE 6: Push Notifications
-- ============================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Exercise notes
ALTER TABLE public.exercise_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exercise notes"
  ON public.exercise_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Workout media
ALTER TABLE public.workout_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout media"
  ON public.workout_media FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Progress photos
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress photos"
  ON public.progress_photos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Training programs
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own programs"
  ON public.training_programs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public programs"
  ON public.training_programs FOR SELECT
  USING (is_public = true);

-- Program weeks
ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage program weeks"
  ON public.program_weeks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.training_programs WHERE id = program_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.training_programs WHERE id = program_id AND user_id = auth.uid())
  );

-- Program workouts
ALTER TABLE public.program_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage program workouts"
  ON public.program_workouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.program_weeks pw
      JOIN public.training_programs tp ON pw.program_id = tp.id
      WHERE pw.id = week_id AND tp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_weeks pw
      JOIN public.training_programs tp ON pw.program_id = tp.id
      WHERE pw.id = week_id AND tp.user_id = auth.uid()
    )
  );

-- User active program
ALTER TABLE public.user_active_program ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own active program"
  ON public.user_active_program FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scheduled workouts
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scheduled workouts"
  ON public.scheduled_workouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own follows"
  ON public.follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can see who follows them"
  ON public.follows FOR SELECT
  USING (auth.uid() = following_id);

-- Feed items
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feed items"
  ON public.feed_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view followed users feed items"
  ON public.feed_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = user_id)
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_profile_public = true)
  );

-- Likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own likes"
  ON public.likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view likes on accessible feed items"
  ON public.likes FOR SELECT
  USING (true);

-- Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own comments"
  ON public.comments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view comments on accessible feed items"
  ON public.comments FOR SELECT
  USING (true);

-- Challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own challenges"
  ON public.challenges FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view public challenges"
  ON public.challenges FOR SELECT
  USING (is_public = true);

-- Challenge participants
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own participation"
  ON public.challenge_participants FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view challenge participants"
  ON public.challenge_participants FOR SELECT
  USING (true);

-- Device tokens
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device tokens"
  ON public.device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Updated at triggers for new tables
-- ============================================

CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Competitor features migration completed successfully!';
END $$;
