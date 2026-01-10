// Database types for Gym App

export type UnitSystem = 'metric' | 'imperial'
export type FitnessGoal = 'build_muscle' | 'lose_weight' | 'maintain' | 'increase_strength' | 'improve_endurance'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'sport'
export type SetType = 'warmup' | 'working' | 'dropset' | 'failure' | 'amrap'
export type WorkoutStatus = 'in_progress' | 'completed' | 'cancelled'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type RecordType = 'max_weight' | 'max_reps' | 'max_volume' | 'max_duration' | 'max_distance' | 'fastest_pace'
export type InsightType = 'recommendation' | 'analysis' | 'warning' | 'celebration'
export type AchievementCategory = 'consistency' | 'strength' | 'endurance' | 'milestone' | 'social'

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'traps'
  | 'lats'
  | 'lower_back'
  | 'hip_flexors'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'resistance_band'
  | 'bench'
  | 'pull_up_bar'
  | 'dip_bars'
  | 'treadmill'
  | 'bike'
  | 'rower'
  | 'elliptical'
  | 'jump_rope'
  | 'medicine_ball'
  | 'foam_roller'
  | 'mat'

// Profile extending Supabase auth.users
export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  date_of_birth: string | null
  gender: Gender | null
  height_cm: number | null
  weight_kg: number | null
  unit_system: UnitSystem
  fitness_goal: FitnessGoal | null
  experience_level: ExperienceLevel | null
  created_at: string
  updated_at: string
}

// Exercise library
export interface Exercise {
  id: string
  user_id: string | null
  name: string
  description: string | null
  category: ExerciseCategory
  muscle_groups: MuscleGroup[]
  equipment: Equipment[]
  difficulty: ExperienceLevel | null
  instructions: string[]
  video_url: string | null
  image_url: string | null
  is_compound: boolean
  is_system: boolean
  created_at: string
}

// Workout templates
export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  estimated_duration_min: number | null
  target_muscle_groups: MuscleGroup[]
  difficulty: ExperienceLevel | null
  is_public: boolean
  created_at: string
  updated_at: string
}

// Template exercises
export interface TemplateExercise {
  id: string
  template_id: string
  exercise_id: string
  order_index: number
  target_sets: number | null
  target_reps: string | null
  target_weight_kg: number | null
  target_duration_sec: number | null
  rest_sec: number
  notes: string | null
  exercise?: Exercise
}

// Workout sessions
export interface WorkoutSession {
  id: string
  user_id: string
  template_id: string | null
  name: string
  status: WorkoutStatus
  started_at: string
  completed_at: string | null
  duration_sec: number | null
  notes: string | null
  rating: number | null
  perceived_exertion: number | null
  calories_burned: number | null
  created_at: string
  exercise_logs?: ExerciseLog[]
}

// Exercise logs
export interface ExerciseLog {
  id: string
  session_id: string
  exercise_id: string
  order_index: number
  notes: string | null
  created_at: string
  exercise?: Exercise
  sets?: Set[]
  cardio_log?: CardioLog
}

// Sets for strength training
export interface Set {
  id: string
  exercise_log_id: string
  set_number: number
  set_type: SetType
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  is_pr: boolean
  completed_at: string
  notes: string | null
}

// Cardio logs
export interface CardioLog {
  id: string
  exercise_log_id: string
  duration_sec: number
  distance_km: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  avg_pace_sec_per_km: number | null
  calories_burned: number | null
  elevation_gain_m: number | null
  notes: string | null
}

// Personal records
export interface PersonalRecord {
  id: string
  user_id: string
  exercise_id: string
  record_type: RecordType
  value: number
  unit: string
  set_id: string | null
  cardio_log_id: string | null
  achieved_at: string
  previous_record: number | null
  improvement_percent: number | null
  exercise?: Exercise
}

// Achievements
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  criteria: Record<string, unknown>
  points: number
}

// User achievements
export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  progress: number
  achievement?: Achievement
}

// Body measurements
export interface BodyMeasurement {
  id: string
  user_id: string
  measured_at: string
  weight_kg: number | null
  body_fat_percent: number | null
  muscle_mass_kg: number | null
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  bicep_cm: number | null
  thigh_cm: number | null
  notes: string | null
}

// AI insights
export interface AIInsight {
  id: string
  user_id: string
  insight_type: InsightType
  title: string
  content: string
  related_exercise_id: string | null
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  expires_at: string | null
}

// Computed types for UI
export interface WorkoutStats {
  totalWorkouts: number
  totalVolume: number
  totalDuration: number
  currentStreak: number
  longestStreak: number
  workoutsThisWeek: number
  workoutsThisMonth: number
}

export interface ExerciseStats {
  exerciseId: string
  exerciseName: string
  totalSets: number
  totalReps: number
  maxWeight: number
  totalVolume: number
  lastPerformed: string
  personalRecords: PersonalRecord[]
}
