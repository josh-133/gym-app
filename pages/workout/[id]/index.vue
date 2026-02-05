<script setup lang="ts">
import { NCard, NButton, NTag, NEmpty, NModal } from 'naive-ui'
import { EXERCISE_LIBRARY, type CardioTrackingType } from '~/utils/exercises'
import type { Exercise } from '~/types/database'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()
const workoutId = route.params.id as string
const { getWorkout, loadWorkouts, deleteWorkout } = useWorkoutHistory()
const { convertWeight, weightUnit, formatVolume, unitSystem } = useUnits()
const workoutStore = useWorkoutStore()

// Cardio data interface
interface CardioData {
  duration_sec: number
  distance_km?: number
  calories?: number
  completed: boolean
}

// Workout data from history
interface WorkoutData {
  id: string
  name: string
  status: string
  started_at: string
  completed_at: string | null
  duration_sec: number
  rating: number | null
  perceived_exertion: number | null
  notes: string | null
  exercises: {
    name: string
    category?: string
    sets: {
      set_number: number
      weight: number | null
      reps: number | null
      type: string
      is_pr?: boolean
    }[]
    cardio?: CardioData
  }[]
}

const workout = ref<WorkoutData | null>(null)
const loading = ref(true)
const notFound = ref(false)
const showDeleteModal = ref(false)

// Delete workout handler
function handleDeleteWorkout() {
  deleteWorkout(workoutId)
  router.push('/workout')
}

// Computed stats
const totalSets = computed(() => {
  if (!workout.value) return 0
  return workout.value.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
})

const totalVolume = computed(() => {
  if (!workout.value) return 0
  return workout.value.exercises.reduce((sum, ex) => {
    return sum + ex.sets.reduce((setSum, set) => setSum + ((set.weight || 0) * (set.reps || 0)), 0)
  }, 0)
})

const prsHit = computed(() => {
  if (!workout.value) return 0
  return workout.value.exercises.reduce((sum, ex) => {
    return sum + ex.sets.filter(s => s.is_pr).length
  }, 0)
})

onMounted(async () => {
  loading.value = true

  // Load workouts from localStorage first
  loadWorkouts()

  // Small delay to ensure state is hydrated
  await nextTick()

  if (!workoutId || workoutId === 'undefined') {
    notFound.value = true
    loading.value = false
    return
  }

  // Get the workout from history
  const savedWorkout = getWorkout(workoutId)

  if (savedWorkout) {
    // Convert from SavedWorkout format to display format
    workout.value = {
      id: savedWorkout.id,
      name: savedWorkout.name,
      status: 'completed',
      started_at: savedWorkout.date,
      completed_at: savedWorkout.date,
      duration_sec: savedWorkout.duration,
      rating: savedWorkout.rating,
      perceived_exertion: null,
      notes: savedWorkout.notes,
      exercises: savedWorkout.exercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        sets: ex.sets.map((set, index) => ({
          set_number: index + 1,
          weight: set.weight,
          reps: set.reps,
          type: 'working',
          is_pr: false,
        })),
        cardio: ex.cardio,
      })),
    }
  } else {
    notFound.value = true
  }

  loading.value = false
})

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getRatingStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

// Check if an exercise is a cardio exercise
function isCardioExercise(exerciseName: string): boolean {
  const libraryEx = EXERCISE_LIBRARY.find(e => e.name === exerciseName)
  return libraryEx?.category === 'cardio'
}

// Get the tracking type for a cardio exercise
function getCardioTrackingType(exerciseName: string): CardioTrackingType | undefined {
  const libraryEx = EXERCISE_LIBRARY.find(e => e.name === exerciseName)
  return libraryEx?.trackingType
}

// Format cardio duration (hours:minutes:seconds)
function formatCardioDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format distance based on unit system
function formatDistance(km: number): string {
  if (unitSystem.value === 'imperial') {
    const miles = km * 0.621371
    return `${miles.toFixed(2)} mi`
  }
  return `${km.toFixed(2)} km`
}

// Calculate and format pace
function formatPace(durationSec: number, distanceKm: number): string {
  if (!durationSec || !distanceKm) return '-'

  if (unitSystem.value === 'imperial') {
    const paceSecPerMile = durationSec / (distanceKm * 0.621371)
    const paceMin = Math.floor(paceSecPerMile / 60)
    const paceSec = Math.round(paceSecPerMile % 60)
    return `${paceMin}:${paceSec.toString().padStart(2, '0')} /mi`
  }

  const paceSecPerKm = durationSec / distanceKm
  const paceMin = Math.floor(paceSecPerKm / 60)
  const paceSec = Math.round(paceSecPerKm % 60)
  return `${paceMin}:${paceSec.toString().padStart(2, '0')} /km`
}

function getSetTypeColor(type: string) {
  switch (type) {
    case 'warmup': return 'default'
    case 'working': return 'info'
    case 'dropset': return 'warning'
    case 'failure': return 'error'
    default: return 'default'
  }
}

// Convert exercise name to Exercise type for workout store
function getExerciseFromName(name: string): Exercise | null {
  const libraryEx = EXERCISE_LIBRARY.find(e => e.name === name)
  if (!libraryEx) return null

  return {
    id: libraryEx.id,
    name: libraryEx.name,
    category: libraryEx.category as Exercise['category'],
    muscle_groups: [...libraryEx.muscleGroups] as Exercise['muscle_groups'],
    equipment: [...libraryEx.equipment] as Exercise['equipment'],
    is_compound: libraryEx.isCompound,
    is_system: true,
    user_id: null,
    description: null,
    difficulty: libraryEx.difficulty as Exercise['difficulty'],
    instructions: [],
    video_url: null,
    image_url: null,
    created_at: '',
  }
}

// Repeat this workout with the same exercises
function repeatWorkout() {
  if (!workout.value) return

  // Start a new workout with the same name
  workoutStore.startWorkout(workout.value.name)

  // Add all exercises with the same number of sets
  workout.value.exercises.forEach(ex => {
    const exercise = getExerciseFromName(ex.name)
    if (exercise) {
      workoutStore.addExercise(exercise)
      const exerciseIndex = workoutStore.exerciseLogs.length - 1

      // Add the same number of sets
      for (let i = 0; i < ex.sets.length; i++) {
        workoutStore.addSet(exerciseIndex)
      }
    }
  })

  // Navigate to the active workout page
  router.push('/workout/new')
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <!-- Not Found State -->
    <NCard v-else-if="notFound" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Workout Not Found</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4">The workout you're looking for doesn't exist or has been removed.</p>
      <NuxtLink to="/workout">
        <NButton type="primary">View All Workouts</NButton>
      </NuxtLink>
    </NCard>

    <!-- Workout Content -->
    <template v-else-if="workout">
      <!-- Header -->
      <div>
        <NuxtLink to="/workout" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block">
          ← Back to workouts
        </NuxtLink>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ workout.name }}</h1>
            <p class="text-gray-500 dark:text-gray-400">
              {{ formatDate(workout.started_at) }} at {{ formatTime(workout.started_at) }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div v-if="workout.rating" class="flex items-center gap-2">
              <span class="text-yellow-500 text-lg">{{ getRatingStars(workout.rating) }}</span>
            </div>
            <NButton type="primary" @click="repeatWorkout">
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </template>
              Repeat
            </NButton>
            <NuxtLink :to="`/workout/${workoutId}/edit`">
              <NButton>
                <template #icon>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </template>
                Edit
              </NButton>
            </NuxtLink>
            <NButton type="error" quaternary @click="showDeleteModal = true">
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </template>
            </NButton>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <NCard class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatDuration(workout.duration_sec) }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Duration</p>
        </NCard>
        <NCard class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ workout.exercises.length }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Exercises</p>
        </NCard>
        <NCard class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalSets }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Sets</p>
        </NCard>
        <NCard class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatVolume(totalVolume) }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Volume</p>
        </NCard>
      </div>

      <!-- PRs Banner -->
      <NCard v-if="prsHit > 0" class="!bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🏆</span>
          <div>
            <p class="font-semibold text-yellow-800 dark:text-yellow-200">
              {{ prsHit }} Personal Record{{ prsHit > 1 ? 's' : '' }} Hit!
            </p>
            <p class="text-sm text-yellow-700 dark:text-yellow-300">Great job pushing your limits</p>
          </div>
        </div>
      </NCard>

      <!-- Notes -->
      <NCard v-if="workout.notes" title="Notes">
        <p class="text-gray-600 dark:text-gray-300">{{ workout.notes }}</p>
      </NCard>

      <!-- Exercises -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Exercises</h2>

        <NCard v-for="(exercise, index) in workout.exercises" :key="index">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ index + 1 }}</span>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ exercise.name }}</h3>
                <NTag v-if="isCardioExercise(exercise.name)" size="tiny" type="success">Cardio</NTag>
              </div>
            </div>
          </template>

          <!-- Cardio Display -->
          <div v-if="exercise.cardio && exercise.cardio.completed" class="space-y-4">
            <!-- Reps-based cardio (box jumps, burpees, etc.) -->
            <div v-if="getCardioTrackingType(exercise.name) === 'reps'" class="grid grid-cols-1 gap-4">
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ exercise.cardio.duration_sec }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Reps</p>
              </div>
            </div>

            <!-- Duration + Distance cardio (running, cycling, etc.) -->
            <div v-else-if="getCardioTrackingType(exercise.name) === 'duration_distance'" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCardioDuration(exercise.cardio.duration_sec) }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Duration</p>
              </div>
              <div v-if="exercise.cardio.distance_km" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatDistance(exercise.cardio.distance_km) }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Distance</p>
              </div>
              <div v-if="exercise.cardio.distance_km" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatPace(exercise.cardio.duration_sec, exercise.cardio.distance_km) }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Pace</p>
              </div>
              <div v-if="exercise.cardio.calories" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ exercise.cardio.calories }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Calories</p>
              </div>
            </div>

            <!-- Duration-only cardio (stair climber, jump rope, etc.) -->
            <div v-else class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCardioDuration(exercise.cardio.duration_sec) }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Duration</p>
              </div>
              <div v-if="exercise.cardio.calories" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ exercise.cardio.calories }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Calories</p>
              </div>
            </div>
          </div>

          <!-- Strength Sets Table -->
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left text-sm text-gray-500 dark:text-gray-400">
                  <th class="pb-2 font-medium">Set</th>
                  <th class="pb-2 font-medium">Type</th>
                  <th class="pb-2 font-medium">Weight</th>
                  <th class="pb-2 font-medium">Reps</th>
                  <th class="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="set in exercise.sets"
                  :key="set.set_number"
                  class="border-t border-gray-100 dark:border-gray-700"
                >
                  <td class="py-2 font-medium text-gray-900 dark:text-white">{{ set.set_number }}</td>
                  <td class="py-2">
                    <NTag :type="getSetTypeColor(set.type)" size="small">{{ set.type }}</NTag>
                  </td>
                  <td class="py-2 text-gray-900 dark:text-white">{{ convertWeight(set.weight) }} {{ weightUnit }}</td>
                  <td class="py-2 text-gray-900 dark:text-white">{{ set.reps }}</td>
                  <td class="py-2">
                    <span v-if="set.is_pr" class="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      PR
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </NCard>
      </div>
    </template>

    <!-- Delete Confirmation Modal -->
    <NModal
      v-model:show="showDeleteModal"
      preset="card"
      title="Delete Workout"
      :style="{ width: '90%', maxWidth: '400px' }"
    >
      <div class="text-center py-4">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg class="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete this workout?</h3>
        <p class="text-gray-500 dark:text-gray-400">
          This will permanently delete "{{ workout?.name }}" and all its data. This action cannot be undone.
        </p>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showDeleteModal = false">
            Cancel
          </NButton>
          <NButton type="error" class="flex-1" @click="handleDeleteWorkout">
            Delete
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
