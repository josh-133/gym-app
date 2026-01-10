<script setup lang="ts">
import { NSelect } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const timeRange = ref('3months')
const timeRangeOptions = [
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'Last Year', value: '1year' },
  { label: 'All Time', value: 'all' },
]

const selectedExercise = ref('bench-press')
const exerciseOptions = [
  { label: 'Bench Press', value: 'bench-press' },
  { label: 'Squat', value: 'squat' },
  { label: 'Deadlift', value: 'deadlift' },
  { label: 'Overhead Press', value: 'ohp' },
  { label: 'Barbell Row', value: 'row' },
]

const exerciseProgressData: Record<string, Array<{ date: string; weight: number; reps: number; estimated1RM: number }>> = {
  'bench-press': [
    { date: '2024-01-02', weight: 80, reps: 8, estimated1RM: 98 },
    { date: '2024-01-05', weight: 82.5, reps: 7, estimated1RM: 99 },
    { date: '2024-01-09', weight: 85, reps: 6, estimated1RM: 99 },
    { date: '2024-01-12', weight: 85, reps: 7, estimated1RM: 102 },
    { date: '2024-01-16', weight: 87.5, reps: 6, estimated1RM: 102 },
    { date: '2024-01-19', weight: 90, reps: 5, estimated1RM: 101 },
    { date: '2024-01-23', weight: 90, reps: 6, estimated1RM: 105 },
    { date: '2024-01-26', weight: 92.5, reps: 5, estimated1RM: 104 },
    { date: '2024-01-30', weight: 95, reps: 5, estimated1RM: 107 },
    { date: '2024-02-02', weight: 97.5, reps: 5, estimated1RM: 110 },
    { date: '2024-02-06', weight: 100, reps: 5, estimated1RM: 113 },
  ],
  'squat': [
    { date: '2024-01-03', weight: 100, reps: 8, estimated1RM: 123 },
    { date: '2024-01-07', weight: 105, reps: 7, estimated1RM: 126 },
    { date: '2024-01-10', weight: 110, reps: 6, estimated1RM: 128 },
    { date: '2024-01-14', weight: 112.5, reps: 6, estimated1RM: 131 },
    { date: '2024-01-17', weight: 115, reps: 5, estimated1RM: 129 },
    { date: '2024-01-21', weight: 120, reps: 5, estimated1RM: 135 },
    { date: '2024-01-24', weight: 125, reps: 5, estimated1RM: 141 },
    { date: '2024-01-28', weight: 130, reps: 4, estimated1RM: 142 },
    { date: '2024-02-01', weight: 135, reps: 5, estimated1RM: 152 },
    { date: '2024-02-04', weight: 140, reps: 5, estimated1RM: 158 },
  ],
  'deadlift': [
    { date: '2024-01-04', weight: 140, reps: 5, estimated1RM: 158 },
    { date: '2024-01-08', weight: 145, reps: 5, estimated1RM: 163 },
    { date: '2024-01-11', weight: 150, reps: 4, estimated1RM: 164 },
    { date: '2024-01-15', weight: 155, reps: 4, estimated1RM: 169 },
    { date: '2024-01-18', weight: 160, reps: 3, estimated1RM: 170 },
    { date: '2024-01-22', weight: 165, reps: 3, estimated1RM: 175 },
    { date: '2024-01-25', weight: 170, reps: 3, estimated1RM: 180 },
    { date: '2024-01-29', weight: 175, reps: 3, estimated1RM: 186 },
    { date: '2024-02-01', weight: 180, reps: 3, estimated1RM: 191 },
  ],
  'ohp': [
    { date: '2024-01-02', weight: 40, reps: 10, estimated1RM: 53 },
    { date: '2024-01-06', weight: 42.5, reps: 8, estimated1RM: 52 },
    { date: '2024-01-09', weight: 45, reps: 8, estimated1RM: 55 },
    { date: '2024-01-13', weight: 47.5, reps: 7, estimated1RM: 57 },
    { date: '2024-01-16', weight: 50, reps: 6, estimated1RM: 58 },
    { date: '2024-01-20', weight: 52.5, reps: 6, estimated1RM: 61 },
    { date: '2024-01-23', weight: 55, reps: 5, estimated1RM: 62 },
    { date: '2024-01-27', weight: 57.5, reps: 6, estimated1RM: 67 },
    { date: '2024-01-30', weight: 60, reps: 6, estimated1RM: 70 },
  ],
  'row': [
    { date: '2024-01-03', weight: 60, reps: 10, estimated1RM: 80 },
    { date: '2024-01-07', weight: 62.5, reps: 9, estimated1RM: 80 },
    { date: '2024-01-10', weight: 65, reps: 8, estimated1RM: 80 },
    { date: '2024-01-14', weight: 67.5, reps: 8, estimated1RM: 83 },
    { date: '2024-01-17', weight: 70, reps: 8, estimated1RM: 86 },
    { date: '2024-01-21', weight: 72.5, reps: 8, estimated1RM: 89 },
    { date: '2024-01-25', weight: 75, reps: 8, estimated1RM: 92 },
    { date: '2024-01-28', weight: 80, reps: 8, estimated1RM: 98 },
    { date: '2024-02-01', weight: 85, reps: 8, estimated1RM: 104 },
  ],
}

const exerciseProgress = computed(() => {
  return exerciseProgressData[selectedExercise.value] || exerciseProgressData['bench-press']
})

const muscleVolumeData = ref([
  { muscle: 'Chest', volume: 28500, sessions: 12 },
  { muscle: 'Back', volume: 32200, sessions: 14 },
  { muscle: 'Shoulders', volume: 18800, sessions: 10 },
  { muscle: 'Legs', volume: 45600, sessions: 8 },
  { muscle: 'Biceps', volume: 8200, sessions: 8 },
  { muscle: 'Triceps', volume: 9100, sessions: 9 },
])

const prTimeline = ref([
  { exercise: 'Bench Press', weight: 100, reps: 5, date: '2024-02-06', improvement: '+2.5kg' },
  { exercise: 'Squat', weight: 140, reps: 5, date: '2024-02-04', improvement: '+5kg' },
  { exercise: 'Deadlift', weight: 180, reps: 3, date: '2024-02-01', improvement: '+5kg' },
  { exercise: 'Overhead Press', weight: 60, reps: 6, date: '2024-01-28', improvement: '+2.5kg' },
  { exercise: 'Barbell Row', weight: 85, reps: 8, date: '2024-01-25', improvement: '+5kg' },
])

const weeklyVolumeTrend = ref([
  { week: 'Week 1', push: 8500, pull: 9200, legs: 11500 },
  { week: 'Week 2', push: 9100, pull: 8800, legs: 10200 },
  { week: 'Week 3', push: 8800, pull: 9500, legs: 12100 },
  { week: 'Week 4', push: 9600, pull: 10100, legs: 11800 },
])

const maxWeight = computed(() => Math.max(...exerciseProgress.value.map(p => p.weight)))
const minWeight = computed(() => Math.min(...exerciseProgress.value.map(p => p.weight)))
const maxEstimated1RM = computed(() => Math.max(...exerciseProgress.value.map(p => p.estimated1RM)))
const minEstimated1RM = computed(() => Math.min(...exerciseProgress.value.map(p => p.estimated1RM)))
const weightIncrease = computed(() => maxWeight.value - minWeight.value)
const estimatedGainPercent = computed(() => Math.round(((maxEstimated1RM.value - minEstimated1RM.value) / minEstimated1RM.value) * 100))
const sessionCount = computed(() => exerciseProgress.value.length)
const selectedExerciseLabel = computed(() => exerciseOptions.find(e => e.value === selectedExercise.value)?.label || 'Exercise')
const lastReps = computed(() => exerciseProgress.value[exerciseProgress.value.length - 1]?.reps || 0)
const totalVolume = computed(() => muscleVolumeData.value.reduce((sum, m) => sum + m.volume, 0))
const maxMuscleVolume = computed(() => Math.max(...muscleVolumeData.value.map(m => m.volume)))

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
        <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ maxWeight }}kg</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">x {{ lastReps }} reps</p>
      </div>
      <div class="stat-card">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Est. 1RM</p>
        <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ maxEstimated1RM }}kg</p>
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
          style="width: 160px"
          size="small"
        />
      </div>

      <!-- Chart Area -->
      <div class="relative">
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
              :d="`M ${exerciseProgress.map((p, i) => `${(i / (exerciseProgress.length - 1)) * 100}%,${100 - getProgressPercentage(p.weight, maxWeight + 10)}%`).join(' L ')} L 100%,100% L 0%,100% Z`"
              fill="url(#progressFill)"
            />

            <!-- Line -->
            <polyline
              :points="exerciseProgress.map((p, i) => `${(i / (exerciseProgress.length - 1)) * 100}%,${100 - getProgressPercentage(p.weight, maxWeight + 10)}%`).join(' ')"
              fill="none"
              stroke="#ef4444"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Data points -->
            <g v-for="(point, i) in exerciseProgress" :key="i">
              <circle
                :cx="`${(i / (exerciseProgress.length - 1)) * 100}%`"
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
          <span v-for="(point, i) in exerciseProgress.filter((_, idx) => idx % 2 === 0)" :key="i">
            {{ formatDate(point.date) }}
          </span>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
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
        <div class="space-y-5">
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
        <div class="space-y-3">
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

      <div class="grid grid-cols-4 gap-6">
        <div v-for="week in weeklyVolumeTrend" :key="week.week" class="text-center">
          <div class="h-40 flex items-end justify-center gap-2">
            <div
              class="w-5 bg-accent-500 rounded-t transition-all"
              :style="{ height: `${(week.push / 15000) * 100}%` }"
            ></div>
            <div
              class="w-5 bg-primary-400 rounded-t transition-all"
              :style="{ height: `${(week.pull / 15000) * 100}%` }"
            ></div>
            <div
              class="w-5 bg-success-500 rounded-t transition-all"
              :style="{ height: `${(week.legs / 15000) * 100}%` }"
            ></div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">{{ week.week }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
