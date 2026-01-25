interface SavedWorkout {
  id: string
  name: string
  date: string
  duration: number // in seconds
  exercises: {
    name: string
    sets: {
      weight: number | null
      reps: number | null
      completed: boolean
    }[]
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
      workouts.value[index] = { ...workouts.value[index], ...updates }
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
    // Streak
    calculateDayStreak,
    // Weekly goal
    weeklyGoalTarget: readonly(weeklyGoalTarget),
    setWeeklyGoalTarget,
    loadWeeklyGoal,
  }
}
