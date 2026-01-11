<script setup lang="ts">
import { NSelect } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const { workouts, loadWorkouts } = useWorkoutHistory()

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

// Get all unique exercises from workout history
const exerciseOptions = computed(() => {
  const exercises = new Set<string>()
  workouts.value.forEach(workout => {
    workout.exercises.forEach(ex => {
      exercises.add(ex.name)
    })
  })
  return Array.from(exercises).map(name => ({
    label: name,
    value: name.toLowerCase().replace(/\s+/g, '-'),
    originalName: name,
  }))
})

const selectedExercise = ref('')

// Auto-select first exercise when available
watch(exerciseOptions, (options) => {
  if (options.length > 0 && !selectedExercise.value) {
    selectedExercise.value = options[0].value
  }
}, { immediate: true })

// Filter workouts by time range
const filteredWorkouts = computed(() => {
  const now = new Date()
  let cutoffDate: Date

  switch (timeRange.value) {
    case '30days':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '3months':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '6months':
      cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case '1year':
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      cutoffDate = new Date(0) // All time
  }

  return workouts.value.filter(w => new Date(w.date) >= cutoffDate)
})

// Calculate exercise progress from real data
const exerciseProgress = computed(() => {
  const selectedName = exerciseOptions.value.find(e => e.value === selectedExercise.value)?.originalName
  if (!selectedName) return []

  const progress: Array<{ date: string; weight: number; reps: number; estimated1RM: number }> = []

  filteredWorkouts.value.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (ex.name === selectedName) {
        // Find the best set for this exercise in this workout
        let bestWeight = 0
        let bestReps = 0
        ex.sets.forEach(set => {
          if (set.completed && set.weight && set.reps) {
            if (set.weight > bestWeight || (set.weight === bestWeight && set.reps > bestReps)) {
              bestWeight = set.weight
              bestReps = set.reps
            }
          }
        })

        if (bestWeight > 0 && bestReps > 0) {
          // Calculate estimated 1RM using Epley formula
          const estimated1RM = bestReps === 1 ? bestWeight : Math.round(bestWeight * (1 + bestReps / 30))
          progress.push({
            date: workout.date,
            weight: bestWeight,
            reps: bestReps,
            estimated1RM,
          })
        }
      }
    })
  })

  // Sort by date ascending
  progress.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return progress
})

// Calculate muscle volume from real data
const muscleVolumeData = computed(() => {
  const muscleMap: Record<string, { volume: number; sessions: Set<string> }> = {}

  // Define muscle groups for exercises
  const exerciseMuscles: Record<string, string[]> = {
    'Bench Press': ['Chest', 'Triceps', 'Shoulders'],
    'Incline Dumbbell Press': ['Chest', 'Shoulders'],
    'Cable Fly': ['Chest'],
    'Overhead Press': ['Shoulders', 'Triceps'],
    'Lateral Raise': ['Shoulders'],
    'Tricep Pushdown': ['Triceps'],
    'Squat': ['Legs'],
    'Deadlift': ['Back', 'Legs'],
    'Pull-up': ['Back', 'Biceps'],
    'Barbell Row': ['Back', 'Biceps'],
    'Lat Pulldown': ['Back', 'Biceps'],
    'Barbell Curl': ['Biceps'],
    'Romanian Deadlift': ['Legs'],
    'Leg Press': ['Legs'],
    'Leg Curl': ['Legs'],
    'Leg Extension': ['Legs'],
    'Calf Raise': ['Legs'],
  }

  filteredWorkouts.value.forEach(workout => {
    workout.exercises.forEach(ex => {
      const muscles = exerciseMuscles[ex.name] || ['Other']
      const exerciseVolume = ex.sets.reduce((sum, set) => {
        if (set.completed && set.weight && set.reps) {
          return sum + (set.weight * set.reps)
        }
        return sum
      }, 0)

      // Distribute volume across muscle groups
      muscles.forEach(muscle => {
        if (!muscleMap[muscle]) {
          muscleMap[muscle] = { volume: 0, sessions: new Set() }
        }
        muscleMap[muscle].volume += exerciseVolume / muscles.length
        muscleMap[muscle].sessions.add(workout.id)
      })
    })
  })

  return Object.entries(muscleMap)
    .map(([muscle, data]) => ({
      muscle,
      volume: Math.round(data.volume),
      sessions: data.sessions.size,
    }))
    .sort((a, b) => b.volume - a.volume)
})

// Find PR timeline from real data
const prTimeline = computed(() => {
  const exerciseBests: Record<string, { weight: number; reps: number; date: string; estimated1RM: number }> = {}
  const prs: Array<{ exercise: string; weight: number; reps: number; date: string; improvement: string }> = []

  // Sort workouts by date ascending to find PRs in order
  const sortedWorkouts = [...filteredWorkouts.value].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedWorkouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          const estimated1RM = set.reps === 1 ? set.weight : Math.round(set.weight * (1 + set.reps / 30))
          const current = exerciseBests[ex.name]

          if (!current || estimated1RM > current.estimated1RM) {
            const improvement = current ? estimated1RM - current.estimated1RM : 0
            if (current) {
              prs.push({
                exercise: ex.name,
                weight: set.weight,
                reps: set.reps,
                date: workout.date,
                improvement: `+${improvement}kg (1RM)`,
              })
            }
            exerciseBests[ex.name] = {
              weight: set.weight,
              reps: set.reps,
              date: workout.date,
              estimated1RM,
            }
          }
        }
      })
    })
  })

  // Return most recent PRs first
  return prs.reverse().slice(0, 5)
})

// Calculate weekly volume trend from real data
const weeklyVolumeTrend = computed(() => {
  const weeks: Record<string, { push: number; pull: number; legs: number }> = {}

  // Categorize exercises
  const pushExercises = ['Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Overhead Press', 'Lateral Raise', 'Tricep Pushdown']
  const pullExercises = ['Pull-up', 'Barbell Row', 'Lat Pulldown', 'Barbell Curl', 'Deadlift']
  const legExercises = ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Leg Extension', 'Calf Raise']

  filteredWorkouts.value.forEach(workout => {
    const date = new Date(workout.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!weeks[weekKey]) {
      weeks[weekKey] = { push: 0, pull: 0, legs: 0 }
    }

    workout.exercises.forEach(ex => {
      const volume = ex.sets.reduce((sum, set) => {
        if (set.completed && set.weight && set.reps) {
          return sum + (set.weight * set.reps)
        }
        return sum
      }, 0)

      if (pushExercises.includes(ex.name)) {
        weeks[weekKey].push += volume
      } else if (pullExercises.includes(ex.name)) {
        weeks[weekKey].pull += volume
      } else if (legExercises.includes(ex.name)) {
        weeks[weekKey].legs += volume
      }
    })
  })

  // Convert to array and sort by date, take last 4 weeks
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-4)
    .map(([weekKey], index) => ({
      week: `Week ${index + 1}`,
      ...weeks[weekKey],
    }))
})

// Computed values for stats
const maxWeight = computed(() => exerciseProgress.value.length ? Math.max(...exerciseProgress.value.map(p => p.weight)) : 0)
const minWeight = computed(() => exerciseProgress.value.length ? Math.min(...exerciseProgress.value.map(p => p.weight)) : 0)
const maxEstimated1RM = computed(() => exerciseProgress.value.length ? Math.max(...exerciseProgress.value.map(p => p.estimated1RM)) : 0)
const minEstimated1RM = computed(() => exerciseProgress.value.length ? Math.min(...exerciseProgress.value.map(p => p.estimated1RM)) : 0)
const weightIncrease = computed(() => maxWeight.value - minWeight.value)
const estimatedGainPercent = computed(() => minEstimated1RM.value > 0 ? Math.round(((maxEstimated1RM.value - minEstimated1RM.value) / minEstimated1RM.value) * 100) : 0)
const sessionCount = computed(() => exerciseProgress.value.length)
const selectedExerciseLabel = computed(() => exerciseOptions.value.find(e => e.value === selectedExercise.value)?.label || 'Exercise')
const lastReps = computed(() => exerciseProgress.value.length ? exerciseProgress.value[exerciseProgress.value.length - 1]?.reps : 0)
const totalVolume = computed(() => muscleVolumeData.value.reduce((sum, m) => sum + m.volume, 0))
const maxMuscleVolume = computed(() => muscleVolumeData.value.length ? Math.max(...muscleVolumeData.value.map(m => m.volume)) : 1)
const maxWeeklyVolume = computed(() => {
  let max = 1
  weeklyVolumeTrend.value.forEach(w => {
    max = Math.max(max, w.push, w.pull, w.legs)
  })
  return max * 1.2 // Add 20% padding
})

function formatVolume(kg: number) {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k`
  }
  return `${kg}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getProgressPercentage(value: number, max: number) {
  if (max === 0) return 0
  return (value / max) * 100
}
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
        <h1 class="text-2xl font-bold text-primary-900 dark:text-white">Strength Analytics</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Track your strength gains over time</p>
      </div>
      <NSelect
        v-model:value="timeRange"
        :options="timeRangeOptions"
        style="width: 160px"
        class="!rounded-xl"
      />
    </div>

    <!-- No Data State -->
    <div v-if="workouts.length === 0" class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Workout Data Yet</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Complete some workouts to see your strength progress!</p>
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
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Volume</p>
          <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ formatVolume(totalVolume) }}kg</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">this period</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">New PRs</p>
          <p class="text-3xl font-bold text-accent-500">{{ prTimeline.length }}</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">personal records</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Best {{ selectedExerciseLabel }}</p>
          <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ maxWeight || '—' }}{{ maxWeight ? 'kg' : '' }}</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">{{ lastReps ? `x ${lastReps} reps` : 'no data' }}</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Est. 1RM</p>
          <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ maxEstimated1RM || '—' }}{{ maxEstimated1RM ? 'kg' : '' }}</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">{{ selectedExerciseLabel.toLowerCase() }}</p>
        </div>
      </div>

      <!-- Exercise Progress Chart -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Exercise Progress</h3>
          <NSelect
            v-model:value="selectedExercise"
            :options="exerciseOptions"
            style="width: 180px"
            size="small"
            :disabled="exerciseOptions.length === 0"
          />
        </div>

        <!-- No exercise data state -->
        <div v-if="exerciseProgress.length === 0" class="py-12 text-center text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No data for this exercise yet</p>
          <p class="text-sm mt-1">Log some workouts with this exercise to see progress</p>
        </div>

        <!-- Chart Area -->
        <div v-else class="relative">
          <!-- Y-axis labels -->
          <div class="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{{ maxWeight + 10 }}kg</span>
            <span>{{ Math.round((maxWeight + 10) * 0.75) }}kg</span>
            <span>{{ Math.round((maxWeight + 10) * 0.5) }}kg</span>
            <span>{{ Math.round((maxWeight + 10) * 0.25) }}kg</span>
            <span>0kg</span>
          </div>

          <!-- Chart -->
          <div class="ml-14 h-64 relative">
            <!-- Grid lines -->
            <div class="absolute inset-0 flex flex-col justify-between">
              <div class="border-b border-gray-100 dark:border-gray-800"></div>
              <div class="border-b border-gray-100 dark:border-gray-800"></div>
              <div class="border-b border-gray-100 dark:border-gray-800"></div>
              <div class="border-b border-gray-100 dark:border-gray-800"></div>
              <div class="border-b border-gray-200 dark:border-gray-700"></div>
            </div>

            <!-- Data points and line -->
            <svg class="absolute inset-0 w-full h-full overflow-visible">
              <defs>
                <linearGradient id="progressFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color: rgb(239, 68, 68); stop-opacity: 0.15" />
                  <stop offset="100%" style="stop-color: rgb(239, 68, 68); stop-opacity: 0" />
                </linearGradient>
              </defs>

              <!-- Area fill -->
              <path
                :d="`M ${exerciseProgress.map((p, i) => `${(i / Math.max(exerciseProgress.length - 1, 1)) * 100}%,${100 - getProgressPercentage(p.weight, maxWeight + 10)}%`).join(' L ')} L 100%,100% L 0%,100% Z`"
                fill="url(#progressFill)"
              />

              <!-- Line -->
              <polyline
                :points="exerciseProgress.map((p, i) => `${(i / Math.max(exerciseProgress.length - 1, 1)) * 100}%,${100 - getProgressPercentage(p.weight, maxWeight + 10)}%`).join(' ')"
                fill="none"
                stroke="#ef4444"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data points -->
              <g v-for="(point, i) in exerciseProgress" :key="i">
                <circle
                  :cx="`${(i / Math.max(exerciseProgress.length - 1, 1)) * 100}%`"
                  :cy="`${100 - getProgressPercentage(point.weight, maxWeight + 10)}%`"
                  r="4"
                  fill="white"
                  stroke="#ef4444"
                  stroke-width="2"
                  class="hover:r-6 cursor-pointer"
                />
              </g>
            </svg>
          </div>

          <!-- X-axis labels -->
          <div class="ml-14 flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
            <span v-for="(point, i) in exerciseProgress.filter((_, idx) => idx % Math.max(1, Math.floor(exerciseProgress.length / 5)) === 0)" :key="i">
              {{ formatDate(point.date) }}
            </span>
          </div>
        </div>

        <!-- Stats row -->
        <div v-if="exerciseProgress.length > 0" class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-primary-900 dark:text-white">+{{ weightIncrease }}kg</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Weight Increase</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-success-500">+{{ estimatedGainPercent }}%</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Est. 1RM Gain</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-primary-900 dark:text-white">{{ sessionCount }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Sessions</p>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Volume by Muscle Group -->
        <div class="card p-6">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">Volume by Muscle Group</h3>
          <div v-if="muscleVolumeData.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
            No volume data yet
          </div>
          <div v-else class="space-y-5">
            <div v-for="muscle in muscleVolumeData" :key="muscle.muscle">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-primary-900 dark:text-white">{{ muscle.muscle }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatVolume(muscle.volume) }}kg</span>
              </div>
              <div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-primary-900 dark:bg-white transition-all duration-500"
                  :style="{ width: `${(muscle.volume / maxMuscleVolume) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- PR Timeline -->
        <div class="card p-6">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">PR Timeline</h3>
          <div v-if="prTimeline.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
            No PRs recorded yet
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(pr, index) in prTimeline"
              :key="index"
              class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#222222] border border-gray-100 dark:border-gray-700"
            >
              <div class="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold text-primary-900 dark:text-white">{{ pr.exercise }}</h4>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 font-medium">{{ pr.improvement }}</span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ pr.weight }}kg x {{ pr.reps }} reps · {{ formatDate(pr.date) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Volume Trend -->
      <div class="card p-6">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">Weekly Volume Trend</h3>

        <div v-if="weeklyVolumeTrend.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
          Not enough data for weekly trends yet
        </div>

        <template v-else>
          <div class="flex gap-6 mb-6">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-accent-500"></div>
              <span class="text-sm text-gray-600 dark:text-gray-400">Push</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-primary-400"></div>
              <span class="text-sm text-gray-600 dark:text-gray-400">Pull</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-success-500"></div>
              <span class="text-sm text-gray-600 dark:text-gray-400">Legs</span>
            </div>
          </div>

          <div class="grid gap-6" :class="weeklyVolumeTrend.length === 4 ? 'grid-cols-4' : `grid-cols-${weeklyVolumeTrend.length}`">
            <div v-for="week in weeklyVolumeTrend" :key="week.week" class="text-center">
              <div class="h-40 flex items-end justify-center gap-2">
                <div
                  class="w-5 bg-accent-500 rounded-t transition-all"
                  :style="{ height: `${(week.push / maxWeeklyVolume) * 100}%` }"
                ></div>
                <div
                  class="w-5 bg-primary-400 rounded-t transition-all"
                  :style="{ height: `${(week.pull / maxWeeklyVolume) * 100}%` }"
                ></div>
                <div
                  class="w-5 bg-success-500 rounded-t transition-all"
                  :style="{ height: `${(week.legs / maxWeeklyVolume) * 100}%` }"
                ></div>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">{{ week.week }}</p>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
