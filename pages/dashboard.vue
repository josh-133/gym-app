<script setup lang="ts">
import { NButton, NProgress, NCard, NModal, NInputNumber } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const auth = useAuth()
const { activeGoals, fetchGoals, getProgressPercentage, getGoalTypeInfo } = useGoals()
const {
  workouts: localWorkouts,
  loadWorkouts: loadLocalWorkouts,
  getPRsThisMonth,
  weeklyGoalTarget,
  setWeeklyGoalTarget,
  loadWeeklyGoal,
} = useWorkoutHistory()

// Weekly goal edit modal
const showWeeklyGoalModal = ref(false)
const editingWeeklyGoal = ref(5)

// Loading state
const loading = ref(true)

// Stats computed from local workout history
const stats = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Calculate from local workouts
  const totalWorkouts = localWorkouts.value.length
  const totalVolume = localWorkouts.value
    .filter(w => new Date(w.date) >= startOfMonth)
    .reduce((sum, w) => sum + (w.volume || 0), 0)

  const workoutsThisWeek = localWorkouts.value.filter(w => {
    const workoutDate = new Date(w.date)
    return workoutDate >= startOfWeek
  }).length

  // Calculate current streak
  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sortedWorkouts = [...localWorkouts.value].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const workoutDates = new Set(
    sortedWorkouts.map(w => {
      const d = new Date(w.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )

  let checkDate = new Date(today)
  if (!workoutDates.has(checkDate.getTime())) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (workoutDates.has(checkDate.getTime())) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return {
    workoutsThisWeek,
    totalWorkouts,
    currentStreak,
    totalVolume: Math.round(totalVolume),
    prsThisMonth: getPRsThisMonth().length,
  }
})

// Recent workouts from local storage
const recentWorkouts = computed(() => {
  return localWorkouts.value.slice(0, 5).map(w => ({
    id: w.id,
    name: w.name,
    date: w.date,
    duration: Math.round((w.duration || 0) / 60),
    exercises: w.exercises.length,
    volume: w.volume,
  }))
})

const quickActions = [
  { label: 'Push', icon: 'chest' },
  { label: 'Pull', icon: 'back' },
  { label: 'Legs', icon: 'legs' },
  { label: 'Custom', icon: 'plus' },
]

// Load data on mount
onMounted(() => {
  loadLocalWorkouts()
  loadWeeklyGoal()
  fetchGoals()
  loading.value = false
})

// Weekly goal editing
function openWeeklyGoalModal() {
  editingWeeklyGoal.value = weeklyGoalTarget.value
  showWeeklyGoalModal.value = true
}

function saveWeeklyGoal() {
  setWeeklyGoalTarget(editingWeeklyGoal.value)
  showWeeklyGoalModal.value = false
}

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
        <h1 class="text-2xl font-bold text-primary-900 dark:text-white">
          Welcome back, {{ auth.profile.value?.display_name || auth.profile.value?.username || 'Athlete' }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Ready to crush your workout today?
        </p>
      </div>
      <NuxtLink to="/workout/new">
        <NButton type="primary" size="large" class="!rounded-full !px-6">
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
      <div class="stat-card">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">This Week</p>
        <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ stats.workoutsThisWeek }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">workouts</p>
      </div>

      <!-- Current Streak -->
      <div class="stat-card">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Streak</p>
        <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ stats.currentStreak }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">days</p>
      </div>

      <!-- Total Volume -->
      <div class="stat-card">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Volume</p>
        <p class="text-3xl font-bold text-primary-900 dark:text-white">{{ formatVolume(stats.totalVolume) }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">this month</p>
      </div>

      <!-- PRs This Month -->
      <div class="stat-card">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">New PRs</p>
        <p class="text-3xl font-bold text-accent-500">{{ stats.prsThisMonth }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">this month</p>
      </div>
    </div>

    <!-- Goals Progress -->
    <div v-if="activeGoals.length > 0" class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">My Goals</h2>
        <NuxtLink to="/goals" class="text-sm text-primary-900 dark:text-white font-medium hover:underline">
          Manage
        </NuxtLink>
      </div>
      <div class="space-y-4">
        <div v-for="goal in activeGoals.slice(0, 3)" :key="goal.id" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ getGoalTypeInfo(goal.goal_type).icon }}</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ goal.title }}</span>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ goal.current_value }} / {{ goal.target_value }} {{ goal.unit }}
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="getProgressPercentage(goal)"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            :status="getProgressPercentage(goal) >= 100 ? 'success' : 'default'"
          />
        </div>
        <NuxtLink v-if="activeGoals.length > 3" to="/goals" class="block text-sm text-center text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
          View all {{ activeGoals.length }} goals
        </NuxtLink>
      </div>
    </div>

    <!-- Quick Start -->
    <div class="card p-6">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Quick Start</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.label"
          :to="`/workout/new?template=${action.label.toLowerCase()}`"
          class="group"
        >
          <div
            class="aspect-square rounded-2xl bg-gray-50 dark:bg-[#222222] border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transition-all group-hover:border-primary-900 dark:group-hover:border-white group-hover:bg-gray-100 dark:group-hover:bg-[#2a2a2a]"
          >
            <div class="w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-600 flex items-center justify-center mb-3 group-hover:border-primary-900 dark:group-hover:border-white transition-colors">
              <svg class="w-6 h-6 text-primary-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span class="text-primary-900 dark:text-white font-medium">{{ action.label }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Workouts -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recent Workouts</h2>
        <NuxtLink to="/workout" class="text-sm text-primary-900 dark:text-white font-medium hover:underline">
          View all
        </NuxtLink>
      </div>

      <div class="space-y-2">
        <NuxtLink
          v-for="workout in recentWorkouts"
          :key="workout.id"
          :to="`/workout/${workout.id}`"
          class="block"
        >
          <div class="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors">
            <!-- Icon -->
            <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-primary-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
              </svg>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-primary-900 dark:text-white truncate">
                {{ workout.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(workout.date) }} · {{ workout.exercises }} exercises
              </p>
            </div>

            <!-- Stats -->
            <div class="text-right flex-shrink-0">
              <p class="font-semibold text-primary-900 dark:text-white">
                {{ formatDuration(workout.duration) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatVolume(workout.volume) }}
              </p>
            </div>

            <!-- Arrow -->
            <svg class="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="recentWorkouts.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#222222] flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
          </svg>
        </div>
        <h3 class="font-medium text-primary-900 dark:text-white mb-1">No workouts yet</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">Start your first workout to see it here.</p>
        <NuxtLink to="/workout/new">
          <NButton type="primary" class="!rounded-full">Start Workout</NButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Weekly Goal -->
    <div class="card p-6 cursor-pointer hover:shadow-md transition-shadow" @click="openWeeklyGoalModal">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Weekly Goal</h2>
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-gray-600 dark:text-gray-400">Workouts completed</span>
          <span class="font-semibold text-primary-900 dark:text-white">{{ stats.workoutsThisWeek }} / {{ weeklyGoalTarget }}</span>
        </div>
        <NProgress
          type="line"
          :percentage="Math.min((stats.workoutsThisWeek / weeklyGoalTarget) * 100, 100)"
          :height="8"
          :border-radius="4"
          :fill-border-radius="4"
          status="success"
        />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ weeklyGoalTarget - stats.workoutsThisWeek > 0 ? `${weeklyGoalTarget - stats.workoutsThisWeek} more to reach your goal!` : 'Goal achieved! Keep it up!' }}
        </p>
      </div>
    </div>

    <!-- Weekly Goal Edit Modal -->
    <NModal
      v-model:show="showWeeklyGoalModal"
      preset="card"
      title="Edit Weekly Goal"
      :style="{ width: '90%', maxWidth: '350px' }"
    >
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          How many workouts do you want to complete each week?
        </p>
        <div class="flex items-center justify-center gap-4">
          <NInputNumber
            v-model:value="editingWeeklyGoal"
            :min="1"
            :max="7"
            size="large"
            :style="{ width: '120px' }"
          />
          <span class="text-gray-500 dark:text-gray-400">workouts / week</span>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showWeeklyGoalModal = false">Cancel</NButton>
          <NButton type="primary" class="flex-1" @click="saveWeeklyGoal">Save</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
