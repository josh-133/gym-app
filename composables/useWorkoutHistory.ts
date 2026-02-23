import { EXERCISE_LIBRARY } from '~/utils/exercises'

interface CardioData {
  duration_sec: number
  distance_km?: number
  calories?: number
  completed: boolean
}

interface SavedWorkout {
  id: string
  name: string
  date: string
  duration: number // in seconds
  exercises: {
    name: string
    category?: 'strength' | 'cardio' | 'flexibility' | 'sport'
    sets: {
      weight: number | null
      reps: number | null
      completed: boolean
      set_type?: 'warmup' | 'working' | 'dropset' | 'failure' | 'amrap'
      rpe?: number | null
      tempo?: string | null
    }[]
    cardio?: CardioData
    group_id?: string | null
    group_type?: 'superset' | 'circuit' | null
  }[]
  volume: number
  rating: number | null
  notes: string | null
  mood?: number | null
  energy?: number | null
  sleep_quality?: number | null
  calories_burned?: number | null
}

interface PersonalRecord {
  id: string
  exercise: string
  weight: number
  reps: number
  date: string
  workoutId: string
}

const STORAGE_KEY = 'gym-app-workout-history'
const WEEKLY_GOAL_KEY = 'gym-app-weekly-goal'

export function useWorkoutHistory() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()
  const workouts = useState<SavedWorkout[]>('workoutHistory', () => [])
  const supabaseLoaded = useState('workoutHistorySupabaseLoaded', () => false)

  // Load workouts from localStorage first, then sync from Supabase
  function loadWorkouts() {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          workouts.value = JSON.parse(stored)
        } catch (e) {
          console.error('Failed to parse workout history:', e)
          workouts.value = []
        }
      }
    }
  }

  // Load workouts from Supabase
  async function loadFromSupabase() {
    if (!$supabase || !auth.user.value || supabaseLoaded.value) return

    try {
      const { data: sessions, error } = await $supabase
        .from('workout_sessions')
        .select(`
          id, name, status, started_at, completed_at, duration_sec,
          notes, rating, perceived_exertion, calories_burned,
          mood, energy, sleep_quality,
          exercise_logs (
            id, exercise_id, order_index, notes,
            exercises:exercise_id ( id, name, category ),
            sets ( id, set_number, set_type, reps, weight_kg, rpe, is_pr, completed_at, tempo ),
            cardio_logs ( id, duration_sec, distance_km, calories_burned )
          )
        `)
        .eq('user_id', auth.user.value.id)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })

      if (error) {
        console.error('Error loading from Supabase:', error)
        return
      }

      if (sessions && sessions.length > 0) {
        const supabaseWorkouts: SavedWorkout[] = sessions.map((s: any) => {
          const exerciseLogs = (s.exercise_logs || []).sort((a: any, b: any) => a.order_index - b.order_index)

          return {
            id: s.id,
            name: s.name,
            date: s.started_at,
            duration: s.duration_sec || 0,
            exercises: exerciseLogs.map((log: any) => {
              const exercise = log.exercises
              const sets = (log.sets || []).sort((a: any, b: any) => a.set_number - b.set_number)
              const cardioLogs = log.cardio_logs || []

              return {
                name: exercise?.name || 'Unknown',
                category: exercise?.category || 'strength',
                sets: sets.map((set: any) => ({
                  weight: set.weight_kg,
                  reps: set.reps,
                  completed: !!set.completed_at,
                  set_type: set.set_type || 'working',
                  rpe: set.rpe,
                  tempo: set.tempo || null,
                })),
                cardio: cardioLogs.length > 0 ? {
                  duration_sec: cardioLogs[0].duration_sec,
                  distance_km: cardioLogs[0].distance_km,
                  calories: cardioLogs[0].calories_burned,
                  completed: true,
                } : undefined,
              }
            }),
            volume: exerciseLogs.reduce((sum: number, log: any) => {
              return sum + (log.sets || []).reduce((setSum: number, set: any) => {
                if (set.completed_at && set.reps && set.weight_kg) {
                  return setSum + (set.reps * set.weight_kg)
                }
                return setSum
              }, 0)
            }, 0),
            rating: s.rating,
            notes: s.notes,
            mood: s.mood,
            energy: s.energy,
            sleep_quality: s.sleep_quality,
            calories_burned: s.calories_burned,
          }
        })

        // Merge: Supabase is source of truth, but keep any localStorage-only workouts
        const supabaseIds = new Set(supabaseWorkouts.map(w => w.id))
        const localOnly = workouts.value.filter(w => !supabaseIds.has(w.id))

        workouts.value = [...supabaseWorkouts, ...localOnly]
        saveToLocalStorage()

        // Sync localStorage-only workouts to Supabase
        if (localOnly.length > 0) {
          syncLocalWorkoutsToSupabase(localOnly)
        }
      }

      supabaseLoaded.value = true
    } catch (err) {
      console.error('Error loading workouts from Supabase:', err)
    }
  }

  // Sync localStorage-only workouts to Supabase (background)
  async function syncLocalWorkoutsToSupabase(localWorkouts: SavedWorkout[]) {
    if (!$supabase || !auth.user.value) return

    for (const workout of localWorkouts) {
      try {
        await saveWorkoutToSupabase(workout)
      } catch (err) {
        console.error('Error syncing local workout:', workout.name, err)
      }
    }
  }

  // Save workout to Supabase
  async function saveWorkoutToSupabase(workout: SavedWorkout) {
    if (!$supabase || !auth.user.value) return

    const userId = auth.user.value.id

    // Build exercise name → id lookup
    const { data: exercises } = await $supabase
      .from('exercises')
      .select('id, name')

    const exerciseMap = new Map<string, string>()
    if (exercises) {
      exercises.forEach((ex: { id: string; name: string }) => exerciseMap.set(ex.name.toLowerCase(), ex.id))
    }

    async function getExerciseId(name: string, category: string = 'strength'): Promise<string | null> {
      const key = name.toLowerCase()
      if (exerciseMap.has(key)) return exerciseMap.get(key)!

      // Try to find from EXERCISE_LIBRARY
      const libraryEx = EXERCISE_LIBRARY.find(e => e.name.toLowerCase() === key)
      if (libraryEx && exerciseMap.has(libraryEx.name.toLowerCase())) {
        return exerciseMap.get(libraryEx.name.toLowerCase())!
      }

      // Create custom exercise
      const { data, error } = await $supabase
        .from('exercises')
        .insert({
          user_id: userId,
          name,
          category,
          muscle_groups: libraryEx?.muscleGroups || [],
          equipment: libraryEx?.equipment || [],
          is_compound: libraryEx?.isCompound || false,
          is_system: false,
        })
        .select('id')
        .single()

      if (error || !data) return null
      exerciseMap.set(key, data.id)
      return data.id
    }

    try {
      // Insert session
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
          calories_burned: workout.calories_burned || null,
          mood: workout.mood || null,
          energy: workout.energy || null,
          sleep_quality: workout.sleep_quality || null,
        })
        .select('id')
        .single()

      if (sessionError) return // May already exist

      // Insert exercise logs
      for (let i = 0; i < workout.exercises.length; i++) {
        const ex = workout.exercises[i]
        const exerciseId = await getExerciseId(ex.name, ex.category || 'strength')
        if (!exerciseId) continue

        const { data: exerciseLog } = await $supabase
          .from('exercise_logs')
          .insert({
            session_id: session.id,
            exercise_id: exerciseId,
            order_index: i,
          })
          .select('id')
          .single()

        if (!exerciseLog) continue

        // Insert sets
        if (ex.sets.length > 0) {
          const setsToInsert = ex.sets.map((set, idx) => ({
            exercise_log_id: exerciseLog.id,
            set_number: idx + 1,
            set_type: set.set_type || 'working',
            reps: set.reps,
            weight_kg: set.weight,
            rpe: set.rpe || null,
            is_pr: false,
            completed_at: set.completed ? workout.date : null,
            tempo: set.tempo || null,
          }))

          await $supabase.from('sets').insert(setsToInsert)
        }

        // Insert cardio log
        if (ex.cardio?.completed) {
          await $supabase.from('cardio_logs').insert({
            exercise_log_id: exerciseLog.id,
            duration_sec: ex.cardio.duration_sec,
            distance_km: ex.cardio.distance_km || null,
            calories_burned: ex.cardio.calories || null,
          })
        }
      }
    } catch (err) {
      console.error('Error saving workout to Supabase:', err)
    }
  }

  // Save workouts to localStorage (write-through cache)
  function saveToLocalStorage() {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts.value))
    }
  }

  // Add a completed workout
  async function addWorkout(workout: SavedWorkout) {
    workouts.value.unshift(workout)
    saveToLocalStorage()

    // Save to Supabase in background
    saveWorkoutToSupabase(workout)
  }

  // Delete a workout
  async function deleteWorkout(id: string) {
    workouts.value = workouts.value.filter(w => w.id !== id)
    saveToLocalStorage()

    // Delete from Supabase
    if ($supabase && auth.user.value) {
      await $supabase.from('workout_sessions').delete().eq('id', id)
    }
  }

  // Get a specific workout by ID
  function getWorkout(id: string): SavedWorkout | undefined {
    return workouts.value.find(w => w.id === id)
  }

  // Update workout rating
  async function updateRating(id: string, rating: number) {
    const workout = workouts.value.find(w => w.id === id)
    if (workout) {
      workout.rating = rating
      saveToLocalStorage()

      if ($supabase && auth.user.value) {
        await $supabase.from('workout_sessions').update({ rating }).eq('id', id)
      }
    }
  }

  // Update an entire workout
  async function updateWorkout(id: string, updates: Partial<Omit<SavedWorkout, 'id'>>) {
    const index = workouts.value.findIndex(w => w.id === id)
    if (index !== -1) {
      workouts.value.splice(index, 1, { ...workouts.value[index], ...updates })
      saveToLocalStorage()

      // Update Supabase
      if ($supabase && auth.user.value) {
        const supabaseUpdates: Record<string, any> = {}
        if (updates.name !== undefined) supabaseUpdates.name = updates.name
        if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes
        if (updates.rating !== undefined) supabaseUpdates.rating = updates.rating
        if (updates.mood !== undefined) supabaseUpdates.mood = updates.mood
        if (updates.energy !== undefined) supabaseUpdates.energy = updates.energy
        if (updates.sleep_quality !== undefined) supabaseUpdates.sleep_quality = updates.sleep_quality

        if (Object.keys(supabaseUpdates).length > 0) {
          await $supabase.from('workout_sessions').update(supabaseUpdates).eq('id', id)
        }
      }

      return true
    }
    return false
  }

  // Weekly goal target
  const weeklyGoalTarget = useState<number>('weeklyGoalTarget', () => 5)

  function loadWeeklyGoal() {
    if (import.meta.client) {
      const stored = localStorage.getItem(WEEKLY_GOAL_KEY)
      if (stored) {
        const parsed = parseInt(stored, 10)
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) {
          weeklyGoalTarget.value = parsed
        }
      }
    }
  }

  function setWeeklyGoalTarget(target: number) {
    if (target >= 1 && target <= 7) {
      weeklyGoalTarget.value = target
      if (import.meta.client) {
        localStorage.setItem(WEEKLY_GOAL_KEY, target.toString())
      }
    }
  }

  // Calculate all personal records from workout history
  function calculateAllPRs(): PersonalRecord[] {
    const prMap = new Map<string, PersonalRecord>()

    const sortedWorkouts = [...workouts.value].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    for (const workout of sortedWorkouts) {
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (set.completed && set.weight && set.reps && set.weight > 0 && set.reps > 0) {
            const key = exercise.name
            const existing = prMap.get(key)

            const newScore = set.weight * set.reps
            const existingScore = existing ? existing.weight * existing.reps : 0

            if (newScore > existingScore || (newScore === existingScore && set.weight > (existing?.weight || 0))) {
              prMap.set(key, {
                id: `${workout.id}-${exercise.name}-${set.weight}-${set.reps}`,
                exercise: exercise.name,
                weight: set.weight,
                reps: set.reps,
                date: workout.date,
                workoutId: workout.id,
              })
            }
          }
        }
      }
    }

    return Array.from(prMap.values())
  }

  function getPRsThisMonth(): PersonalRecord[] {
    const allPRs = calculateAllPRs()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return allPRs.filter(pr => new Date(pr.date) >= startOfMonth)
  }

  function getExercisePR(exerciseName: string): PersonalRecord | null {
    const allPRs = calculateAllPRs()
    return allPRs.find(pr => pr.exercise === exerciseName) || null
  }

  function getLastPerformedSets(exerciseName: string): { weight: number | null; reps: number | null }[] {
    for (const workout of workouts.value) {
      const exercise = workout.exercises.find(e => e.name === exerciseName)
      if (exercise && exercise.sets.length > 0) {
        return exercise.sets
          .filter(s => s.completed && (s.reps !== null || s.weight !== null))
          .map(s => ({ weight: s.weight, reps: s.reps }))
      }
    }
    return []
  }

  function getExerciseHistory(exerciseName: string): {
    date: string
    workoutId: string
    workoutName: string
    sets: { weight: number | null; reps: number | null; completed: boolean }[]
    totalVolume: number
    bestSet: { weight: number; reps: number } | null
  }[] {
    const history: ReturnType<typeof getExerciseHistory> = []

    for (const workout of workouts.value) {
      const exercise = workout.exercises.find(e => e.name === exerciseName)
      if (exercise) {
        const completedSets = exercise.sets.filter(s => s.completed && s.weight && s.reps)
        const totalVolume = completedSets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0)

        let bestSet: { weight: number; reps: number } | null = null
        let bestScore = 0
        for (const set of completedSets) {
          if (set.weight && set.reps) {
            const score = set.weight * set.reps
            if (score > bestScore) {
              bestScore = score
              bestSet = { weight: set.weight, reps: set.reps }
            }
          }
        }

        history.push({
          date: workout.date,
          workoutId: workout.id,
          workoutName: workout.name,
          sets: exercise.sets,
          totalVolume,
          bestSet,
        })
      }
    }

    return history
  }

  function calculateDayStreak(): number {
    if (workouts.value.length === 0) return 0

    const workoutDates = [...new Set(
      workouts.value.map(w => {
        const date = new Date(w.date)
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      })
    )].map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month, day)
    }).sort((a, b) => b.getTime() - a.getTime())

    if (workoutDates.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const mostRecentWorkout = workoutDates[0]
    mostRecentWorkout.setHours(0, 0, 0, 0)

    if (mostRecentWorkout.getTime() !== today.getTime() &&
        mostRecentWorkout.getTime() !== yesterday.getTime()) {
      return 0
    }

    let streak = 1
    let currentDate = mostRecentWorkout

    for (let i = 1; i < workoutDates.length; i++) {
      const prevDate = new Date(currentDate)
      prevDate.setDate(prevDate.getDate() - 1)
      prevDate.setHours(0, 0, 0, 0)

      const workoutDate = workoutDates[i]
      workoutDate.setHours(0, 0, 0, 0)

      if (workoutDate.getTime() === prevDate.getTime()) {
        streak++
        currentDate = workoutDate
      } else {
        break
      }
    }

    return streak
  }

  function getStagnantExercises(weeksThreshold: number = 2): {
    exercise: string
    lastPR: { weight: number; reps: number; date: string } | null
    daysSinceProgress: number
    timesPerformed: number
  }[] {
    const allPRs = calculateAllPRs()
    const stagnantExercises: ReturnType<typeof getStagnantExercises> = []
    const thresholdMs = weeksThreshold * 7 * 24 * 60 * 60 * 1000
    const now = Date.now()
    // Exclude exercises trained in the last 3 days — they're not actionable
    // until the next session for that muscle group
    const recentCutoffMs = 3 * 24 * 60 * 60 * 1000

    const exerciseSet = new Set<string>()
    workouts.value.forEach(w => {
      w.exercises.forEach(e => exerciseSet.add(e.name))
    })

    for (const exerciseName of exerciseSet) {
      const history = getExerciseHistory(exerciseName)
      if (history.length < 3) continue

      const pr = allPRs.find(p => p.exercise === exerciseName)
      if (!pr) continue

      // Skip exercises trained in the last 3 days — user just did them
      const mostRecentDate = new Date(history[0].date).getTime()
      if ((now - mostRecentDate) < recentCutoffMs) continue

      const prDate = new Date(pr.date).getTime()
      const daysSinceProgress = Math.floor((now - prDate) / (24 * 60 * 60 * 1000))

      if ((now - prDate) > thresholdMs) {
        const recentPerformance = history.find(h => {
          const performedDate = new Date(h.date).getTime()
          return (now - performedDate) < thresholdMs
        })

        if (recentPerformance) {
          stagnantExercises.push({
            exercise: exerciseName,
            lastPR: { weight: pr.weight, reps: pr.reps, date: pr.date },
            daysSinceProgress,
            timesPerformed: history.length,
          })
        }
      }
    }

    return stagnantExercises.sort((a, b) => b.daysSinceProgress - a.daysSinceProgress)
  }

  function getWorkoutDates(): { date: string; count: number }[] {
    const dateMap = new Map<string, number>()

    workouts.value.forEach(w => {
      const d = new Date(w.date)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1)
    })

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  function getDeloadRecommendation(): {
    shouldDeload: boolean
    reason: string
    weeksOfTraining: number
    avgWorkoutsPerWeek: number
    totalVolumeTrend: 'increasing' | 'stable' | 'decreasing'
  } | null {
    if (workouts.value.length < 8) return null

    const now = Date.now()
    const fourWeeksAgo = now - (4 * 7 * 24 * 60 * 60 * 1000)
    const eightWeeksAgo = now - (8 * 7 * 24 * 60 * 60 * 1000)

    const recentWorkouts = workouts.value.filter(w => new Date(w.date).getTime() >= fourWeeksAgo)
    const previousWorkouts = workouts.value.filter(w => {
      const date = new Date(w.date).getTime()
      return date >= eightWeeksAgo && date < fourWeeksAgo
    })

    if (recentWorkouts.length < 4 || previousWorkouts.length < 4) return null

    const recentVolume = recentWorkouts.reduce((sum, w) => sum + (w.volume || 0), 0)
    const previousVolume = previousWorkouts.reduce((sum, w) => sum + (w.volume || 0), 0)
    const volumeChange = previousVolume > 0 ? ((recentVolume - previousVolume) / previousVolume) * 100 : 0

    const weeksOfTraining = Math.ceil((now - new Date(workouts.value[workouts.value.length - 1].date).getTime()) / (7 * 24 * 60 * 60 * 1000))
    const avgWorkoutsPerWeek = workouts.value.length / Math.max(weeksOfTraining, 1)

    let totalVolumeTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (volumeChange > 10) totalVolumeTrend = 'increasing'
    else if (volumeChange < -10) totalVolumeTrend = 'decreasing'

    let consecutiveHighVolumeWeeks = 0
    for (let i = 0; i < 8; i++) {
      const weekStart = now - ((i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = now - (i * 7 * 24 * 60 * 60 * 1000)
      const weekWorkouts = workouts.value.filter(w => {
        const date = new Date(w.date).getTime()
        return date >= weekStart && date < weekEnd
      })
      if (weekWorkouts.length >= 4) {
        consecutiveHighVolumeWeeks++
      } else {
        break
      }
    }

    const stagnantExercises = getStagnantExercises(2)
    const hasStagnation = stagnantExercises.length >= 3

    let shouldDeload = false
    let reason = ''

    if (consecutiveHighVolumeWeeks >= 4) {
      if (totalVolumeTrend === 'decreasing' && hasStagnation) {
        shouldDeload = true
        reason = 'Your volume is dropping and you have several stagnant exercises. A deload week could help you recover and push past plateaus.'
      } else if (consecutiveHighVolumeWeeks >= 6) {
        shouldDeload = true
        reason = `You've been training hard for ${consecutiveHighVolumeWeeks} weeks straight. Consider a lighter week to prevent burnout and optimize gains.`
      }
    }

    return {
      shouldDeload,
      reason,
      weeksOfTraining: consecutiveHighVolumeWeeks,
      avgWorkoutsPerWeek: Math.round(avgWorkoutsPerWeek * 10) / 10,
      totalVolumeTrend,
    }
  }

  function getCardioHistory(exerciseName: string): {
    date: string
    workoutId: string
    workoutName: string
    duration_sec: number
    distance_km?: number
    calories?: number
    pace_sec_per_km?: number
  }[] {
    const history: ReturnType<typeof getCardioHistory> = []

    for (const workout of workouts.value) {
      const exercise = workout.exercises.find(e => e.name === exerciseName)
      if (exercise?.cardio && exercise.cardio.completed) {
        const cardio = exercise.cardio
        history.push({
          date: workout.date,
          workoutId: workout.id,
          workoutName: workout.name,
          duration_sec: cardio.duration_sec,
          distance_km: cardio.distance_km,
          calories: cardio.calories,
          pace_sec_per_km: cardio.distance_km
            ? Math.round(cardio.duration_sec / cardio.distance_km)
            : undefined,
        })
      }
    }

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  function getCardioTotals(days: number = 7): {
    totalDuration: number
    totalDistance: number
    totalCalories: number
    sessionCount: number
  } {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)

    let totalDuration = 0
    let totalDistance = 0
    let totalCalories = 0
    let sessionCount = 0

    workouts.value.forEach(workout => {
      if (new Date(workout.date).getTime() < cutoff) return

      workout.exercises.forEach(exercise => {
        if (exercise.cardio && exercise.cardio.completed) {
          totalDuration += exercise.cardio.duration_sec
          totalDistance += exercise.cardio.distance_km || 0
          totalCalories += exercise.cardio.calories || 0
          sessionCount++
        }
      })
    })

    return { totalDuration, totalDistance, totalCalories, sessionCount }
  }

  function getCardioPRs(): {
    exercise: string
    bestDistance?: { value: number; date: string }
    bestDuration?: { value: number; date: string }
    bestPace?: { value: number; date: string }
  }[] {
    const prMap = new Map<string, {
      exercise: string
      bestDistance?: { value: number; date: string }
      bestDuration?: { value: number; date: string }
      bestPace?: { value: number; date: string }
    }>()

    workouts.value.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!exercise.cardio || !exercise.cardio.completed) return

        const cardio = exercise.cardio
        const existing = prMap.get(exercise.name) || { exercise: exercise.name }

        if (cardio.distance_km) {
          if (!existing.bestDistance || cardio.distance_km > existing.bestDistance.value) {
            existing.bestDistance = { value: cardio.distance_km, date: workout.date }
          }

          const pace = cardio.duration_sec / cardio.distance_km
          if (!existing.bestPace || pace < existing.bestPace.value) {
            existing.bestPace = { value: pace, date: workout.date }
          }
        }

        if (!existing.bestDuration || cardio.duration_sec > existing.bestDuration.value) {
          existing.bestDuration = { value: cardio.duration_sec, date: workout.date }
        }

        prMap.set(exercise.name, existing)
      })
    })

    return Array.from(prMap.values())
  }

  // Initialize on mount
  onMounted(async () => {
    loadWorkouts()
    loadWeeklyGoal()
    // Try to load from Supabase after initial localStorage load
    await loadFromSupabase()
  })

  return {
    workouts: readonly(workouts),
    addWorkout,
    deleteWorkout,
    getWorkout,
    updateRating,
    updateWorkout,
    loadWorkouts,
    loadFromSupabase,
    calculateAllPRs,
    getPRsThisMonth,
    getExercisePR,
    getLastPerformedSets,
    getExerciseHistory,
    calculateDayStreak,
    getStagnantExercises,
    getWorkoutDates,
    getDeloadRecommendation,
    weeklyGoalTarget: readonly(weeklyGoalTarget),
    setWeeklyGoalTarget,
    loadWeeklyGoal,
    getCardioHistory,
    getCardioTotals,
    getCardioPRs,
  }
}
