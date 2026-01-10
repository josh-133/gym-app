<script setup lang="ts">
import { NCard, NButton, NTag, NEmpty } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const workoutId = route.params.id as string

// Mock workout data - in real app, fetch from Supabase
const workout = ref({
  id: workoutId,
  name: 'Push Day',
  status: 'completed',
  started_at: '2024-01-09T09:00:00Z',
  completed_at: '2024-01-09T10:05:00Z',
  duration_sec: 3900,
  rating: 4,
  perceived_exertion: 7,
  notes: 'Felt strong today. Hit a new PR on bench press!',
  exercises: [
    {
      name: 'Bench Press',
      sets: [
        { set_number: 1, weight: 60, reps: 10, type: 'warmup' },
        { set_number: 2, weight: 80, reps: 8, type: 'warmup' },
        { set_number: 3, weight: 95, reps: 5, type: 'working' },
        { set_number: 4, weight: 100, reps: 5, type: 'working', is_pr: true },
        { set_number: 5, weight: 100, reps: 4, type: 'working' },
      ],
    },
    {
      name: 'Incline Dumbbell Press',
      sets: [
        { set_number: 1, weight: 30, reps: 10, type: 'working' },
        { set_number: 2, weight: 32.5, reps: 9, type: 'working' },
        { set_number: 3, weight: 32.5, reps: 8, type: 'working' },
      ],
    },
    {
      name: 'Cable Fly',
      sets: [
        { set_number: 1, weight: 15, reps: 12, type: 'working' },
        { set_number: 2, weight: 15, reps: 12, type: 'working' },
        { set_number: 3, weight: 15, reps: 10, type: 'working' },
      ],
    },
    {
      name: 'Overhead Press',
      sets: [
        { set_number: 1, weight: 40, reps: 10, type: 'working' },
        { set_number: 2, weight: 45, reps: 8, type: 'working' },
        { set_number: 3, weight: 45, reps: 7, type: 'working' },
      ],
    },
    {
      name: 'Lateral Raise',
      sets: [
        { set_number: 1, weight: 10, reps: 15, type: 'working' },
        { set_number: 2, weight: 10, reps: 14, type: 'working' },
        { set_number: 3, weight: 10, reps: 12, type: 'working' },
      ],
    },
    {
      name: 'Tricep Pushdown',
      sets: [
        { set_number: 1, weight: 25, reps: 12, type: 'working' },
        { set_number: 2, weight: 27.5, reps: 10, type: 'working' },
        { set_number: 3, weight: 27.5, reps: 10, type: 'working' },
      ],
    },
  ],
})

const loading = ref(false)
const notFound = ref(false)

// Computed stats
const totalSets = computed(() => {
  return workout.value.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
})

const totalVolume = computed(() => {
  return workout.value.exercises.reduce((sum, ex) => {
    return sum + ex.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0)
  }, 0)
})

const prsHit = computed(() => {
  return workout.value.exercises.reduce((sum, ex) => {
    return sum + ex.sets.filter(s => s.is_pr).length
  }, 0)
})

onMounted(async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  loading.value = false

  if (!workoutId || workoutId === 'undefined') {
    notFound.value = true
  }
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

function getSetTypeColor(type: string) {
  switch (type) {
    case 'warmup': return 'default'
    case 'working': return 'info'
    case 'dropset': return 'warning'
    case 'failure': return 'error'
    default: return 'default'
  }
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
    <template v-else>
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
          <div class="flex items-center gap-2">
            <span class="text-yellow-500 text-lg">{{ getRatingStars(workout.rating) }}</span>
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
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ (totalVolume / 1000).toFixed(1) }}k</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Volume (kg)</p>
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
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ exercise.name }}</h3>
            </div>
          </template>

          <!-- Sets Table -->
          <div class="overflow-x-auto">
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
                  <td class="py-2 text-gray-900 dark:text-white">{{ set.weight }} kg</td>
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
  </div>
</template>
