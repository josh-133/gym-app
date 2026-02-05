-- ============================================
-- NUTRITION TRACKING TABLES
-- ============================================
-- Enables users to track daily nutrition (calories, macros)
-- Run this AFTER the previous migrations

-- ============================================
-- NUTRITION GOALS TABLE
-- ============================================
CREATE TABLE public.nutrition_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_calories INTEGER NOT NULL,
  daily_protein_g NUMERIC(6,1) NOT NULL,
  daily_carbs_g NUMERIC(6,1) NOT NULL,
  daily_fat_g NUMERIC(6,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- One goal per user
);

-- Enable RLS
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own nutrition goals"
  ON public.nutrition_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create nutrition goals"
  ON public.nutrition_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals"
  ON public.nutrition_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition goals"
  ON public.nutrition_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_nutrition_goals_updated_at
  BEFORE UPDATE ON public.nutrition_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FOOD ENTRIES TABLE
-- ============================================
CREATE TABLE public.food_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  food_name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  barcode VARCHAR(50),
  open_food_facts_id VARCHAR(100),
  serving_size_g NUMERIC(8,2) NOT NULL,
  servings NUMERIC(6,2) NOT NULL DEFAULT 1,
  calories NUMERIC(8,2) NOT NULL,
  protein_g NUMERIC(8,2) NOT NULL,
  carbs_g NUMERIC(8,2) NOT NULL,
  fat_g NUMERIC(8,2) NOT NULL,
  fiber_g NUMERIC(8,2),
  sugar_g NUMERIC(8,2),
  is_custom BOOLEAN DEFAULT false,
  custom_food_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_food_entries_user ON public.food_entries(user_id);
CREATE INDEX idx_food_entries_user_date ON public.food_entries(user_id, logged_at);
CREATE INDEX idx_food_entries_meal ON public.food_entries(user_id, meal_type, logged_at);

-- Enable RLS
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own food entries"
  ON public.food_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create food entries"
  ON public.food_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food entries"
  ON public.food_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own food entries"
  ON public.food_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CUSTOM FOODS TABLE
-- ============================================
CREATE TABLE public.custom_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  -- Nutrition per 100g
  calories_per_100g NUMERIC(8,2) NOT NULL,
  protein_per_100g NUMERIC(8,2) NOT NULL,
  carbs_per_100g NUMERIC(8,2) NOT NULL,
  fat_per_100g NUMERIC(8,2) NOT NULL,
  fiber_per_100g NUMERIC(8,2),
  sugar_per_100g NUMERIC(8,2),
  -- Default serving
  default_serving_size_g NUMERIC(8,2) DEFAULT 100,
  default_serving_description VARCHAR(100),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_custom_foods_user ON public.custom_foods(user_id);
CREATE INDEX idx_custom_foods_favorite ON public.custom_foods(user_id, is_favorite);

-- Enable RLS
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own custom foods"
  ON public.custom_foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create custom foods"
  ON public.custom_foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom foods"
  ON public.custom_foods FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom foods"
  ON public.custom_foods FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger for custom foods
CREATE TRIGGER update_custom_foods_updated_at
  BEFORE UPDATE ON public.custom_foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key for custom_food_id in food_entries
ALTER TABLE public.food_entries
  ADD CONSTRAINT fk_food_entries_custom_food
  FOREIGN KEY (custom_food_id) REFERENCES public.custom_foods(id) ON DELETE SET NULL;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Nutrition tables created successfully!';
END $$;
