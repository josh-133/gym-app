<script setup lang="ts">
import { NButton, NProgress } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const { $supabase } = useNuxtApp()
const auth = useAuth()

// Loading state
const loading = ref(true)

// Stats with default values
const stats = ref({
  workoutsThisWeek: 0,
  totalWorkouts: 0,
  currentStreak: 0,
  totalVolume: 0,
  prsThisMonth: 0,
})

// Recent workouts from database
interface RecentWorkout {
  id: string
  name: string
  date: string
  duration: number
  exercises: number
  volume: number
}
const recentWorkouts = ref<RecentWorkout[]>([])

const quickActions = [
  { label: 'Push', icon: 'chest' },
  { label: 'Pull', icon: 'back' },
  { label: 'Legs', icon: 'legs' },
  { label: 'Custom', icon: 'plus' },
]

// Fetch dashboard data
async function fetchDashboardData() {
  if (!$supabase || !auth.user.value) {
    loading.value = false
    return
  }

  try {
    const userId = auth.user.value.id
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch recent workouts with exercise count
    const { data: workouts, error: workoutsError } = await $supabase
      .from('workout_sessions')
      .select(`
        id,
        name,
        started_at,
        duration_sec,
        exercise_logs (
          id,
          sets (
            weight_kg,
            reps
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(5)

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError)
    } else if (workouts) {
      recentWorkouts.value = workouts.map(w => {
        // Calculate volume (sum of weight * reps for all sets)
        let volume = 0
        const exerciseCount = w.exercise_logs?.length || 0

        w.exercise_logs?.forEach(log => {
          log.sets?.forEach(set => {
            if (set.weight_kg && set.reps) {
              volume += set.weight_kg * set.reps
            }
          })
        })

        return {
          id: w.id,
          name: w.name,
          date: w.started_at,
          duration: Math.round((w.duration_sec || 0) / 60), // Convert to minutes
          exercises: exerciseCount,
          volume: Math.round(volume),
        }
      })
    }

    // Fetch total workouts count
    const { count: totalCount } = await $supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    stats.value.totalWorkouts = totalCount || 0

    // Fetch workouts this week
    const { count: weekCount } = await $supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', startOfWeek.toISOString())

    stats.value.workoutsThisWeek = weekCount || 0

    // Fetch PRs this month
    const { count: prCount } = await $supabase
      .from('personal_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('achieved_at', startOfMonth.toISOString())

    stats.value.prsThisMonth = prCount || 0

    // Calculate total volume this month
    const { data: monthWorkouts } = await $supabase
      .from('workout_sessions')
      .select(`
        exercise_logs (
          sets (
            weight_kg,
            reps
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', startOfMonth.toISOString())

    let totalVolume = 0
    monthWorkouts?.forEach(w => {
      w.exercise_logs?.forEach(log => {
        log.sets?.forEach(set => {
          if (set.weight_kg && set.reps) {
            totalVolume += set.weight_kg * set.reps
          }
        })
      })
    })
    stats.value.totalVolume = Math.round(totalVolume)

    // Calculate current streak
    const { data: allWorkouts } = await $supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })

    if (allWorkouts && allWorkouts.length > 0) {
      let streak = 0
      let currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)

      // Create a set of workout dates
      const workoutDates = new Set(
        allWorkouts.map(w => {
          const d = new Date(w.started_at)
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        })
      )

      // Check if worked out today or yesterday to start streak
      const todayStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`
      const yesterday = new Date(currentDate)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`

      if (workoutDates.has(todayStr) || workoutDates.has(yesterdayStr)) {
        // Start from today or yesterday and count backwards
        let checkDate = workoutDates.has(todayStr) ? currentDate : yesterday

        while (true) {
          const checkStr = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
          if (workoutDates.has(checkStr)) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
          } else {
            break
          }
        }
      }

      stats.value.currentStreak = streak
    }

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// Fetch data on mount
onMounted(() => {
  fetchDashboardData()
})

// Refetch when user changes
watch(() => auth.user.value?.id, () => {
  if (auth.user.value) {
    fetchDashboardData()
  }
})

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

    <!-- Weekly Progress & AI Insight -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Weekly Goal -->
      <div class="card p-6">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Weekly Goal</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Workouts completed</span>
            <span class="font-semibold text-primary-900 dark:text-white">{{ stats.workoutsThisWeek }} / 5</span>
          </div>
          <NProgress
            type="line"
            :percentage="(stats.workoutsThisWeek / 5) * 100"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            status="success"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ 5 - stats.workoutsThisWeek > 0 ? `${5 - stats.workoutsThisWeek} more to reach your goal!` : 'Goal achieved! Keep it up!' }}
          </p>
        </div>
      </div>

      <!-- AI Insight Preview -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">AI Insight</h2>
          <NuxtLink to="/insights" class="text-sm text-primary-900 dark:text-white font-medium hover:underline">
            View all
          </NuxtLink>
        </div>

        <div class="flex gap-4">
          <div class="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div v-if="stats.totalWorkouts > 0">
            <h4 class="font-medium text-primary-900 dark:text-white mb-1">Keep up the momentum!</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              You've completed {{ stats.totalWorkouts }} workout{{ stats.totalWorkouts !== 1 ? 's' : '' }}. Log more workouts to unlock personalized AI insights and recommendations.
            </p>
          </div>
          <div v-else>
            <h4 class="font-medium text-primary-900 dark:text-white mb-1">Start tracking your workouts</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Complete your first workout to unlock AI-powered insights and personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
