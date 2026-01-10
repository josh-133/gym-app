<script setup lang="ts">
import { NCard, NSelect, NTag } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

// Time range filter
const timeRange = ref('3months')
const timeRangeOptions = [
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'Last Year', value: '1year' },
  { label: 'All Time', value: 'all' },
]

// Selected exercise for detailed view
const selectedExercise = ref('bench-press')
const exerciseOptions = [
  { label: 'Bench Press', value: 'bench-press' },
  { label: 'Squat', value: 'squat' },
  { label: 'Deadlift', value: 'deadlift' },
  { label: 'Overhead Press', value: 'ohp' },
  { label: 'Barbell Row', value: 'row' },
]

// Mock exercise progress data for each exercise
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

// Get exercise progress based on selected exercise
const exerciseProgress = computed(() => {
  return exerciseProgressData[selectedExercise.value] || exerciseProgressData['bench-press']
})

// Mock volume by muscle group data
const muscleVolumeData = ref([
  { muscle: 'Chest', volume: 28500, sessions: 12, color: 'from-accent-500 to-energy-500' },
  { muscle: 'Back', volume: 32200, sessions: 14, color: 'from-secondary-500 to-primary-500' },
  { muscle: 'Shoulders', volume: 18800, sessions: 10, color: 'from-primary-500 to-accent-500' },
  { muscle: 'Legs', volume: 45600, sessions: 8, color: 'from-success-500 to-secondary-500' },
  { muscle: 'Biceps', volume: 8200, sessions: 8, color: 'from-warning-500 to-energy-500' },
  { muscle: 'Triceps', volume: 9100, sessions: 9, color: 'from-energy-500 to-accent-500' },
])

// Mock PR timeline
const prTimeline = ref([
  { exercise: 'Bench Press', weight: 100, reps: 5, date: '2024-02-06', improvement: '+2.5kg' },
  { exercise: 'Squat', weight: 140, reps: 5, date: '2024-02-04', improvement: '+5kg' },
  { exercise: 'Deadlift', weight: 180, reps: 3, date: '2024-02-01', improvement: '+5kg' },
  { exercise: 'Overhead Press', weight: 60, reps: 6, date: '2024-01-28', improvement: '+2.5kg' },
  { exercise: 'Barbell Row', weight: 85, reps: 8, date: '2024-01-25', improvement: '+5kg' },
  { exercise: 'Bench Press', weight: 97.5, reps: 5, date: '2024-01-20', improvement: '+2.5kg' },
])

// Weekly volume trend
const weeklyVolumeTrend = ref([
  { week: 'Week 1', push: 8500, pull: 9200, legs: 11500 },
  { week: 'Week 2', push: 9100, pull: 8800, legs: 10200 },
  { week: 'Week 3', push: 8800, pull: 9500, legs: 12100 },
  { week: 'Week 4', push: 9600, pull: 10100, legs: 11800 },
])

// Computed stats based on selected exercise
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
const totalPRs = computed(() => prTimeline.value.length)

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
        <NuxtLink to="/progress" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">
          ← Back to Progress
        </NuxtLink>
        <h1 class="text-2xl font-bold gradient-text">Strength Analytics</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Track your strength gains over time</p>
      </div>
      <NSelect
        v-model:value="timeRange"
        :options="timeRangeOptions"
        style="width: 160px"
      />
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <NCard class="!bg-gradient-to-br from-primary-500 to-accent-500 shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">Total Volume</p>
          <p class="text-3xl font-bold mt-1">{{ formatVolume(totalVolume) }}kg</p>
          <p class="text-white/60 text-sm mt-2">this period</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-warning-500 to-energy-500 shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">New PRs</p>
          <p class="text-3xl font-bold mt-1">{{ totalPRs }}</p>
          <p class="text-white/60 text-sm mt-2">personal records</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-success-500 to-secondary-500 shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">Best {{ selectedExerciseLabel }}</p>
          <p class="text-3xl font-bold mt-1">{{ maxWeight }}kg</p>
          <p class="text-white/60 text-sm mt-2">× {{ lastReps }} reps</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-secondary-500 to-primary-500 shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">Est. 1RM</p>
          <p class="text-3xl font-bold mt-1">{{ maxEstimated1RM }}kg</p>
          <p class="text-white/60 text-sm mt-2">{{ selectedExerciseLabel.toLowerCase() }}</p>
        </div>
      </NCard>
    </div>

    <!-- Exercise Progress Chart -->
    <NCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white">Exercise Progress</h3>
          <NSelect
            v-model:value="selectedExercise"
            :options="exerciseOptions"
            style="width: 160px"
            size="small"
          />
        </div>
      </template>

      <!-- Chart Area -->
      <div class="relative">
        <!-- Y-axis labels -->
        <div class="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
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
            <!-- Gradient fill -->
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color: rgb(168, 85, 247); stop-opacity: 0.3" />
                <stop offset="100%" style="stop-color: rgb(168, 85, 247); stop-opacity: 0" />
              </linearGradient>
            </defs>

            <!-- Area fill -->
            <path
              :d="`M ${exerciseProgress.map((p, i) => `${(i / (exerciseProgress.length - 1)) * 100}%,${100 - getProgressPercentage(p.weight, maxWeight + 10)}%`).join(' L ')} L 100%,100% L 0%,100% Z`"
              fill="url(#progressGradient)"
            />

            <!-- Line -->
            <polyline
              :points="exerciseProgress.map((p, i) => `${(i / (exerciseProgress.length - 1)) * 100}%,${100 - getProgressPercentage(p.weight, maxWeight + 10)}%`).join(' ')"
              fill="none"
              stroke="url(#lineGradient)"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color: rgb(168, 85, 247)" />
                <stop offset="50%" style="stop-color: rgb(236, 72, 153)" />
                <stop offset="100%" style="stop-color: rgb(6, 182, 212)" />
              </linearGradient>
            </defs>

            <!-- Data points -->
            <g v-for="(point, i) in exerciseProgress" :key="i">
              <circle
                :cx="`${(i / (exerciseProgress.length - 1)) * 100}%`"
                :cy="`${100 - getProgressPercentage(point.weight, maxWeight + 10)}%`"
                r="6"
                fill="white"
                stroke="rgb(168, 85, 247)"
                stroke-width="2"
                class="hover:r-8 transition-all cursor-pointer"
              />
            </g>
          </svg>
        </div>

        <!-- X-axis labels -->
        <div class="ml-14 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span v-for="(point, i) in exerciseProgress.filter((_, idx) => idx % 2 === 0)" :key="i">
            {{ formatDate(point.date) }}
          </span>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">+{{ weightIncrease }}kg</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Weight Increase</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-success-500">+{{ estimatedGainPercent }}%</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Est. 1RM Gain</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ sessionCount }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Sessions</p>
        </div>
      </div>
    </NCard>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Volume by Muscle Group -->
      <NCard title="Volume by Muscle Group">
        <div class="space-y-4">
          <div
            v-for="muscle in muscleVolumeData"
            :key="muscle.muscle"
            class="group"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-900 dark:text-white">{{ muscle.muscle }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatVolume(muscle.volume) }}kg · {{ muscle.sessions }} sessions</span>
            </div>
            <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 bg-gradient-to-r"
                :class="muscle.color"
                :style="{ width: `${(muscle.volume / 50000) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Pie chart representation -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div class="flex items-center justify-center">
            <div class="relative w-40 h-40">
              <svg viewBox="0 0 100 100" class="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(243 244 246)" stroke-width="20" class="dark:stroke-gray-800" />
                <!-- Segments would be calculated in real app -->
                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#pieGradient1)" stroke-width="20"
                  stroke-dasharray="50 251.2" stroke-dashoffset="0" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#pieGradient2)" stroke-width="20"
                  stroke-dasharray="45 251.2" stroke-dashoffset="-50" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#pieGradient3)" stroke-width="20"
                  stroke-dasharray="35 251.2" stroke-dashoffset="-95" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#pieGradient4)" stroke-width="20"
                  stroke-dasharray="70 251.2" stroke-dashoffset="-130" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="url(#pieGradient5)" stroke-width="20"
                  stroke-dasharray="51.2 251.2" stroke-dashoffset="-200" />
                <defs>
                  <linearGradient id="pieGradient1"><stop stop-color="#ec4899"/></linearGradient>
                  <linearGradient id="pieGradient2"><stop stop-color="#06b6d4"/></linearGradient>
                  <linearGradient id="pieGradient3"><stop stop-color="#a855f7"/></linearGradient>
                  <linearGradient id="pieGradient4"><stop stop-color="#22c55e"/></linearGradient>
                  <linearGradient id="pieGradient5"><stop stop-color="#f97316"/></linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatVolume(totalVolume) }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Total kg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NCard>

      <!-- PR Timeline -->
      <NCard title="PR Timeline">
        <div class="space-y-4 max-h-96 overflow-y-auto">
          <div
            v-for="(pr, index) in prTimeline"
            :key="index"
            class="flex items-start gap-4 p-3 rounded-xl bg-gradient-to-r from-warning-50 to-energy-50 dark:from-warning-900/20 dark:to-energy-900/20 border border-warning-200 dark:border-warning-800/50"
          >
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-500 to-energy-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ pr.exercise }}</h4>
                <NTag type="success" size="small">{{ pr.improvement }}</NTag>
              </div>
              <p class="text-lg font-bold text-warning-600 dark:text-warning-400">
                {{ pr.weight }}kg × {{ pr.reps }} reps
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(pr.date) }}</p>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- Weekly Volume Trend -->
    <NCard title="Weekly Volume Trend">
      <div class="flex gap-2 mb-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-accent-500"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Push</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-secondary-500"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Pull</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-success-500"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Legs</span>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div v-for="week in weeklyVolumeTrend" :key="week.week" class="text-center">
          <div class="h-48 flex items-end justify-center gap-1">
            <div
              class="w-6 bg-gradient-to-t from-accent-500 to-accent-400 rounded-t-lg transition-all hover:opacity-80"
              :style="{ height: `${(week.push / 15000) * 100}%` }"
              :title="`Push: ${formatVolume(week.push)}kg`"
            ></div>
            <div
              class="w-6 bg-gradient-to-t from-secondary-500 to-secondary-400 rounded-t-lg transition-all hover:opacity-80"
              :style="{ height: `${(week.pull / 15000) * 100}%` }"
              :title="`Pull: ${formatVolume(week.pull)}kg`"
            ></div>
            <div
              class="w-6 bg-gradient-to-t from-success-500 to-success-400 rounded-t-lg transition-all hover:opacity-80"
              :style="{ height: `${(week.legs / 15000) * 100}%` }"
              :title="`Legs: ${formatVolume(week.legs)}kg`"
            ></div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{{ week.week }}</p>
        </div>
      </div>
    </NCard>
  </div>
</template>
