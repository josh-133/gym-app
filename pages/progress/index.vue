<script setup lang="ts">
import { NCard, NStatistic, NProgress } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const { workouts, loadWorkouts } = useWorkoutHistory()

// Load workouts on mount
onMounted(() => {
  loadWorkouts()
})

// Computed stats from workout history
const stats = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Calculate total volume from all workouts
  const totalVolume = workouts.value.reduce((sum, w) => sum + (w.volume || 0), 0)

  // Calculate total duration (convert seconds to minutes)
  const totalDuration = workouts.value.reduce((sum, w) => sum + Math.floor((w.duration || 0) / 60), 0)

  // Count workouts this week
  const workoutsThisWeek = workouts.value.filter(w => {
    const workoutDate = new Date(w.date)
    return workoutDate >= startOfWeek
  }).length

  // Count workouts this month
  const workoutsThisMonth = workouts.value.filter(w => {
    const workoutDate = new Date(w.date)
    return workoutDate >= startOfMonth
  }).length

  // Calculate current streak (consecutive days with workouts)
  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Sort workouts by date descending
  const sortedWorkouts = [...workouts.value].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Get unique workout dates
  const workoutDates = new Set(
    sortedWorkouts.map(w => {
      const d = new Date(w.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )

  // Check consecutive days starting from today or yesterday
  let checkDate = new Date(today)
  // If no workout today, start from yesterday
  if (!workoutDates.has(checkDate.getTime())) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (workoutDates.has(checkDate.getTime())) {
    currentStreak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  // Calculate average workout duration
  const averageWorkoutDuration = workouts.value.length > 0
    ? Math.floor(totalDuration / workouts.value.length)
    : 0

  return {
    totalWorkouts: workouts.value.length,
    totalVolume,
    totalDuration,
    currentStreak,
    longestStreak: currentStreak, // Simplified - would need full history analysis for accurate longest
    averageWorkoutDuration,
    workoutsThisWeek,
    workoutsThisMonth,
    prsThisMonth: 0, // PRs not tracked yet
  }
})

// Calculate weekly volume for the chart
const weeklyVolume = computed(() => {
  if (workouts.value.length === 0) return []

  const weeks: { [key: string]: number } = {}
  const now = new Date()

  // Get last 4 weeks
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() - (i * 7))
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeks[weekLabel] = 0

    workouts.value.forEach(w => {
      const workoutDate = new Date(w.date)
      if (workoutDate >= weekStart && workoutDate < weekEnd) {
        weeks[weekLabel] += w.volume || 0
      }
    })
  }

  return Object.entries(weeks)
    .map(([week, volume]) => ({ week, volume }))
    .reverse()
})

// Calculate muscle distribution from workout exercises
const muscleDistribution = computed(() => {
  if (workouts.value.length === 0) return []

  const muscleCounts: { [key: string]: number } = {}

  workouts.value.forEach(workout => {
    workout.exercises.forEach(exercise => {
      // Try to match exercise name to muscle group
      const name = exercise.name.toLowerCase()
      if (name.includes('chest') || name.includes('bench') || name.includes('fly') || name.includes('press') && !name.includes('leg')) {
        muscleCounts['Chest'] = (muscleCounts['Chest'] || 0) + 1
      }
      if (name.includes('back') || name.includes('row') || name.includes('pull') || name.includes('lat')) {
        muscleCounts['Back'] = (muscleCounts['Back'] || 0) + 1
      }
      if (name.includes('shoulder') || name.includes('delt') || name.includes('raise')) {
        muscleCounts['Shoulders'] = (muscleCounts['Shoulders'] || 0) + 1
      }
      if (name.includes('bicep') || name.includes('curl')) {
        muscleCounts['Biceps'] = (muscleCounts['Biceps'] || 0) + 1
      }
      if (name.includes('tricep') || name.includes('pushdown') || name.includes('extension') && !name.includes('leg')) {
        muscleCounts['Triceps'] = (muscleCounts['Triceps'] || 0) + 1
      }
      if (name.includes('leg') || name.includes('squat') || name.includes('quad')) {
        muscleCounts['Legs'] = (muscleCounts['Legs'] || 0) + 1
      }
      if (name.includes('glute') || name.includes('hip')) {
        muscleCounts['Glutes'] = (muscleCounts['Glutes'] || 0) + 1
      }
      if (name.includes('calf') || name.includes('calves')) {
        muscleCounts['Calves'] = (muscleCounts['Calves'] || 0) + 1
      }
    })
  })

  const total = Object.values(muscleCounts).reduce((sum, count) => sum + count, 0)
  if (total === 0) return []

  return Object.entries(muscleCounts)
    .map(([muscle, count]) => ({
      muscle,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
})

// Analytics navigation cards
const analyticsCards = [
  {
    title: 'Strength Analytics',
    description: 'Track exercise progress, PRs, and volume trends',
    icon: 'strength',
    to: '/progress/strength',
    gradient: 'from-primary-500 via-accent-500 to-secondary-500',
  },
  {
    title: 'Cardio Analytics',
    description: 'Monitor heart rate zones, pace, and calories',
    icon: 'cardio',
    to: '/progress/cardio',
    gradient: 'from-energy-500 via-warning-500 to-accent-500',
  },
  {
    title: 'Body Stats',
    description: 'Track weight, measurements, and progress photos',
    icon: 'body',
    to: '/progress/body',
    gradient: 'from-success-500 via-secondary-500 to-primary-500',
  },
]

function formatVolume(kg: number) {
  if (kg >= 1000000) {
    return `${(kg / 1000000).toFixed(1)}M kg`
  }
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k kg`
  }
  return `${kg} kg`
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes % 60}m`
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">
        <span class="gradient-text">Progress</span>
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Track your fitness journey</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <NCard class="!bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 stat-card shadow-xl glow-primary">
        <div class="text-white">
          <p class="text-white/80 text-sm">Total Workouts</p>
          <p class="text-3xl font-bold mt-1">{{ stats.totalWorkouts }}</p>
          <p class="text-white/60 text-sm mt-2">all time</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-energy-500 to-accent-500 stat-card shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">Total Volume</p>
          <p class="text-3xl font-bold mt-1">{{ formatVolume(stats.totalVolume) }}</p>
          <p class="text-white/60 text-sm mt-2">lifted</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-success-500 to-secondary-500 stat-card shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">Total Time</p>
          <p class="text-3xl font-bold mt-1">{{ formatDuration(stats.totalDuration) }}</p>
          <p class="text-white/60 text-sm mt-2">training</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-warning-500 to-energy-500 stat-card shadow-xl">
        <div class="text-white">
          <p class="text-white/80 text-sm">Current Streak</p>
          <p class="text-3xl font-bold mt-1">{{ stats.currentStreak }}</p>
          <p class="text-white/60 text-sm mt-2">days</p>
        </div>
      </NCard>
    </div>

    <!-- Analytics Navigation Cards -->
    <div class="grid md:grid-cols-3 gap-6">
      <NuxtLink
        v-for="card in analyticsCards"
        :key="card.to"
        :to="card.to"
        class="group block"
      >
        <NCard class="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
          <!-- Gradient Header -->
          <div
            class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br opacity-90"
            :class="card.gradient"
          />

          <!-- Icon -->
          <div class="relative z-10 mb-4">
            <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <!-- Strength Icon -->
              <svg v-if="card.icon === 'strength'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
              </svg>
              <!-- Cardio Icon -->
              <svg v-else-if="card.icon === 'cardio'" class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <!-- Body Icon -->
              <svg v-else class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="relative z-10 mt-8">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ card.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ card.description }}
            </p>

          </div>

          <!-- Arrow -->
          <div class="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
            <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NCard>
      </NuxtLink>
    </div>

    <!-- Overview Section -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Weekly Goal -->
      <NCard title="Weekly Goal">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Workouts this week</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ stats.workoutsThisWeek }} / 5</span>
          </div>
          <NProgress
            type="line"
            :percentage="(stats.workoutsThisWeek / 5) * 100"
            :height="12"
            :border-radius="6"
            status="success"
          />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ 5 - stats.workoutsThisWeek > 0 ? `${5 - stats.workoutsThisWeek} more to reach your goal!` : 'Goal achieved! Keep it up!' }}
          </p>
        </div>
      </NCard>

      <!-- Monthly Summary -->
      <NCard title="This Month">
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl">
            <p class="text-3xl font-bold gradient-text">{{ stats.workoutsThisMonth }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Workouts</p>
          </div>
          <div class="text-center p-4 bg-gradient-to-br from-energy-50 to-warning-50 dark:from-energy-900/20 dark:to-warning-900/20 rounded-xl">
            <p class="text-3xl font-bold text-energy-600 dark:text-energy-400">{{ stats.prsThisMonth }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">New PRs</p>
          </div>
        </div>
      </NCard>

      <!-- Volume Chart -->
      <NCard title="Weekly Volume">
        <div v-if="weeklyVolume.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No volume data yet</p>
          <p class="text-sm mt-1">Complete workouts to see your weekly volume</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="week in weeklyVolume"
            :key="week.week"
            class="flex items-center gap-4"
          >
            <span class="w-16 text-sm text-gray-500 dark:text-gray-400">{{ week.week }}</span>
            <div class="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500 rounded-full transition-all"
                :style="{ width: `${(week.volume / 16000) * 100}%` }"
              />
            </div>
            <span class="w-20 text-right text-sm font-medium text-gray-900 dark:text-white">
              {{ formatVolume(week.volume) }}
            </span>
          </div>
        </div>
      </NCard>

      <!-- Muscle Distribution -->
      <NCard title="Muscle Distribution">
        <div v-if="muscleDistribution.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No muscle data yet</p>
          <p class="text-sm mt-1">Log exercises to see muscle distribution</p>
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="(item, index) in muscleDistribution"
            :key="item.muscle"
            class="flex items-center gap-4"
          >
            <span class="w-20 text-sm text-gray-500 dark:text-gray-400">{{ item.muscle }}</span>
            <div class="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="[
                  index === 0 ? 'bg-gradient-to-r from-primary-500 to-accent-500' :
                  index === 1 ? 'bg-gradient-to-r from-secondary-500 to-primary-500' :
                  index === 2 ? 'bg-gradient-to-r from-accent-500 to-energy-500' :
                  index === 3 ? 'bg-gradient-to-r from-success-500 to-secondary-500' :
                  'bg-gradient-to-r from-warning-500 to-energy-500'
                ]"
                :style="{ width: `${item.percentage}%` }"
              />
            </div>
            <span class="w-12 text-right text-sm font-medium text-gray-900 dark:text-white">
              {{ item.percentage }}%
            </span>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>
