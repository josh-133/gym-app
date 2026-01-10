<script setup lang="ts">
import { NCard, NButton, NProgress, NStatistic } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const auth = useAuth()

// Mock data for demo - will be replaced with real data from Supabase
const stats = ref({
  workoutsThisWeek: 4,
  totalWorkouts: 127,
  currentStreak: 12,
  longestStreak: 21,
  totalVolume: 45250,
  prsThisMonth: 8,
})

const recentWorkouts = ref([
  {
    id: '1',
    name: 'Push Day',
    date: '2024-01-09',
    duration: 65,
    exercises: 6,
    volume: 4520,
  },
  {
    id: '2',
    name: 'Pull Day',
    date: '2024-01-08',
    duration: 58,
    exercises: 5,
    volume: 3890,
  },
  {
    id: '3',
    name: 'Leg Day',
    date: '2024-01-06',
    duration: 72,
    exercises: 7,
    volume: 6120,
  },
])

const quickActions = [
  { label: 'Push', icon: 'chest', color: 'from-accent-500 to-energy-500' },
  { label: 'Pull', icon: 'back', color: 'from-secondary-500 to-primary-500' },
  { label: 'Legs', icon: 'legs', color: 'from-success-500 to-secondary-500' },
  { label: 'Custom', icon: 'plus', color: 'from-primary-500 to-accent-500' },
]

function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

function formatVolume(kg: number) {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k kg`
  }
  return `${kg} kg`
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Welcome Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">
          <span class="gradient-text">Welcome back,</span>
          <span class="text-gray-900 dark:text-white">{{ auth.profile.value?.display_name || auth.profile.value?.username || 'Athlete' }}!</span>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Ready to crush your workout today?
        </p>
      </div>
      <NuxtLink to="/workout/new">
        <NButton type="primary" size="large" class="btn-glow">
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Start Workout
        </NButton>
      </NuxtLink>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Workouts This Week -->
      <NCard class="!bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 stat-card shadow-xl glow-primary">
        <div class="text-white">
          <p class="text-white/80 text-sm">This Week</p>
          <p class="text-3xl font-bold mt-1">{{ stats.workoutsThisWeek }}</p>
          <p class="text-white/60 text-sm mt-2">workouts</p>
        </div>
      </NCard>

      <!-- Current Streak -->
      <NCard class="!bg-gradient-to-br from-energy-500 to-accent-500 stat-card shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">Current Streak</p>
          <p class="text-3xl font-bold mt-1">{{ stats.currentStreak }}</p>
          <p class="text-white/60 text-sm mt-2">days</p>
        </div>
      </NCard>

      <!-- Total Volume -->
      <NCard class="!bg-gradient-to-br from-success-500 to-secondary-500 stat-card shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">Total Volume</p>
          <p class="text-3xl font-bold mt-1">{{ formatVolume(stats.totalVolume) }}</p>
          <p class="text-white/60 text-sm mt-2">this month</p>
        </div>
      </NCard>

      <!-- PRs This Month -->
      <NCard class="!bg-gradient-to-br from-warning-500 to-energy-500 stat-card shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">New PRs</p>
          <p class="text-3xl font-bold mt-1">{{ stats.prsThisMonth }}</p>
          <p class="text-white/60 text-sm mt-2">this month</p>
        </div>
      </NCard>
    </div>

    <!-- Quick Start -->
    <NCard title="Quick Start">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.label"
          :to="`/workout/new?template=${action.label.toLowerCase()}`"
          class="group"
        >
          <div
            class="aspect-square rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center transition-transform group-hover:scale-105"
            :class="action.color"
          >
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  v-if="action.icon === 'plus'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2"
                />
              </svg>
            </div>
            <span class="text-white font-semibold">{{ action.label }}</span>
          </div>
        </NuxtLink>
      </div>
    </NCard>

    <!-- Recent Workouts -->
    <NCard title="Recent Workouts">
      <template #header-extra>
        <NuxtLink to="/workout" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          View all
        </NuxtLink>
      </template>

      <div class="space-y-3">
        <NuxtLink
          v-for="workout in recentWorkouts"
          :key="workout.id"
          :to="`/workout/${workout.id}`"
          class="block"
        >
          <div class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all hover:shadow-md">
            <!-- Icon -->
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
              </svg>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                {{ workout.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(workout.date) }} · {{ workout.exercises }} exercises
              </p>
            </div>

            <!-- Stats -->
            <div class="text-right flex-shrink-0">
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ formatDuration(workout.duration) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatVolume(workout.volume) }}
              </p>
            </div>

            <!-- Arrow -->
            <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div v-if="recentWorkouts.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
          </svg>
        </div>
        <h3 class="font-medium text-gray-900 dark:text-white mb-1">No workouts yet</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">Start your first workout to see it here.</p>
        <NuxtLink to="/workout/new">
          <NButton type="primary">Start Workout</NButton>
        </NuxtLink>
      </div>
    </NCard>

    <!-- Weekly Progress -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Weekly Goal -->
      <NCard title="Weekly Goal">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Workouts completed</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ stats.workoutsThisWeek }} / 5</span>
          </div>
          <NProgress
            type="line"
            :percentage="(stats.workoutsThisWeek / 5) * 100"
            :height="12"
            :border-radius="6"
            :fill-border-radius="6"
            status="success"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ 5 - stats.workoutsThisWeek > 0 ? `${5 - stats.workoutsThisWeek} more to reach your goal!` : 'Goal achieved! Keep it up!' }}
          </p>
        </div>
      </NCard>

      <!-- AI Insight Preview -->
      <NCard title="AI Insight">
        <template #header-extra>
          <NuxtLink to="/insights" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all
          </NuxtLink>
        </template>

        <div class="flex gap-4">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-1">Great progress on bench press!</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              You've increased your bench press by 5kg over the last 4 weeks. Consider adding a deload week next week to optimize recovery.
            </p>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>
