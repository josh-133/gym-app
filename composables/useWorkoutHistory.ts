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

const STORAGE_KEY = 'gym-app-workout-history'

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

  // Initialize on mount
  onMounted(() => {
    loadWorkouts()
  })

  return {
    workouts: readonly(workouts),
    addWorkout,
    deleteWorkout,
    getWorkout,
    updateRating,
    loadWorkouts,
  }
}
