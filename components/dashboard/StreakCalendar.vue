<script setup lang="ts">
import { NCard, NTooltip } from 'naive-ui'

const { getWorkoutDates, calculateDayStreak } = useWorkoutHistory()

// Generate last 12 weeks of dates
const calendarData = computed(() => {
  const workoutDates = getWorkoutDates()
  const workoutMap = new Map(workoutDates.map(d => [d.date, d.count]))

  const weeks: { date: Date; dateStr: string; count: number; isToday: boolean }[][] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from 12 weeks ago, aligned to Sunday
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (12 * 7) - startDate.getDay())

  let currentWeek: typeof weeks[0] = []

  for (let i = 0; i <= 12 * 7 + today.getDay(); i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const dateStr = date.toISOString().split('T')[0]
    const count = workoutMap.get(dateStr) || 0
    const isToday = date.getTime() === today.getTime()

    currentWeek.push({ date, dateStr, count, isToday })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return weeks
})

const currentStreak = computed(() => calculateDayStreak())

// Get color intensity based on workout count
function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
  if (count === 1) return 'bg-green-200 dark:bg-green-900'
  if (count === 2) return 'bg-green-400 dark:bg-green-700'
  return 'bg-green-600 dark:bg-green-500'
}

// Format date for tooltip
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Month labels
const monthLabels = computed(() => {
  const labels: { label: string; col: number }[] = []
  let lastMonth = -1

  calendarData.value.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0]
    if (firstDayOfWeek) {
      const month = firstDayOfWeek.date.getMonth()
      if (month !== lastMonth) {
        labels.push({
          label: firstDayOfWeek.date.toLocaleDateString('en-US', { month: 'short' }),
          col: weekIndex,
        })
        lastMonth = month
      }
    }
  })

  return labels
})
</script>

<template>
  <NCard>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white">Workout Streak</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Your activity over the last 12 weeks</p>
      </div>
      <div class="text-right">
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ currentStreak }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">day streak</p>
      </div>
    </div>

    <!-- Month Labels -->
    <div class="flex gap-0.5 mb-1 ml-8 text-xs text-gray-400 dark:text-gray-500">
      <div
        v-for="(label, idx) in monthLabels"
        :key="idx"
        class="absolute"
        :style="{ marginLeft: `${label.col * 14}px` }"
      >
        {{ label.label }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="flex gap-1">
      <!-- Day labels -->
      <div class="flex flex-col gap-0.5 text-xs text-gray-400 dark:text-gray-500 pr-1">
        <span class="h-3"></span>
        <span class="h-3">M</span>
        <span class="h-3"></span>
        <span class="h-3">W</span>
        <span class="h-3"></span>
        <span class="h-3">F</span>
        <span class="h-3"></span>
      </div>

      <!-- Weeks -->
      <div class="flex gap-0.5 overflow-x-auto">
        <div
          v-for="(week, weekIdx) in calendarData"
          :key="weekIdx"
          class="flex flex-col gap-0.5"
        >
          <NTooltip
            v-for="day in week"
            :key="day.dateStr"
            trigger="hover"
          >
            <template #trigger>
              <div
                class="w-3 h-3 rounded-sm transition-colors cursor-pointer"
                :class="[
                  getIntensityClass(day.count),
                  day.isToday ? 'ring-1 ring-indigo-500 ring-offset-1' : ''
                ]"
              />
            </template>
            <div class="text-center">
              <p class="font-medium">{{ formatDate(day.date) }}</p>
              <p class="text-sm">
                {{ day.count === 0 ? 'No workouts' : `${day.count} workout${day.count > 1 ? 's' : ''}` }}
              </p>
            </div>
          </NTooltip>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
      <span>Less</span>
      <div class="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
      <div class="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900"></div>
      <div class="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700"></div>
      <div class="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500"></div>
      <span>More</span>
    </div>
  </NCard>
</template>
