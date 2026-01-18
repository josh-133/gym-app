<script setup lang="ts">
import { NButton, NModal } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const { workouts, loadWorkouts } = useWorkoutHistory()

// Current displayed month
const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)
const showDayModal = ref(false)

// Navigation
function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function goToToday() {
  currentDate.value = new Date()
}

// Calendar data
const monthName = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  // First day of the month
  const firstDay = new Date(year, month, 1)
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)

  const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = []

  // Add days from previous month to fill the first week
  const startPadding = firstDay.getDay()
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({ date, isCurrentMonth: false, isToday: false })
  }

  // Add days of current month
  const today = new Date()
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const isToday = date.toDateString() === today.toDateString()
    days.push({ date, isCurrentMonth: true, isToday })
  }

  // Add days from next month to complete the last week
  const endPadding = 6 - lastDay.getDay()
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, month + 1, i)
    days.push({ date, isCurrentMonth: false, isToday: false })
  }

  return days
})

// Map workouts to dates
type Workout = typeof workouts.value[number]
const workoutsByDate = computed(() => {
  const map = new Map<string, Workout[]>()

  workouts.value.forEach(workout => {
    const dateKey = new Date(workout.date).toDateString()
    if (!map.has(dateKey)) {
      map.set(dateKey, [])
    }
    map.get(dateKey)!.push(workout)
  })

  return map
})

function getWorkoutsForDate(date: Date) {
  return workoutsByDate.value.get(date.toDateString()) || []
}

function hasWorkout(date: Date) {
  return workoutsByDate.value.has(date.toDateString())
}

// Selected day workouts
const selectedDayWorkouts = computed(() => {
  if (!selectedDate.value) return []
  return getWorkoutsForDate(selectedDate.value)
})

function selectDate(date: Date) {
  selectedDate.value = date
  if (hasWorkout(date)) {
    showDayModal.value = true
  }
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) {
    return `${hrs}h ${mins % 60}m`
  }
  return `${mins}m`
}

function formatVolume(kg: number) {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k kg`
  }
  return `${kg} kg`
}

// Stats
const monthlyStats = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const monthWorkouts = workouts.value.filter(w => {
    const date = new Date(w.date)
    return date.getFullYear() === year && date.getMonth() === month
  })

  return {
    totalWorkouts: monthWorkouts.length,
    totalVolume: monthWorkouts.reduce((sum, w) => sum + w.volume, 0),
    totalDuration: monthWorkouts.reduce((sum, w) => sum + w.duration, 0),
  }
})

// Streak calculation
const currentStreak = computed(() => {
  if (workouts.value.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Sort workouts by date descending
  const sortedDates = [...new Set(workouts.value.map(w => new Date(w.date).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime())

  if (sortedDates.length === 0) return 0

  // Check if most recent workout was today or yesterday
  const mostRecent = sortedDates[0]
  mostRecent.setHours(0, 0, 0, 0)

  const dayDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))
  if (dayDiff > 1) return 0

  // Count consecutive days
  let checkDate = new Date(mostRecent)
  for (const date of sortedDates) {
    date.setHours(0, 0, 0, 0)
    if (date.toDateString() === checkDate.toDateString()) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (date < checkDate) {
      break
    }
  }

  return streak
})

onMounted(() => {
  loadWorkouts()
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-primary-900 dark:text-white">Workout Calendar</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Track your training consistency</p>
      </div>
      <NButton @click="goToToday" class="!rounded-full">
        Today
      </NButton>
    </div>

    <!-- Monthly Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="stat-card">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">This Month</p>
        <p class="text-2xl font-bold text-primary-900 dark:text-white">{{ monthlyStats.totalWorkouts }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500">workouts</p>
      </div>
      <div class="stat-card">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Volume</p>
        <p class="text-2xl font-bold text-primary-900 dark:text-white">{{ formatVolume(monthlyStats.totalVolume) }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500">lifted</p>
      </div>
      <div class="stat-card">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Streak</p>
        <p class="text-2xl font-bold text-accent-500">{{ currentStreak }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500">days</p>
      </div>
    </div>

    <!-- Calendar -->
    <div class="card p-6">
      <!-- Month Navigation -->
      <div class="flex items-center justify-between mb-6">
        <button
          @click="previousMonth"
          class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="text-lg font-semibold text-primary-900 dark:text-white">{{ monthName }}</h2>
        <button
          @click="nextMonth"
          class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Day Headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="day in daysOfWeek"
          :key="day"
          class="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="(day, index) in calendarDays"
          :key="index"
          @click="selectDate(day.date)"
          class="aspect-square p-1 rounded-xl transition-all relative"
          :class="[
            day.isCurrentMonth
              ? 'text-primary-900 dark:text-white'
              : 'text-gray-300 dark:text-gray-600',
            day.isToday
              ? 'ring-2 ring-accent-500'
              : '',
            hasWorkout(day.date) && day.isCurrentMonth
              ? 'bg-accent-100 dark:bg-accent-900/30 hover:bg-accent-200 dark:hover:bg-accent-900/50'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800',
          ]"
        >
          <span class="text-sm font-medium">{{ day.date.getDate() }}</span>

          <!-- Workout Indicator -->
          <div
            v-if="hasWorkout(day.date) && day.isCurrentMonth"
            class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5"
          >
            <div
              v-for="(_, i) in Math.min(getWorkoutsForDate(day.date).length, 3)"
              :key="i"
              class="w-1.5 h-1.5 rounded-full bg-accent-500"
            ></div>
          </div>
        </button>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full ring-2 ring-accent-500"></div>
        <span>Today</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-accent-500"></div>
        <span>Workout day</span>
      </div>
    </div>

    <!-- Day Detail Modal -->
    <NModal v-model:show="showDayModal" preset="card" class="max-w-md" :title="selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })">
      <div class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ selectedDayWorkouts.length }} workout{{ selectedDayWorkouts.length !== 1 ? 's' : '' }}
        </p>

        <div v-for="workout in selectedDayWorkouts" :key="workout.id" class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
          <div class="flex items-start justify-between mb-2">
            <div>
              <h4 class="font-semibold text-primary-900 dark:text-white">{{ workout.name }}</h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ workout.exercises.length }} exercises · {{ formatDuration(workout.duration) }}
              </p>
            </div>
            <span class="text-sm font-medium text-accent-500">
              {{ formatVolume(workout.volume) }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <span
              v-for="exercise in workout.exercises.slice(0, 4)"
              :key="exercise.name"
              class="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {{ exercise.name }}
            </span>
            <span
              v-if="workout.exercises.length > 4"
              class="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              +{{ workout.exercises.length - 4 }} more
            </span>
          </div>

          <NuxtLink :to="`/workout/${workout.id}`" class="block mt-3">
            <NButton block size="small" class="!rounded-full">
              View Details
            </NButton>
          </NuxtLink>
        </div>

        <div v-if="selectedDayWorkouts.length === 0" class="text-center py-8">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400">No workouts on this day</p>
          <NuxtLink to="/workout/new" class="inline-block mt-3">
            <NButton type="primary" size="small" class="!rounded-full">
              Start Workout
            </NButton>
          </NuxtLink>
        </div>
      </div>
    </NModal>
  </div>
</template>
