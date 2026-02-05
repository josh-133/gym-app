<script setup lang="ts">
import { NButton, NProgress, NCard, NModal, NInputNumber, NDatePicker } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const auth = useAuth()
const { activeGoals, fetchGoals, getProgressPercentage, getGoalTypeInfo, syncGoalsWithWorkouts } = useGoals()
const { formatVolume, weightUnit, isImperial, toMetricWeight } = useUnits()
const { addMeasurement, fetchMeasurements, latestMeasurement } = useBodyMeasurements()
const {
  nutritionGoals,
  dailyTotals,
  calorieProgress,
  proteinProgress,
  carbsProgress,
  fatProgress,
  fetchNutritionGoals,
  fetchFoodEntries,
} = useNutrition()
const notification = useNotification()
const {
  workouts: localWorkouts,
  loadWorkouts: loadLocalWorkouts,
  getPRsThisMonth,
  weeklyGoalTarget,
  setWeeklyGoalTarget,
  loadWeeklyGoal,
  getStagnantExercises,
  getDeloadRecommendation,
} = useWorkoutHistory()

// Weekly goal edit modal
const showWeeklyGoalModal = ref(false)
const editingWeeklyGoal = ref(5)

// Quick weight log modal
const showWeightModal = ref(false)
const savingWeight = ref(false)
const weightForm = ref({
  date: Date.now(),
  weight: null as number | null,
  bodyFat: null as number | null,
})

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

// Progressive overload alerts - exercises that haven't improved in 2+ weeks
const stagnantExercises = computed(() => getStagnantExercises(2).slice(0, 3))

// Deload recommendation
const deloadRecommendation = computed(() => getDeloadRecommendation())

const quickActions = [
  { label: 'Push', icon: 'chest' },
  { label: 'Pull', icon: 'back' },
  { label: 'Legs', icon: 'legs' },
  { label: 'Custom', icon: 'plus' },
]

// Load data on mount
onMounted(async () => {
  loadLocalWorkouts()
  loadWeeklyGoal()
  await fetchGoals()
  await fetchMeasurements()
  await fetchNutritionGoals()
  await fetchFoodEntries()

  // Auto-sync goals with workout data
  if (localWorkouts.value.length > 0 && activeGoals.value.length > 0) {
    const weeklyWorkouts = stats.value.workoutsThisWeek
    await syncGoalsWithWorkouts(localWorkouts.value, weeklyWorkouts)
  }

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

// Weight logging functions
function openWeightModal() {
  weightForm.value = {
    date: Date.now(),
    weight: null,
    bodyFat: null,
  }
  showWeightModal.value = true
}

async function saveWeight() {
  savingWeight.value = true
  try {
    await addMeasurement({
      measured_at: new Date(weightForm.value.date).toISOString(),
      weight_kg: toMetricWeight(weightForm.value.weight),
      body_fat_percent: weightForm.value.bodyFat,
    })
    showWeightModal.value = false
    notification.success('Weight logged!')
  } catch (err) {
    console.error('Error saving weight:', err)
    notification.error('Failed to save weight')
  } finally {
    savingWeight.value = false
  }
}

function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
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

    <!-- Quick Log Weight Card -->
    <div
      class="card p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
      @click="openWeightModal"
    >
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <div>
          <p class="font-semibold text-primary-900 dark:text-white">Log Weight</p>
          <p v-if="latestMeasurement?.weight_kg" class="text-sm text-gray-500 dark:text-gray-400">
            Last: {{ isImperial ? (latestMeasurement.weight_kg * 2.20462).toFixed(1) : latestMeasurement.weight_kg.toFixed(1) }}{{ weightUnit }}
          </p>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400">Track your body weight</p>
        </div>
      </div>
      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </div>

    <!-- Nutrition Widget -->
    <NuxtLink to="/nutrition" class="block">
      <div class="card p-4 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-primary-900 dark:text-white">Today's Nutrition</p>
              <p v-if="nutritionGoals" class="text-sm text-gray-500 dark:text-gray-400">
                {{ Math.round(dailyTotals.calories) }} / {{ nutritionGoals.daily_calories }} cal
              </p>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">Set your nutrition goals</p>
            </div>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <div v-if="nutritionGoals" class="space-y-2">
          <!-- Calorie Bar -->
          <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
              :style="{ width: `${calorieProgress}%` }"
            />
          </div>
          <!-- Macro Pills -->
          <div class="flex gap-2 text-xs">
            <span class="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              P: {{ Math.round(dailyTotals.protein_g) }}g
            </span>
            <span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              C: {{ Math.round(dailyTotals.carbs_g) }}g
            </span>
            <span class="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
              F: {{ Math.round(dailyTotals.fat_g) }}g
            </span>
          </div>
        </div>
      </div>
    </NuxtLink>

    <!-- Deload Recommendation Banner -->
    <div
      v-if="deloadRecommendation?.shouldDeload"
      class="card p-6 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
    >
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-1">
            Consider a Deload Week
          </h3>
          <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
            {{ deloadRecommendation.reason }}
          </p>
          <div class="flex items-center gap-4 text-xs text-blue-600 dark:text-blue-400">
            <span>{{ deloadRecommendation.weeksOfTraining }} weeks training</span>
            <span>{{ deloadRecommendation.avgWorkoutsPerWeek }} workouts/week</span>
            <span class="capitalize">Volume {{ deloadRecommendation.totalVolumeTrend }}</span>
          </div>
        </div>
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

    <!-- Progressive Overload Alerts -->
    <div v-if="stagnantExercises.length > 0" class="card p-6 border-l-4 border-amber-500">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Time to Push Harder</h2>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        These exercises haven't seen progress in a while. Consider increasing weight, reps, or trying a different variation.
      </p>
      <div class="space-y-3">
        <div
          v-for="ex in stagnantExercises"
          :key="ex.exercise"
          class="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ ex.exercise }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Last PR: {{ ex.lastPR?.weight }}kg × {{ ex.lastPR?.reps }} ({{ ex.daysSinceProgress }} days ago)
            </p>
          </div>
          <NuxtLink :to="`/workout/new`">
            <NButton size="small" type="primary" ghost>
              Train
            </NButton>
          </NuxtLink>
        </div>
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

    <!-- Two column layout for calendar and muscle balance -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Streak Calendar -->
      <DashboardStreakCalendar />

      <!-- Muscle Volume Balance -->
      <DashboardMuscleVolumeBalance />
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
          <span class="font-semibold text-primary-900 dark:text-white">{{ stats.workoutsThisWeek }} / {{ weeklyGoalTarget ?? 5 }}</span>
        </div>
        <NProgress
          type="line"
          :percentage="Math.min((stats.workoutsThisWeek / (weeklyGoalTarget ?? 5)) * 100, 100)"
          :height="8"
          :border-radius="4"
          :fill-border-radius="4"
          status="success"
        />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ (weeklyGoalTarget ?? 5) - stats.workoutsThisWeek > 0 ? `${(weeklyGoalTarget ?? 5) - stats.workoutsThisWeek} more to reach your goal!` : 'Goal achieved! Keep it up!' }}
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

    <!-- Quick Weight Log Modal -->
    <NModal
      v-model:show="showWeightModal"
      preset="card"
      title="Log Weight"
      :style="{ width: '90%', maxWidth: '400px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
          <NDatePicker v-model:value="weightForm.date" type="date" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight ({{ weightUnit }})</label>
            <NInputNumber v-model:value="weightForm.weight" :precision="1" :placeholder="isImperial ? '180' : '82'" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body Fat (%)</label>
            <NInputNumber v-model:value="weightForm.bodyFat" :precision="1" placeholder="15.0" class="w-full" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" :disabled="savingWeight" @click="showWeightModal = false">Cancel</NButton>
          <NButton type="primary" class="flex-1" :loading="savingWeight" @click="saveWeight">Save</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
