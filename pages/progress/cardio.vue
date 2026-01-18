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

// Cardio stats (empty by default)
const cardioStats = ref({
  totalDuration: 0,
  totalDistance: 0,
  totalCalories: 0,
  avgHeartRate: 0,
  avgPace: 0,
  sessionsCount: 0,
})

// Empty arrays (will be populated from real data)
const recentSessions = ref<{ id: string; type: string; date: string; duration: number; distance: number; calories: number; avgHR: number; maxHR: number; pace: number | null }[]>([])

const weeklyDistance = ref<{ week: string; running: number; cycling: number; swimming: number }[]>([])

const heartRateZones = ref<{ zone: string; name: string; range: string; percentage: number; color: string; time: number }[]>([])

const paceTrend = ref<{ date: string; pace: number }[]>([])

const caloriesByActivity = ref<{ type: string; calories: number; percentage: number }[]>([])

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'Running': return '🏃'
    case 'Cycling': return '🚴'
    case 'Swimming': return '🏊'
    default: return '💪'
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'Running': return 'from-accent-500 to-energy-500'
    case 'Cycling': return 'from-secondary-500 to-primary-500'
    case 'Swimming': return 'from-primary-500 to-accent-500'
    default: return 'from-gray-500 to-gray-600'
  }
}

const maxPace = computed(() => paceTrend.value.length > 0 ? Math.max(...paceTrend.value.map(p => p.pace)) : 0)
const minPace = computed(() => paceTrend.value.length > 0 ? Math.min(...paceTrend.value.map(p => p.pace)) : 0)
const hasData = computed(() => recentSessions.value.length > 0)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <NuxtLink to="/progress" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">
          ← Back to Progress
        </NuxtLink>
        <h1 class="text-2xl font-bold gradient-text">Cardio Analytics</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Track your cardio performance and trends</p>
      </div>
      <NSelect
        v-model:value="timeRange"
        :options="timeRangeOptions"
        style="width: 160px"
      />
    </div>

    <!-- No Data State -->
    <div v-if="!hasData" class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Cardio Data Yet</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Log cardio workouts to see your heart rate zones, pace trends, and more!</p>
      <NuxtLink to="/workout/new" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-white text-white dark:text-primary-900 rounded-xl font-medium hover:opacity-90 transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Start a Workout
      </NuxtLink>
    </div>

    <template v-else>
    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <NCard class="!bg-gradient-to-br from-accent-500 to-energy-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-xs">Total Time</p>
          <p class="text-2xl font-bold mt-1">{{ formatDuration(cardioStats.totalDuration) }}</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-secondary-500 to-primary-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-xs">Distance</p>
          <p class="text-2xl font-bold mt-1">{{ cardioStats.totalDistance }}km</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-energy-500 to-warning-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-xs">Calories</p>
          <p class="text-2xl font-bold mt-1">{{ (cardioStats.totalCalories / 1000).toFixed(1) }}k</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-primary-500 to-accent-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-xs">Avg HR</p>
          <p class="text-2xl font-bold mt-1">{{ cardioStats.avgHeartRate }}</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-success-500 to-secondary-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-xs">Avg Pace</p>
          <p class="text-2xl font-bold mt-1">{{ cardioStats.avgPace }}'</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-warning-500 to-accent-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-xs">Sessions</p>
          <p class="text-2xl font-bold mt-1">{{ cardioStats.sessionsCount }}</p>
        </div>
      </NCard>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Heart Rate Zones -->
      <NCard title="Heart Rate Zones">
        <div class="space-y-4">
          <div v-for="zone in heartRateZones" :key="zone.zone" class="group">
            <div class="flex items-center justify-between mb-2">
              <div>
                <span class="font-medium text-gray-900 dark:text-white">{{ zone.zone }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">{{ zone.name }}</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ zone.percentage }}%</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">({{ formatDuration(zone.time) }})</span>
              </div>
            </div>
            <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 bg-gradient-to-r"
                :class="zone.color"
                :style="{ width: `${zone.percentage}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ zone.range }}</p>
          </div>
        </div>

        <!-- Heart rate gauge -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-center">
          <div class="relative">
            <svg width="200" height="120" viewBox="0 0 200 120">
              <!-- Background arc -->
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgb(243 244 246)"
                stroke-width="16"
                stroke-linecap="round"
                class="dark:stroke-gray-800"
              />
              <!-- Colored arc -->
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#hrGradient)"
                stroke-width="16"
                stroke-linecap="round"
                stroke-dasharray="251.2"
                :stroke-dashoffset="251.2 - (251.2 * 0.71)"
              />
              <defs>
                <linearGradient id="hrGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color: #22c55e" />
                  <stop offset="50%" style="stop-color: #f59e0b" />
                  <stop offset="100%" style="stop-color: #ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ cardioStats.avgHeartRate }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">avg bpm</span>
            </div>
          </div>
        </div>
      </NCard>

      <!-- Calories by Activity -->
      <NCard title="Calories by Activity">
        <div class="flex items-center gap-6">
          <!-- Donut chart -->
          <div class="relative w-40 h-40 flex-shrink-0">
            <svg viewBox="0 0 100 100" class="transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(243 244 246)" stroke-width="16" class="dark:stroke-gray-800" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" stroke-width="16"
                :stroke-dasharray="`${caloriesByActivity[0].percentage * 2.512} 251.2`" stroke-dashoffset="0" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" stroke-width="16"
                :stroke-dasharray="`${caloriesByActivity[1].percentage * 2.512} 251.2`" :stroke-dashoffset="`-${caloriesByActivity[0].percentage * 2.512}`" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" stroke-width="16"
                :stroke-dasharray="`${caloriesByActivity[2].percentage * 2.512} 251.2`" :stroke-dashoffset="`-${(caloriesByActivity[0].percentage + caloriesByActivity[1].percentage) * 2.512}`" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#6b7280" stroke-width="16"
                :stroke-dasharray="`${caloriesByActivity[3].percentage * 2.512} 251.2`" :stroke-dashoffset="`-${(caloriesByActivity[0].percentage + caloriesByActivity[1].percentage + caloriesByActivity[2].percentage) * 2.512}`" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <p class="text-xl font-bold text-gray-900 dark:text-white">{{ (cardioStats.totalCalories / 1000).toFixed(1) }}k</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">kcal</p>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="flex-1 space-y-3">
            <div v-for="activity in caloriesByActivity" :key="activity.type" class="flex items-center gap-3">
              <div class="text-2xl">{{ getActivityIcon(activity.type) }}</div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-900 dark:text-white">{{ activity.type }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ activity.percentage }}%</span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ activity.calories.toLocaleString() }} kcal</p>
              </div>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- Pace Trend -->
    <NCard title="Running Pace Trend">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Average pace per week (min/km) - Lower is faster</p>

      <div class="relative h-48">
        <!-- Y-axis -->
        <div class="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{{ maxPace.toFixed(1) }}'</span>
          <span>{{ ((maxPace + minPace) / 2).toFixed(1) }}'</span>
          <span>{{ minPace.toFixed(1) }}'</span>
        </div>

        <!-- Chart area -->
        <div class="ml-14 h-full relative">
          <!-- Grid -->
          <div class="absolute inset-0 flex flex-col justify-between">
            <div class="border-b border-gray-100 dark:border-gray-800"></div>
            <div class="border-b border-gray-100 dark:border-gray-800"></div>
            <div class="border-b border-gray-200 dark:border-gray-700"></div>
          </div>

          <!-- Line chart -->
          <svg class="absolute inset-0 w-full h-full overflow-visible">
            <defs>
              <linearGradient id="paceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color: rgb(34, 197, 94); stop-opacity: 0.3" />
                <stop offset="100%" style="stop-color: rgb(34, 197, 94); stop-opacity: 0" />
              </linearGradient>
            </defs>

            <!-- Area -->
            <path
              :d="`M ${paceTrend.map((p, i) => `${(i / (paceTrend.length - 1)) * 100}%,${((p.pace - minPace) / (maxPace - minPace)) * 100}%`).join(' L ')} L 100%,100% L 0%,100% Z`"
              fill="url(#paceGradient)"
            />

            <!-- Line -->
            <polyline
              :points="paceTrend.map((p, i) => `${(i / (paceTrend.length - 1)) * 100}%,${((p.pace - minPace) / (maxPace - minPace)) * 100}%`).join(' ')"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
              stroke-linecap="round"
            />

            <!-- Points -->
            <g v-for="(point, i) in paceTrend" :key="i">
              <circle
                :cx="`${(i / (paceTrend.length - 1)) * 100}%`"
                :cy="`${((point.pace - minPace) / (maxPace - minPace)) * 100}%`"
                r="6"
                fill="white"
                stroke="#22c55e"
                stroke-width="2"
              />
            </g>
          </svg>
        </div>
      </div>

      <!-- X-axis -->
      <div class="ml-14 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
        <span v-for="point in paceTrend" :key="point.date">{{ point.date }}</span>
      </div>

      <!-- Improvement badge -->
      <div class="mt-4 p-3 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-success-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-success-700 dark:text-success-300">Pace Improved by 10%!</p>
            <p class="text-sm text-success-600 dark:text-success-400">You're running 36 seconds faster per km than last month</p>
          </div>
        </div>
      </div>
    </NCard>

    <!-- Recent Sessions -->
    <NCard title="Recent Cardio Sessions">
      <div class="space-y-3">
        <div
          v-for="session in recentSessions"
          :key="session.id"
          class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
        >
          <!-- Activity icon -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md"
            :class="getActivityColor(session.type)"
          >
            <span class="text-2xl">{{ getActivityIcon(session.type) }}</span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ session.type }}</h4>
              <NTag v-if="session.pace" size="small" type="success">{{ session.pace }}'/km</NTag>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(session.date) }}</p>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-4 gap-4 text-center">
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ formatDuration(session.duration) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Duration</p>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ session.distance }}km</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Distance</p>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ session.calories }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Calories</p>
            </div>
            <div>
              <p class="font-semibold text-accent-600 dark:text-accent-400">{{ session.avgHR }} <span class="text-xs">bpm</span></p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Avg HR</p>
            </div>
          </div>
        </div>
      </div>
    </NCard>
    </template>
  </div>
</template>
