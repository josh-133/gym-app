<script setup lang="ts">
import { NCard, NEmpty, NTag, NTabs, NTabPane } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const { calculateAllPRs, loadWorkouts, getPRsThisMonth, calculateDayStreak } = useWorkoutHistory()
const { convertWeight, weightUnit } = useUnits()

// Day streak calculated from workout history
const dayStreak = computed(() => calculateDayStreak())

// Load workouts on mount
onMounted(() => {
  loadWorkouts()
})

// Personal records calculated from workout history (with unit conversion)
const personalRecords = computed(() => {
  const prs = calculateAllPRs()
  return prs.map(pr => ({
    id: pr.id,
    exercise: pr.exercise,
    value: convertWeight(pr.weight) ?? pr.weight,
    reps: pr.reps,
    unit: weightUnit.value,
    date: pr.date,
  })).sort((a, b) => a.exercise.localeCompare(b.exercise))
})

// Recent PRs (set this month) with unit conversion
const recentPRs = computed(() => {
  const prs = getPRsThisMonth()
  return prs.map(pr => ({
    id: pr.id,
    exercise: pr.exercise,
    value: convertWeight(pr.weight) ?? pr.weight,
    reps: pr.reps,
    unit: weightUnit.value,
    date: pr.date,
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// Calculate Big 3 total (bench, squat, deadlift) with unit conversion
const big3Total = computed(() => {
  const prs = calculateAllPRs()
  const bench = prs.find(pr => pr.exercise.toLowerCase().includes('bench press'))
  const squat = prs.find(pr => pr.exercise.toLowerCase().includes('squat') && !pr.exercise.toLowerCase().includes('split'))
  const deadlift = prs.find(pr => pr.exercise.toLowerCase().includes('deadlift') && !pr.exercise.toLowerCase().includes('romanian'))

  const totalKg = (bench?.weight || 0) + (squat?.weight || 0) + (deadlift?.weight || 0)
  if (totalKg <= 0) return null
  return convertWeight(totalKg)
})

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Personal Records</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Your all-time bests</p>
    </div>

    <!-- No Data State -->
    <div v-if="personalRecords.length === 0" class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
        <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Personal Records Yet</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Complete workouts and lift heavier to set your first personal records!</p>
      <NuxtLink to="/workout/new" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-white text-white dark:text-primary-900 rounded-xl font-medium hover:opacity-90 transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Start a Workout
      </NuxtLink>
    </div>

    <template v-else>
    <!-- Stats Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <NCard class="text-center">
        <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ personalRecords.length }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total PRs</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ recentPRs.length }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent PRs</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{{ big3Total ? big3Total : '—' }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total (Big 3) {{ weightUnit }}</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">{{ dayStreak || '—' }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Day Streak</p>
      </NCard>
    </div>

    <!-- Tabs -->
    <NTabs type="line" animated>
      <!-- All PRs -->
      <NTabPane name="all" tab="All Records">
        <div class="space-y-3 mt-4">
          <NCard v-for="pr in personalRecords" :key="pr.id">
            <div class="flex items-center gap-4">
              <!-- Trophy Icon -->
              <div class="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <!-- Info -->
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ pr.exercise }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(pr.date) }}</p>
              </div>

              <!-- Value -->
              <div class="text-right">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ pr.value }}<span class="text-sm font-normal text-gray-500 ml-1">{{ pr.unit }}</span>
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ pr.reps }} reps
                </p>
              </div>
            </div>
          </NCard>

          <NEmpty v-if="personalRecords.length === 0" description="No personal records yet. Start lifting!" />
        </div>
      </NTabPane>

      <!-- Recent -->
      <NTabPane name="recent" tab="Recent">
        <div class="space-y-3 mt-4">
          <NCard v-for="pr in recentPRs" :key="pr.id">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>

              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ pr.exercise }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(pr.date) }}</p>
              </div>

              <div class="text-right">
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ pr.value }}<span class="text-sm font-normal text-gray-500 ml-1">{{ pr.unit }}</span>
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ pr.reps }} reps
                </p>
              </div>
            </div>
          </NCard>

          <NEmpty v-if="recentPRs.length === 0" description="No new PRs this month yet. Keep pushing!" />
        </div>
      </NTabPane>
    </NTabs>
    </template>
  </div>
</template>
