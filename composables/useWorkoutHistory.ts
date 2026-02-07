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
    }[]
    cardio?: CardioData
  }[]
  volume: number
  rating: number | null
  notes: string | null
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
  const workouts = useState<SavedWorkout[]>('workoutHistory', () => [])

  // Load workouts from localStorage on initialization
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

  // Save workouts to localStorage
  function saveWorkouts() {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts.value))
    }
  }

  // Add a completed workout
  function addWorkout(workout: SavedWorkout) {
    workouts.value.unshift(workout) // Add to beginning (most recent first)
    saveWorkouts()
  }

  // Delete a workout
  function deleteWorkout(id: string) {
    workouts.value = workouts.value.filter(w => w.id !== id)
    saveWorkouts()
  }

  // Get a specific workout by ID
  function getWorkout(id: string): SavedWorkout | undefined {
    return workouts.value.find(w => w.id === id)
  }

  // Update workout rating
  function updateRating(id: string, rating: number) {
    const workout = workouts.value.find(w => w.id === id)
    if (workout) {
      workout.rating = rating
      saveWorkouts()
    }
  }

  // Update an entire workout
  function updateWorkout(id: string, updates: Partial<Omit<SavedWorkout, 'id'>>) {
    const index = workouts.value.findIndex(w => w.id === id)
    if (index !== -1) {
      workouts.value.splice(index, 1, { ...workouts.value[index], ...updates })
      saveWorkouts()
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
  // A PR is the best weight×reps combination for each exercise
  function calculateAllPRs(): PersonalRecord[] {
    const prMap = new Map<string, PersonalRecord>()

    // Sort workouts by date (oldest first) so we track when PRs were set
    const sortedWorkouts = [...workouts.value].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    for (const workout of sortedWorkouts) {
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (set.completed && set.weight && set.reps && set.weight > 0 && set.reps > 0) {
            const key = exercise.name
            const existing = prMap.get(key)

            // Calculate "strength score" (weight × reps) for comparison
            const newScore = set.weight * set.reps
            const existingScore = existing ? existing.weight * existing.reps : 0

            // New PR if higher score, or same score but more weight (stronger lift)
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

  // Get PRs achieved in the current month
  function getPRsThisMonth(): PersonalRecord[] {
    const allPRs = calculateAllPRs()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return allPRs.filter(pr => new Date(pr.date) >= startOfMonth)
  }

  // Get PR for a specific exercise
  function getExercisePR(exerciseName: string): PersonalRecord | null {
    const allPRs = calculateAllPRs()
    return allPRs.find(pr => pr.exercise === exerciseName) || null
  }

  // Get the last performed sets for an exercise (from the most recent workout containing it)
  function getLastPerformedSets(exerciseName: string): { weight: number | null; reps: number | null }[] {
    // Find the most recent workout containing this exercise
    for (const workout of workouts.value) {
      const exercise = workout.exercises.find(e => e.name === exerciseName)
      if (exercise && exercise.sets.length > 0) {
        // Return only completed sets with valid data
        return exercise.sets
          .filter(s => s.completed && (s.reps !== null || s.weight !== null))
          .map(s => ({
            weight: s.weight,
            reps: s.reps,
          }))
      }
    }
    return []
  }

  // Get exercise history (all occurrences of an exercise across workouts)
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

        // Find best set (highest weight × reps)
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

  // Calculate current day streak (consecutive days with workouts)
  function calculateDayStreak(): number {
    if (workouts.value.length === 0) return 0

    // Get unique workout dates, sorted from most recent to oldest
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

    // Streak only counts if most recent workout is today or yesterday
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

  // Get exercises that haven't progressed in the last N weeks
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

    // Get all unique exercises performed
    const exerciseSet = new Set<string>()
    workouts.value.forEach(w => {
      w.exercises.forEach(e => exerciseSet.add(e.name))
    })

    for (const exerciseName of exerciseSet) {
      const history = getExerciseHistory(exerciseName)

      // Only consider exercises performed at least 3 times
      if (history.length < 3) continue

      const pr = allPRs.find(p => p.exercise === exerciseName)
      if (!pr) continue

      const prDate = new Date(pr.date).getTime()
      const daysSinceProgress = Math.floor((now - prDate) / (24 * 60 * 60 * 1000))

      // Check if PR is older than threshold
      if ((now - prDate) > thresholdMs) {
        // Check if they've done this exercise recently (within threshold)
        const recentPerformance = history.find(h => {
          const performedDate = new Date(h.date).getTime()
          return (now - performedDate) < thresholdMs
        })

        // Only flag if they're still doing the exercise but not progressing
        if (recentPerformance) {
          stagnantExercises.push({
            exercise: exerciseName,
            lastPR: {
              weight: pr.weight,
              reps: pr.reps,
              date: pr.date,
            },
            daysSinceProgress,
            timesPerformed: history.length,
          })
        }
      }
    }

    // Sort by days since progress (longest first)
    return stagnantExercises.sort((a, b) => b.daysSinceProgress - a.daysSinceProgress)
  }

  // Get all workout dates for calendar visualization
  function getWorkoutDates(): { date: string; count: number }[] {
    const dateMap = new Map<string, number>()

    workouts.value.forEach(w => {
      const dateStr = new Date(w.date).toISOString().split('T')[0]
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1)
    })

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // Analyze training load and recommend deload if needed
  function getDeloadRecommendation(): {
    shouldDeload: boolean
    reason: string
    weeksOfTraining: number
    avgWorkoutsPerWeek: number
    totalVolumeTrend: 'increasing' | 'stable' | 'decreasing'
  } | null {
    if (workouts.value.length < 8) {
      return null // Not enough data
    }

    const now = Date.now()
    const fourWeeksAgo = now - (4 * 7 * 24 * 60 * 60 * 1000)
    const eightWeeksAgo = now - (8 * 7 * 24 * 60 * 60 * 1000)

    // Get workouts from the last 4 weeks and the 4 weeks before that
    const recentWorkouts = workouts.value.filter(w => new Date(w.date).getTime() >= fourWeeksAgo)
    const previousWorkouts = workouts.value.filter(w => {
      const date = new Date(w.date).getTime()
      return date >= eightWeeksAgo && date < fourWeeksAgo
    })

    if (recentWorkouts.length < 4 || previousWorkouts.length < 4) {
      return null // Not enough consistent training
    }

    // Calculate metrics
    const recentVolume = recentWorkouts.reduce((sum, w) => sum + (w.volume || 0), 0)
    const previousVolume = previousWorkouts.reduce((sum, w) => sum + (w.volume || 0), 0)
    const volumeChange = previousVolume > 0 ? ((recentVolume - previousVolume) / previousVolume) * 100 : 0

    const weeksOfTraining = Math.ceil((now - new Date(workouts.value[workouts.value.length - 1].date).getTime()) / (7 * 24 * 60 * 60 * 1000))
    const avgWorkoutsPerWeek = workouts.value.length / Math.max(weeksOfTraining, 1)

    // Determine volume trend
    let totalVolumeTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (volumeChange > 10) totalVolumeTrend = 'increasing'
    else if (volumeChange < -10) totalVolumeTrend = 'decreasing'

    // Count consecutive weeks with 4+ workouts
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

    // Recommend deload if:
    // 1. Training consistently (4+ sessions/week) for 4+ weeks
    // 2. Volume is decreasing (sign of fatigue)
    // 3. No recent PRs (stagnation)
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

  // Get cardio exercise history
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

  // Get cardio totals for a given period (defaults to last 7 days)
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

  // Get cardio personal bests
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

        // Best distance
        if (cardio.distance_km) {
          if (!existing.bestDistance || cardio.distance_km > existing.bestDistance.value) {
            existing.bestDistance = { value: cardio.distance_km, date: workout.date }
          }

          // Best pace (lowest is better)
          const pace = cardio.duration_sec / cardio.distance_km
          if (!existing.bestPace || pace < existing.bestPace.value) {
            existing.bestPace = { value: pace, date: workout.date }
          }
        }

        // Best duration (longest)
        if (!existing.bestDuration || cardio.duration_sec > existing.bestDuration.value) {
          existing.bestDuration = { value: cardio.duration_sec, date: workout.date }
        }

        prMap.set(exercise.name, existing)
      })
    })

    return Array.from(prMap.values())
  }

  // Initialize on mount
  onMounted(() => {
    loadWorkouts()
    loadWeeklyGoal()
  })

  return {
    workouts: readonly(workouts),
    addWorkout,
    deleteWorkout,
    getWorkout,
    updateRating,
    updateWorkout,
    loadWorkouts,
    // PR functions
    calculateAllPRs,
    getPRsThisMonth,
    getExercisePR,
    // Exercise history
    getLastPerformedSets,
    getExerciseHistory,
    // Streak
    calculateDayStreak,
    // Progressive overload
    getStagnantExercises,
    // Calendar data
    getWorkoutDates,
    // Deload recommendation
    getDeloadRecommendation,
    // Weekly goal
    weeklyGoalTarget: readonly(weeklyGoalTarget),
    setWeeklyGoalTarget,
    loadWeeklyGoal,
    // Cardio functions
    getCardioHistory,
    getCardioTotals,
    getCardioPRs,
  }
}
