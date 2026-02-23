import { createClient } from '@supabase/supabase-js'

interface ImportedSet {
  date: string
  workoutName: string
  exerciseName: string
  setNumber: number
  weight: number | null
  reps: number | null
  durationSec: number | null
  distanceKm: number | null
  rpe: number | null
  notes: string | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body.sets || !Array.isArray(body.sets)) {
    throw createError({ statusCode: 400, message: 'Invalid import data: sets array required' })
  }

  if (!body.userId) {
    throw createError({ statusCode: 400, message: 'userId is required' })
  }

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string
  )

  const sets: ImportedSet[] = body.sets
  const userId: string = body.userId

  // Group sets by workout (date + workoutName)
  const workoutMap = new Map<string, ImportedSet[]>()
  for (const set of sets) {
    const key = `${set.date}||${set.workoutName}`
    if (!workoutMap.has(key)) workoutMap.set(key, [])
    workoutMap.get(key)!.push(set)
  }

  let importedWorkouts = 0
  let importedSets = 0

  // Build exercise name → id cache
  const exerciseCache = new Map<string, string>()
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name')

  if (exercises) {
    for (const ex of exercises) {
      exerciseCache.set(ex.name.toLowerCase(), ex.id)
    }
  }

  async function getOrCreateExercise(name: string): Promise<string> {
    const cached = exerciseCache.get(name.toLowerCase())
    if (cached) return cached

    // Create custom exercise
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: userId,
        name,
        category: 'strength',
        muscle_groups: [],
        equipment: [],
        instructions: [],
        is_compound: false,
        is_system: false,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw createError({ statusCode: 500, message: `Failed to create exercise: ${name}` })
    }

    exerciseCache.set(name.toLowerCase(), data.id)
    return data.id
  }

  for (const [key, workoutSets] of workoutMap) {
    const [date, workoutName] = key.split('||')

    // Create workout session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        name: workoutName || 'Imported Workout',
        status: 'completed',
        started_at: new Date(date).toISOString(),
        completed_at: new Date(date).toISOString(),
      })
      .select('id')
      .single()

    if (sessionError || !session) continue

    // Group by exercise within workout
    const exerciseMap = new Map<string, ImportedSet[]>()
    for (const s of workoutSets) {
      if (!exerciseMap.has(s.exerciseName)) exerciseMap.set(s.exerciseName, [])
      exerciseMap.get(s.exerciseName)!.push(s)
    }

    let orderIndex = 0
    for (const [exerciseName, exerciseSets] of exerciseMap) {
      const exerciseId = await getOrCreateExercise(exerciseName)

      // Create exercise log
      const { data: log, error: logError } = await supabase
        .from('exercise_logs')
        .insert({
          session_id: session.id,
          exercise_id: exerciseId,
          order_index: orderIndex++,
        })
        .select('id')
        .single()

      if (logError || !log) continue

      // Check if this is cardio (has duration but no weight/reps)
      const isCardio = exerciseSets.every(s => s.durationSec && !s.weight && !s.reps)

      if (isCardio) {
        // Create cardio log
        const s = exerciseSets[0]
        await supabase.from('cardio_logs').insert({
          exercise_log_id: log.id,
          duration_sec: s.durationSec || 0,
          distance_km: s.distanceKm,
          notes: s.notes,
        })
      } else {
        // Create sets
        const setsToInsert = exerciseSets.map((s, i) => ({
          exercise_log_id: log.id,
          set_number: i + 1,
          set_type: 'working',
          reps: s.reps,
          weight_kg: s.weight,
          rpe: s.rpe,
          is_pr: false,
          completed_at: new Date(date).toISOString(),
          notes: s.notes,
        }))

        const { error: setsError } = await supabase
          .from('sets')
          .insert(setsToInsert)

        if (!setsError) importedSets += setsToInsert.length
      }
    }

    importedWorkouts++
  }

  return {
    success: true,
    imported: {
      workouts: importedWorkouts,
      sets: importedSets,
    },
  }
})
