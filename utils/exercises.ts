/**
 * Exercise Library
 * Contains all available exercises with their metadata for the AI workout generator
 */

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
  | 'treadmill'
  | 'bike'
  | 'rower'
  | 'elliptical'
  | 'jump_rope'
  | 'box'

export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'warmup'

export type CardioTrackingType = 'duration' | 'duration_distance' | 'reps'

export interface ExerciseDefinition {
  id: string
  name: string
  category: ExerciseCategory
  muscleGroups: MuscleGroup[]
  equipment: Equipment[]
  isCompound: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions?: string
  trackingType?: CardioTrackingType // For cardio: how to track this exercise
}

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // CHEST
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Barbell Bench Press',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['dumbbell', 'bench'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['dumbbell', 'bench'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    category: 'strength',
    muscleGroups: ['chest'],
    equipment: ['dumbbell', 'bench'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    category: 'strength',
    muscleGroups: ['chest'],
    equipment: ['cable'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'dips',
    name: 'Dips',
    category: 'strength',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'chest-press-machine',
    name: 'Chest Press Machine',
    category: 'strength',
    muscleGroups: ['chest', 'triceps'],
    equipment: ['machine'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'pec-deck',
    name: 'Pec Deck Machine',
    category: 'strength',
    muscleGroups: ['chest'],
    equipment: ['machine'],
    isCompound: false,
    difficulty: 'beginner',
  },

  // BACK
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    category: 'strength',
    muscleGroups: ['back', 'hamstrings', 'glutes', 'lower_back'],
    equipment: ['barbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'strength',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: ['barbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    category: 'strength',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: ['dumbbell', 'bench'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    category: 'strength',
    muscleGroups: ['lats', 'back', 'biceps'],
    equipment: ['bodyweight', 'pull_up_bar'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'chin-ups',
    name: 'Chin-Ups',
    category: 'strength',
    muscleGroups: ['lats', 'back', 'biceps'],
    equipment: ['bodyweight', 'pull_up_bar'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'strength',
    muscleGroups: ['lats', 'back', 'biceps'],
    equipment: ['cable', 'machine'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'strength',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: ['cable'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'vertical-row',
    name: 'Vertical Row',
    category: 'strength',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: ['machine'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'fixed-lateral-pulldown',
    name: 'Fixed Lateral Pull Down',
    category: 'strength',
    muscleGroups: ['lats', 'back', 'biceps'],
    equipment: ['machine'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    category: 'strength',
    muscleGroups: ['back', 'lats', 'biceps'],
    equipment: ['barbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    category: 'strength',
    muscleGroups: ['back', 'shoulders', 'traps'],
    equipment: ['cable'],
    isCompound: false,
    difficulty: 'beginner',
  },

  // SHOULDERS
  {
    id: 'overhead-press',
    name: 'Barbell Overhead Press',
    category: 'strength',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['barbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    category: 'strength',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['dumbbell'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    category: 'strength',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['dumbbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    category: 'strength',
    muscleGroups: ['shoulders'],
    equipment: ['dumbbell'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'front-raises',
    name: 'Front Raises',
    category: 'strength',
    muscleGroups: ['shoulders'],
    equipment: ['dumbbell'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    category: 'strength',
    muscleGroups: ['shoulders', 'back'],
    equipment: ['dumbbell'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'upright-rows',
    name: 'Upright Rows',
    category: 'strength',
    muscleGroups: ['shoulders', 'traps'],
    equipment: ['barbell', 'dumbbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'shoulder-press-machine',
    name: 'Shoulder Press Machine',
    category: 'strength',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: ['machine'],
    isCompound: true,
    difficulty: 'beginner',
  },

  // ARMS - BICEPS
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    category: 'strength',
    muscleGroups: ['biceps'],
    equipment: ['barbell'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    category: 'strength',
    muscleGroups: ['biceps'],
    equipment: ['dumbbell'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    category: 'strength',
    muscleGroups: ['biceps', 'forearms'],
    equipment: ['dumbbell'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    category: 'strength',
    muscleGroups: ['biceps'],
    equipment: ['barbell', 'dumbbell', 'bench'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'barbell-preacher-curl',
    name: 'Barbell Preacher Curl',
    category: 'strength',
    muscleGroups: ['biceps'],
    equipment: ['barbell', 'bench'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    category: 'strength',
    muscleGroups: ['biceps'],
    equipment: ['cable'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    category: 'strength',
    muscleGroups: ['biceps'],
    equipment: ['dumbbell', 'bench'],
    isCompound: false,
    difficulty: 'intermediate',
  },

  // ARMS - TRICEPS
  {
    id: 'close-grip-bench',
    name: 'Close-Grip Bench Press',
    category: 'strength',
    muscleGroups: ['triceps', 'chest'],
    equipment: ['barbell', 'bench'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    category: 'strength',
    muscleGroups: ['triceps'],
    equipment: ['barbell', 'bench'],
    isCompound: false,
    difficulty: 'intermediate',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    category: 'strength',
    muscleGroups: ['triceps'],
    equipment: ['cable'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    category: 'strength',
    muscleGroups: ['triceps'],
    equipment: ['dumbbell', 'cable'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    category: 'strength',
    muscleGroups: ['triceps', 'chest'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'diamond-push-ups',
    name: 'Diamond Push-Ups',
    category: 'strength',
    muscleGroups: ['triceps', 'chest'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
  },

  // LEGS - QUADS
  {
    id: 'barbell-squat',
    name: 'Barbell Back Squat',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['barbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    category: 'strength',
    muscleGroups: ['quads', 'glutes'],
    equipment: ['barbell'],
    isCompound: true,
    difficulty: 'advanced',
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'strength',
    muscleGroups: ['quads', 'glutes'],
    equipment: ['dumbbell', 'kettlebell'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['machine'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'single-leg-press',
    name: 'Single Leg Press',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['machine'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'strength',
    muscleGroups: ['quads'],
    equipment: ['machine'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'single-leg-extension',
    name: 'Single Leg Extension',
    category: 'strength',
    muscleGroups: ['quads'],
    equipment: ['machine'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'lunges',
    name: 'Lunges',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['bodyweight', 'dumbbell'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'strength',
    muscleGroups: ['quads', 'glutes'],
    equipment: ['bodyweight', 'dumbbell', 'bench'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    category: 'strength',
    muscleGroups: ['quads', 'glutes'],
    equipment: ['machine'],
    isCompound: true,
    difficulty: 'intermediate',
  },

  // LEGS - HAMSTRINGS & GLUTES
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'strength',
    muscleGroups: ['hamstrings', 'glutes', 'lower_back'],
    equipment: ['barbell', 'dumbbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    category: 'strength',
    muscleGroups: ['hamstrings'],
    equipment: ['machine'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'single-leg-curl',
    name: 'Single Leg Curl',
    category: 'strength',
    muscleGroups: ['hamstrings'],
    equipment: ['machine'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    category: 'strength',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: ['barbell', 'bench'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'strength',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'good-mornings',
    name: 'Good Mornings',
    category: 'strength',
    muscleGroups: ['hamstrings', 'lower_back', 'glutes'],
    equipment: ['barbell'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull-Through',
    category: 'strength',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: ['cable'],
    isCompound: true,
    difficulty: 'beginner',
  },

  // LEGS - CALVES
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'strength',
    muscleGroups: ['calves'],
    equipment: ['machine', 'bodyweight'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    category: 'strength',
    muscleGroups: ['calves'],
    equipment: ['machine'],
    isCompound: false,
    difficulty: 'beginner',
  },

  // CORE
  {
    id: 'plank',
    name: 'Plank',
    category: 'strength',
    muscleGroups: ['abs', 'obliques'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'crunches',
    name: 'Crunches',
    category: 'strength',
    muscleGroups: ['abs'],
    equipment: ['bodyweight'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'leg-raises',
    name: 'Hanging Leg Raises',
    category: 'strength',
    muscleGroups: ['abs', 'obliques'],
    equipment: ['bodyweight', 'pull_up_bar'],
    isCompound: false,
    difficulty: 'intermediate',
  },
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    category: 'strength',
    muscleGroups: ['obliques', 'abs'],
    equipment: ['bodyweight', 'dumbbell'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'cable-woodchop',
    name: 'Cable Woodchop',
    category: 'strength',
    muscleGroups: ['obliques', 'abs'],
    equipment: ['cable'],
    isCompound: false,
    difficulty: 'intermediate',
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    category: 'strength',
    muscleGroups: ['abs'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    category: 'strength',
    muscleGroups: ['abs'],
    equipment: ['bodyweight'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'strength',
    muscleGroups: ['abs', 'obliques'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },

  // WARMUP EXERCISES
  {
    id: 'arm-circles',
    name: 'Arm Circles',
    category: 'warmup',
    muscleGroups: ['shoulders'],
    equipment: ['bodyweight'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'band-pull-aparts',
    name: 'Band Pull-Aparts',
    category: 'warmup',
    muscleGroups: ['back', 'shoulders'],
    equipment: ['resistance_band'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    category: 'warmup',
    muscleGroups: ['hamstrings', 'quads'],
    equipment: ['bodyweight'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    category: 'warmup',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'cat-cow',
    name: 'Cat-Cow Stretch',
    category: 'warmup',
    muscleGroups: ['back', 'abs'],
    equipment: ['bodyweight'],
    isCompound: false,
    difficulty: 'beginner',
  },
  {
    id: 'world-greatest-stretch',
    name: 'World\'s Greatest Stretch',
    category: 'warmup',
    muscleGroups: ['hamstrings', 'quads', 'back'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    category: 'warmup',
    muscleGroups: ['quads', 'shoulders'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    category: 'warmup',
    muscleGroups: ['quads', 'abs'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },

  // CARDIO - RUNNING
  {
    id: 'treadmill-run',
    name: 'Treadmill Run',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['treadmill'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'outdoor-run',
    name: 'Outdoor Run',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'treadmill-walk',
    name: 'Treadmill Walk',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['treadmill'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'outdoor-walk',
    name: 'Outdoor Walk',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'incline-walk',
    name: 'Incline Walk',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['treadmill'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'sprints',
    name: 'Sprints',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'duration_distance',
  },

  // CARDIO - CYCLING
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['bike'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'outdoor-cycling',
    name: 'Outdoor Cycling',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['bike'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'spin-class',
    name: 'Spin Class',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'calves', 'glutes'],
    equipment: ['bike'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'duration',
  },

  // CARDIO - OTHER MACHINES
  {
    id: 'rowing-machine',
    name: 'Rowing Machine',
    category: 'cardio',
    muscleGroups: ['back', 'lats', 'quads', 'hamstrings', 'glutes', 'biceps'],
    equipment: ['rower'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
    equipment: ['elliptical'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration_distance',
  },
  {
    id: 'stair-climber',
    name: 'Stair Climber',
    category: 'cardio',
    muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
    equipment: ['machine'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'duration',
  },

  // CARDIO - JUMP ROPE & OTHER
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    category: 'cardio',
    muscleGroups: ['calves', 'quads', 'shoulders'],
    equipment: ['jump_rope'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'duration',
  },
  {
    id: 'battle-ropes',
    name: 'Battle Ropes',
    category: 'cardio',
    muscleGroups: ['shoulders', 'back', 'abs', 'biceps'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'duration',
  },
  {
    id: 'swimming',
    name: 'Swimming',
    category: 'cardio',
    muscleGroups: ['back', 'shoulders', 'lats', 'abs'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'duration_distance',
  },

  // PLYOMETRIC / EXPLOSIVE EXERCISES
  {
    id: 'box-jumps',
    name: 'Box Jumps',
    category: 'cardio',
    muscleGroups: ['quads', 'glutes', 'calves', 'hamstrings'],
    equipment: ['box'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'reps',
  },
  {
    id: 'squat-jumps',
    name: 'Squat Jumps',
    category: 'cardio',
    muscleGroups: ['quads', 'glutes', 'calves', 'hamstrings'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'reps',
  },
  {
    id: 'burpees',
    name: 'Burpees',
    category: 'cardio',
    muscleGroups: ['quads', 'chest', 'shoulders', 'abs'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'reps',
  },
  {
    id: 'jump-lunges',
    name: 'Jump Lunges',
    category: 'cardio',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'reps',
  },
  {
    id: 'tuck-jumps',
    name: 'Tuck Jumps',
    category: 'cardio',
    muscleGroups: ['quads', 'glutes', 'calves', 'abs'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'reps',
  },
  {
    id: 'broad-jumps',
    name: 'Broad Jumps',
    category: 'cardio',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'intermediate',
    trackingType: 'reps',
  },
  {
    id: 'skater-jumps',
    name: 'Skater Jumps',
    category: 'cardio',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves'],
    equipment: ['bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'reps',
  },
  {
    id: 'power-cleans',
    name: 'Power Cleans',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'traps', 'shoulders'],
    equipment: ['barbell'],
    isCompound: true,
    difficulty: 'advanced',
  },
  {
    id: 'kettlebell-swings',
    name: 'Kettlebell Swings',
    category: 'cardio',
    muscleGroups: ['glutes', 'hamstrings', 'back', 'shoulders'],
    equipment: ['kettlebell'],
    isCompound: true,
    difficulty: 'beginner',
    trackingType: 'reps',
  },
  {
    id: 'step-ups',
    name: 'Step-Ups',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['box', 'bodyweight'],
    isCompound: true,
    difficulty: 'beginner',
  },
  {
    id: 'depth-jumps',
    name: 'Depth Jumps',
    category: 'cardio',
    muscleGroups: ['quads', 'glutes', 'calves'],
    equipment: ['box'],
    isCompound: true,
    difficulty: 'advanced',
    trackingType: 'reps',
  },
]

/**
 * Get exercises filtered by equipment availability
 */
export function getExercisesForEquipment(
  availableEquipment: Equipment[]
): ExerciseDefinition[] {
  return EXERCISE_LIBRARY.filter((exercise) =>
    exercise.equipment.every((eq) => availableEquipment.includes(eq))
  )
}

/**
 * Get exercises targeting specific muscle groups
 */
export function getExercisesForMuscleGroups(
  targetMuscles: MuscleGroup[]
): ExerciseDefinition[] {
  return EXERCISE_LIBRARY.filter((exercise) =>
    exercise.muscleGroups.some((mg) => targetMuscles.includes(mg))
  )
}

/**
 * Map workout types to target muscle groups
 */
export const WORKOUT_TYPE_MUSCLES: Record<string, MuscleGroup[]> = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'lats', 'biceps', 'traps'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'lats', 'traps'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves'],
  full_body: [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'quads',
    'hamstrings',
    'glutes',
  ],
}
