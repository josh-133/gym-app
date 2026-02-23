/**
 * One-time migration from localStorage to Supabase
 * Detects localStorage workout data and batch-inserts into Supabase tables
 */

const MIGRATION_FLAG = 'gym-app-migration-completed'
const HISTORY_KEY = 'gym-app-workout-history'
const TEMPLATES_KEY = 'gym-app-workout-templates'

interface LocalStorageWorkout {
  id: string
  name: string
  date: string
  duration: number
  exercises: {
    name: string
    category?: string
    sets: {
      weight: number | null
      reps: number | null
      completed: boolean
      set_type?: string
      rpe?: number | null
    }[]
    cardio?: {
      duration_sec: number
      distance_km?: number
      calories?: number
      completed: boolean
    }
    group_id?: string | null
    group_type?: string | null
  }[]
  volume: number
  rating: number | null
  notes: string | null
}

interface LocalStorageTemplate {
  id: string
  name: string
  exercises: {
    name: string
    sets: number
    defaultWeight?: number
    defaultReps?: number
    group_id?: string | null
    group_type?: string | null
  }[]
  createdAt: string
  lastUsed: string | null
}

export function useMigration() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()
  const migrating = ref(false)
  const progress = ref(0)
  const totalItems = ref(0)

  function needsMigration(): boolean {
    if (!import.meta.client) return false
    if (localStorage.getItem(MIGRATION_FLAG)) return false
    const history = localStorage.getItem(HISTORY_KEY)
    const templates = localStorage.getItem(TEMPLATES_KEY)
    return !!(history || templates)
  }

  async function migrate() {
    if (!$supabase || !auth.user.value || !needsMigration()) return

    migrating.value = true
    progress.value = 0
    const userId = auth.user.value.id

    try {
      // Parse localStorage data
      const workoutsRaw = localStorage.getItem(HISTORY_KEY)
      const templatesRaw = localStorage.getItem(TEMPLATES_KEY)

      const workouts: LocalStorageWorkout[] = workoutsRaw ? JSON.parse(workoutsRaw) : []
      const templates: LocalStorageTemplate[] = templatesRaw ? JSON.parse(templatesRaw) : []

      totalItems.value = workouts.length + templates.length
      if (totalItems.value === 0) {
        localStorage.setItem(MIGRATION_FLAG, new Date().toISOString())
        migrating.value = false
        return
      }

      // Build exercise name → id lookup from existing exercises
      const { data: exercises } = await $supabase
        .from('exercises')
        .select('id, name')

      const exerciseMap = new Map<string, string>()
      if (exercises) {
        exercises.forEach((ex: { id: string; name: string }) => exerciseMap.set(ex.name.toLowerCase(), ex.id))
      }

      // Helper to find or create exercise ID
      async function getExerciseId(name: string, category: string = 'strength'): Promise<string> {
        const key = name.toLowerCase()
        if (exerciseMap.has(key)) return exerciseMap.get(key)!

        // Create custom exercise
        const { data, error } = await $supabase
          .from('exercises')
          .insert({
            user_id: userId,
            name,
            category,
            muscle_groups: [],
            equipment: [],
            is_system: false,
          })
          .select('id')
          .single()

        if (error || !data) {
          // Generate a UUID as fallback
          const fallbackId = crypto.randomUUID()
          exerciseMap.set(key, fallbackId)
          return fallbackId
        }

        exerciseMap.set(key, data.id)
        return data.id
      }

      // Migrate workouts in batches
      for (const workout of workouts) {
        try {
          // Insert workout session
          const { data: session, error: sessionError } = await $supabase
            .from('workout_sessions')
            .insert({
              id: workout.id,
              user_id: userId,
              name: workout.name,
              status: 'completed',
              started_at: workout.date,
              completed_at: workout.date,
              duration_sec: workout.duration,
              notes: workout.notes,
              rating: workout.rating,
              calories_burned: null,
            })
            .select('id')
            .single()

          if (sessionError) {
            // Session may already exist (duplicate id), skip
            console.warn('Skipping workout (may already exist):', workout.name, sessionError.message)
            progress.value++
            continue
          }

          const sessionId = session.id

          // Insert exercise logs and sets
          for (let i = 0; i < workout.exercises.length; i++) {
            const ex = workout.exercises[i]
            const exerciseId = await getExerciseId(ex.name, ex.category || 'strength')

            const { data: exerciseLog, error: logError } = await $supabase
              .from('exercise_logs')
              .insert({
                session_id: sessionId,
                exercise_id: exerciseId,
                order_index: i,
                notes: null,
              })
              .select('id')
              .single()

            if (logError || !exerciseLog) continue

            // Insert sets for strength exercises
            if (ex.sets && ex.sets.length > 0) {
              const setsToInsert = ex.sets.map((set, idx) => ({
                exercise_log_id: exerciseLog.id,
                set_number: idx + 1,
                set_type: set.set_type || 'working',
                reps: set.reps,
                weight_kg: set.weight,
                rpe: set.rpe || null,
                is_pr: false,
                completed_at: set.completed ? workout.date : null,
              }))

              await $supabase.from('sets').insert(setsToInsert)
            }

            // Insert cardio log
            if (ex.cardio && ex.cardio.completed) {
              await $supabase.from('cardio_logs').insert({
                exercise_log_id: exerciseLog.id,
                duration_sec: ex.cardio.duration_sec,
                distance_km: ex.cardio.distance_km || null,
                calories_burned: ex.cardio.calories || null,
              })
            }
          }
        } catch (err) {
          console.error('Error migrating workout:', workout.name, err)
        }

        progress.value++
      }

      // Migrate templates
      for (const template of templates) {
        try {
          const { data: tmpl, error: tmplError } = await $supabase
            .from('workout_templates')
            .insert({
              user_id: userId,
              name: template.name,
              description: null,
              target_muscle_groups: [],
              is_public: false,
            })
            .select('id')
            .single()

          if (tmplError || !tmpl) {
            progress.value++
            continue
          }

          // Insert template exercises
          for (let i = 0; i < template.exercises.length; i++) {
            const ex = template.exercises[i]
            const exerciseId = await getExerciseId(ex.name)

            await $supabase.from('template_exercises').insert({
              template_id: tmpl.id,
              exercise_id: exerciseId,
              order_index: i,
              target_sets: ex.sets,
              target_reps: ex.defaultReps?.toString() || null,
              target_weight_kg: ex.defaultWeight || null,
              rest_sec: 60,
            })
          }
        } catch (err) {
          console.error('Error migrating template:', template.name, err)
        }

        progress.value++
      }

      // Mark migration complete
      localStorage.setItem(MIGRATION_FLAG, new Date().toISOString())
    } catch (err) {
      console.error('Migration failed:', err)
    } finally {
      migrating.value = false
    }
  }

  return {
    needsMigration,
    migrate,
    migrating: readonly(migrating),
    progress: readonly(progress),
    totalItems: readonly(totalItems),
  }
}
