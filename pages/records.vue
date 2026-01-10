<script setup lang="ts">
import { NCard, NEmpty, NTag, NTabs, NTabPane } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

// Mock PR data
const personalRecords = ref([
  { id: '1', exercise: 'Bench Press', value: 100, unit: 'kg', date: '2024-01-08', improvement: 5 },
  { id: '2', exercise: 'Squat', value: 140, unit: 'kg', date: '2024-01-06', improvement: 10 },
  { id: '3', exercise: 'Deadlift', value: 180, unit: 'kg', date: '2024-01-04', improvement: 5 },
  { id: '4', exercise: 'Overhead Press', value: 60, unit: 'kg', date: '2024-01-02', improvement: 2.5 },
  { id: '5', exercise: 'Barbell Row', value: 80, unit: 'kg', date: '2023-12-28', improvement: 5 },
  { id: '6', exercise: 'Pull-up', value: 15, unit: 'reps', date: '2023-12-25', improvement: 2 },
])

const recentPRs = computed(() => {
  return [...personalRecords.value].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5)
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

    <!-- Stats Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <NCard class="text-center">
        <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ personalRecords.length }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total PRs</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ recentPRs.length }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">This Month</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">420</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total (Big 3) kg</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">7</p>
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
                <NTag type="success" size="small">
                  +{{ pr.improvement }} {{ pr.unit }}
                </NTag>
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
              </div>
            </div>
          </NCard>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>
