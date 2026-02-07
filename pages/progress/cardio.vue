<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { EXERCISE_LIBRARY } from '~/utils/exercises'

definePageMeta({
  middleware: ['auth'],
})

const { workouts, loadWorkouts, getCardioHistory, getCardioTotals, getCardioPRs } = useWorkoutHistory()
const { unitSystem } = useUnits()

// Ensure workouts are loaded
onMounted(() => {
  loadWorkouts()
})

const timeRange = ref('3months')
const timeRangeOptions = [
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'Last Year', value: '1year' },
  { label: 'All Time', value: 'all' },
]

// Get days for time range
const timeRangeDays = computed(() => {
  switch (timeRange.value) {
    case '30days': return 30
    case '3months': return 90
    case '6months': return 180
    case '1year': return 365
    default: return 9999 // All time
  }
})

// Get all unique cardio exercises from workout history
const cardioExerciseOptions = computed(() => {
  const exercises = new Set<string>()
  workouts.value.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (ex.cardio && ex.cardio.completed) {
        exercises.add(ex.name)
      }
    })
  })
  return Array.from(exercises).map(name => ({
    label: name,
    value: name,
  }))
})

const selectedExercise = ref('')

// Auto-select first exercise when available
watch(cardioExerciseOptions, (options) => {
  if (options.length > 0 && !selectedExercise.value) {
    selectedExercise.value = options[0].value
  }
}, { immediate: true })

// Filter workouts by time range
const filteredWorkouts = computed(() => {
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - timeRangeDays.value * 24 * 60 * 60 * 1000)
  return workouts.value.filter(w => new Date(w.date) >= cutoffDate)
})

// Check if there's any cardio data
const hasCardioData = computed(() => {
  return workouts.value.some(w =>
    w.exercises.some(ex => ex.cardio && ex.cardio.completed)
  )
})

// Summary stats for the selected time range
const summaryStats = computed(() => {
  let totalDuration = 0
  let totalDistance = 0
  let totalCalories = 0
  let sessionCount = 0

  filteredWorkouts.value.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (ex.cardio && ex.cardio.completed) {
        totalDuration += ex.cardio.duration_sec
        totalDistance += ex.cardio.distance_km || 0
        totalCalories += ex.cardio.calories || 0
        sessionCount++
      }
    })
  })

  return { totalDuration, totalDistance, totalCalories, sessionCount }
})

// Get exercise history for selected exercise within time range
const exerciseProgress = computed(() => {
  if (!selectedExercise.value) return []

  const history: Array<{
    date: string
    duration_sec: number
    distance_km: number | null
    calories: number | null
    pace_sec_per_km: number | null
  }> = []

  filteredWorkouts.value.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (ex.name === selectedExercise.value && ex.cardio && ex.cardio.completed) {
        const pace = ex.cardio.distance_km && ex.cardio.distance_km > 0
          ? ex.cardio.duration_sec / ex.cardio.distance_km
          : null

        history.push({
          date: workout.date,
          duration_sec: ex.cardio.duration_sec,
          distance_km: ex.cardio.distance_km || null,
          calories: ex.cardio.calories || null,
          pace_sec_per_km: pace,
        })
      }
    })
  })

  // Sort by date ascending
  history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return history
})

// Check if selected exercise tracks distance
const exerciseTracksDistance = computed(() => {
  const libraryEx = EXERCISE_LIBRARY.find(e => e.name === selectedExercise.value)
  return libraryEx?.trackingType === 'duration_distance'
})

// Calculate PRs for each cardio exercise
const cardioPRs = computed(() => {
  const prMap = new Map<string, {
    exercise: string
    bestDistance?: { value: number; date: string }
    bestDuration?: { value: number; date: string }
    bestPace?: { value: number; date: string }
  }>()

  workouts.value.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (!ex.cardio || !ex.cardio.completed) return

      const existing = prMap.get(ex.name) || { exercise: ex.name }

      // Best distance
      if (ex.cardio.distance_km) {
        if (!existing.bestDistance || ex.cardio.distance_km > existing.bestDistance.value) {
          existing.bestDistance = { value: ex.cardio.distance_km, date: workout.date }
        }

        // Best pace (lowest is better)
        const pace = ex.cardio.duration_sec / ex.cardio.distance_km
        if (!existing.bestPace || pace < existing.bestPace.value) {
          existing.bestPace = { value: pace, date: workout.date }
        }
      }

      // Best duration (longest)
      if (!existing.bestDuration || ex.cardio.duration_sec > existing.bestDuration.value) {
        existing.bestDuration = { value: ex.cardio.duration_sec, date: workout.date }
      }

      prMap.set(ex.name, existing)
    })
  })

  return Array.from(prMap.values())
})

// Weekly cardio summary (last 4 weeks)
const weeklyCardioTrend = computed(() => {
  const weeks: Record<string, { distance: number; duration: number; calories: number; sessions: number }> = {}

  filteredWorkouts.value.forEach(workout => {
    const date = new Date(workout.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!weeks[weekKey]) {
      weeks[weekKey] = { distance: 0, duration: 0, calories: 0, sessions: 0 }
    }

    workout.exercises.forEach(ex => {
      if (ex.cardio && ex.cardio.completed) {
        weeks[weekKey].distance += ex.cardio.distance_km || 0
        weeks[weekKey].duration += ex.cardio.duration_sec
        weeks[weekKey].calories += ex.cardio.calories || 0
        weeks[weekKey].sessions++
      }
    })
  })

  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-4)
    .map(([weekKey, data], index) => ({
      week: `Week ${index + 1}`,
      ...data,
    }))
})

// Exercise breakdown (by type)
const exerciseBreakdown = computed(() => {
  const breakdown: Record<string, number> = {}

  filteredWorkouts.value.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (ex.cardio && ex.cardio.completed) {
        breakdown[ex.name] = (breakdown[ex.name] || 0) + ex.cardio.duration_sec
      }
    })
  })

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0)

  return Object.entries(breakdown)
    .map(([name, duration]) => ({
      name,
      duration,
      percentage: total > 0 ? Math.round((duration / total) * 100) : 0,
    }))
    .sort((a, b) => b.duration - a.duration)
})

// Computed values for charts
const maxPace = computed(() => {
  const paces = exerciseProgress.value.filter(p => p.pace_sec_per_km).map(p => p.pace_sec_per_km!)
  return paces.length ? Math.max(...paces) : 600 // Default 10min/km
})

const minPace = computed(() => {
  const paces = exerciseProgress.value.filter(p => p.pace_sec_per_km).map(p => p.pace_sec_per_km!)
  return paces.length ? Math.min(...paces) : 0
})

const maxDistance = computed(() => {
  const distances = exerciseProgress.value.filter(p => p.distance_km).map(p => p.distance_km!)
  return distances.length ? Math.max(...distances) : 10
})

const maxWeeklyValue = computed(() => {
  let max = 1
  weeklyCardioTrend.value.forEach(w => {
    max = Math.max(max, w.duration / 60) // Convert to minutes for display
  })
  return max * 1.2
})

// Formatting helpers
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

function formatDurationLong(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDistance(km: number): string {
  if (unitSystem.value === 'imperial') {
    const miles = km * 0.621371
    return `${miles.toFixed(2)} mi`
  }
  return `${km.toFixed(2)} km`
}

function formatDistanceValue(km: number): number {
  if (unitSystem.value === 'imperial') {
    return Math.round(km * 0.621371 * 100) / 100
  }
  return Math.round(km * 100) / 100
}

function formatPace(paceSecPerKm: number): string {
  if (unitSystem.value === 'imperial') {
    const paceSecPerMile = paceSecPerKm * 1.60934
    const mins = Math.floor(paceSecPerMile / 60)
    const secs = Math.round(paceSecPerMile % 60)
    return `${mins}:${secs.toString().padStart(2, '0')} /mi`
  }
  const mins = Math.floor(paceSecPerKm / 60)
  const secs = Math.round(paceSecPerKm % 60)
  return `${mins}:${secs.toString().padStart(2, '0')} /km`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getPacePercentage(pace: number): number {
  // Invert: lower pace = higher on chart
  const range = maxPace.value - minPace.value
  if (range === 0) return 50
  return ((maxPace.value - pace) / range) * 80 + 10 // 10-90% range
}

function getDistancePercentage(distance: number): number {
  if (maxDistance.value === 0) return 0
  return (distance / maxDistance.value) * 100
}

const distanceUnit = computed(() => unitSystem.value === 'imperial' ? 'mi' : 'km')
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <NuxtLink to="/progress" class="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-900 dark:hover:text-white mb-2 inline-flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Progress
        </NuxtLink>
        <h1 class="text-2xl font-bold text-primary-900 dark:text-white">Cardio Analytics</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Track your cardio performance and trends</p>
      </div>
      <NSelect
        v-model:value="timeRange"
        :options="timeRangeOptions"
        class="w-[140px] sm:w-[160px] !rounded-xl"
      />
    </div>

    <!-- No Data State -->
    <div v-if="!hasCardioData" class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-energy-500 to-accent-500 flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Cardio Data Yet</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Complete some cardio workouts to see your analytics here. Track runs, walks, cycling, and more!
      </p>
      <NuxtLink to="/workout/new" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-white text-white dark:text-primary-900 rounded-xl font-medium hover:opacity-90 transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Start a Workout
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Distance</p>
          <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ formatDistanceValue(summaryStats.totalDistance) }}</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">{{ distanceUnit }}</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Time</p>
          <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ formatDuration(summaryStats.totalDuration) }}</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">this period</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Calories Burned</p>
          <p class="text-3xl font-bold text-accent-500">{{ summaryStats.totalCalories.toLocaleString() }}</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">kcal</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Sessions</p>
          <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ summaryStats.sessionCount }}</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">cardio workouts</p>
        </div>
      </div>

      <!-- Pace Progress Chart (only for distance-tracking exercises) -->
      <div v-if="exerciseTracksDistance && exerciseProgress.some(p => p.pace_sec_per_km)" class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pace Progress</h3>
          <NSelect
            v-model:value="selectedExercise"
            :options="cardioExerciseOptions"
            class="w-[140px] sm:w-[180px]"
            size="small"
            :disabled="cardioExerciseOptions.length === 0"
          />
        </div>

        <div v-if="exerciseProgress.filter(p => p.pace_sec_per_km).length === 0" class="py-12 text-center text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p>No pace data for this exercise yet</p>
        </div>

        <div v-else class="relative">
          <!-- Y-axis labels (pace - lower is better, so inverted) -->
          <div class="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{{ formatPace(minPace) }}</span>
            <span>{{ formatPace((minPace + maxPace) / 2) }}</span>
            <span>{{ formatPace(maxPace) }}</span>
          </div>

          <!-- Chart -->
          <div class="ml-20 h-64 relative">
            <!-- Grid lines -->
            <div class="absolute inset-0 flex flex-col justify-between">
              <div class="border-b border-gray-100 dark:border-gray-800"></div>
              <div class="border-b border-gray-100 dark:border-gray-800"></div>
              <div class="border-b border-gray-200 dark:border-gray-700"></div>
            </div>

            <!-- Data points and line -->
            <svg class="absolute inset-0 w-full h-full overflow-visible">
              <defs>
                <linearGradient id="paceFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color: rgb(34, 197, 94); stop-opacity: 0.15" />
                  <stop offset="100%" style="stop-color: rgb(34, 197, 94); stop-opacity: 0" />
                </linearGradient>
              </defs>

              <!-- Line -->
              <polyline
                :points="exerciseProgress.filter(p => p.pace_sec_per_km).map((p, i, arr) => `${(i / Math.max(arr.length - 1, 1)) * 100}%,${getPacePercentage(p.pace_sec_per_km!)}%`).join(' ')"
                fill="none"
                stroke="#22c55e"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data points -->
              <g v-for="(point, i) in exerciseProgress.filter(p => p.pace_sec_per_km)" :key="i">
                <circle
                  :cx="`${(i / Math.max(exerciseProgress.filter(p => p.pace_sec_per_km).length - 1, 1)) * 100}%`"
                  :cy="`${getPacePercentage(point.pace_sec_per_km!)}%`"
                  r="4"
                  fill="white"
                  stroke="#22c55e"
                  stroke-width="2"
                  class="cursor-pointer"
                />
              </g>
            </svg>
          </div>

          <!-- X-axis labels -->
          <div class="ml-20 flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
            <span v-for="(point, i) in exerciseProgress.filter(p => p.pace_sec_per_km).filter((_, idx, arr) => idx % Math.max(1, Math.floor(arr.length / 5)) === 0)" :key="i">
              {{ formatDate(point.date) }}
            </span>
          </div>
        </div>

        <p class="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">Lower pace = faster. Chart shows improvement over time.</p>
      </div>

      <!-- Distance Progress Chart -->
      <div v-if="exerciseTracksDistance && exerciseProgress.some(p => p.distance_km)" class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Distance Progress</h3>
          <NSelect
            v-if="!exerciseProgress.some(p => p.pace_sec_per_km)"
            v-model:value="selectedExercise"
            :options="cardioExerciseOptions"
            class="w-[140px] sm:w-[180px]"
            size="small"
          />
        </div>

        <div class="relative">
          <!-- Y-axis labels -->
          <div class="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{{ formatDistanceValue(maxDistance) }}{{ distanceUnit }}</span>
            <span>{{ formatDistanceValue(maxDistance / 2) }}{{ distanceUnit }}</span>
            <span>0</span>
          </div>

          <!-- Chart -->
          <div class="ml-14 h-48 relative flex items-end gap-2">
            <div
              v-for="(point, i) in exerciseProgress.filter(p => p.distance_km)"
              :key="i"
              class="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              :style="{ height: `${getDistancePercentage(point.distance_km!)}%` }"
              :title="`${formatDistance(point.distance_km!)} - ${formatDate(point.date)}`"
            ></div>
          </div>

          <!-- X-axis labels -->
          <div class="ml-14 flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
            <span v-for="(point, i) in exerciseProgress.filter(p => p.distance_km).filter((_, idx, arr) => idx % Math.max(1, Math.floor(arr.length / 5)) === 0)" :key="i">
              {{ formatDate(point.date) }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Cardio PRs -->
        <div class="card p-6">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">Personal Records</h3>
          <div v-if="cardioPRs.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
            No cardio PRs yet
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="pr in cardioPRs.slice(0, 5)"
              :key="pr.exercise"
              class="p-4 rounded-xl bg-gray-50 dark:bg-[#222222] border border-gray-100 dark:border-gray-700"
            >
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 class="font-semibold text-primary-900 dark:text-white">{{ pr.exercise }}</h4>
              </div>
              <div class="grid grid-cols-3 gap-2 text-sm">
                <div v-if="pr.bestDistance">
                  <p class="text-gray-500 dark:text-gray-400">Best Distance</p>
                  <p class="font-semibold text-primary-900 dark:text-white">{{ formatDistance(pr.bestDistance.value) }}</p>
                  <p class="text-xs text-gray-400">{{ formatDateLong(pr.bestDistance.date) }}</p>
                </div>
                <div v-if="pr.bestDuration">
                  <p class="text-gray-500 dark:text-gray-400">Best Duration</p>
                  <p class="font-semibold text-primary-900 dark:text-white">{{ formatDurationLong(pr.bestDuration.value) }}</p>
                  <p class="text-xs text-gray-400">{{ formatDateLong(pr.bestDuration.date) }}</p>
                </div>
                <div v-if="pr.bestPace">
                  <p class="text-gray-500 dark:text-gray-400">Best Pace</p>
                  <p class="font-semibold text-primary-900 dark:text-white">{{ formatPace(pr.bestPace.value) }}</p>
                  <p class="text-xs text-gray-400">{{ formatDateLong(pr.bestPace.date) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Exercise Breakdown -->
        <div class="card p-6">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">Activity Breakdown</h3>
          <div v-if="exerciseBreakdown.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
            No activity data yet
          </div>
          <div v-else class="space-y-4">
            <div v-for="activity in exerciseBreakdown" :key="activity.name">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-primary-900 dark:text-white">{{ activity.name }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ activity.percentage }}%</span>
              </div>
              <div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  :style="{ width: `${activity.percentage}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatDuration(activity.duration) }} total</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Cardio Trend -->
      <div v-if="weeklyCardioTrend.length > 0" class="card p-6">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">Weekly Cardio Trend</h3>

        <div class="flex gap-6 mb-6">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Duration (min)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Sessions</span>
          </div>
        </div>

        <div class="grid gap-6" :class="{
          'grid-cols-1': weeklyCardioTrend.length === 1,
          'grid-cols-2': weeklyCardioTrend.length === 2,
          'grid-cols-3': weeklyCardioTrend.length === 3,
          'grid-cols-4': weeklyCardioTrend.length >= 4,
        }">
          <div v-for="week in weeklyCardioTrend" :key="week.week" class="text-center">
            <div class="h-40 flex items-end justify-center gap-2">
              <div
                class="w-8 bg-blue-500 rounded-t transition-all"
                :style="{ height: `${Math.min((week.duration / 60 / maxWeeklyValue) * 100, 100)}%` }"
                :title="`${formatDuration(week.duration)}`"
              ></div>
              <div
                class="w-8 bg-green-500 rounded-t transition-all"
                :style="{ height: `${Math.min((week.sessions / 10) * 100, 100)}%` }"
                :title="`${week.sessions} sessions`"
              ></div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">{{ week.week }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatDuration(week.duration) }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
