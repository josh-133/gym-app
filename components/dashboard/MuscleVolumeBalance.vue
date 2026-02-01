<script setup lang="ts">
import { NCard, NProgress, NTag } from 'naive-ui'
import { EXERCISE_LIBRARY, type MuscleGroup } from '~/utils/exercises'

const { workouts } = useWorkoutHistory()

// Muscle groups to track
const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'abs'
]

// Calculate sets per muscle group for the past week
const weeklyVolume = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  const volume: Record<string, number> = {}
  muscleGroups.forEach(mg => volume[mg] = 0)

  // Get workouts from the last week
  const recentWorkouts = workouts.value.filter(w => new Date(w.date) >= startOfWeek)

  for (const workout of recentWorkouts) {
    for (const exercise of workout.exercises) {
      // Find the exercise in library to get muscle groups
      const libraryEx = EXERCISE_LIBRARY.find(e => e.name === exercise.name)
      if (libraryEx) {
        const completedSets = exercise.sets.filter(s => s.completed).length
        // Distribute sets to each muscle group (primary muscle gets more weight)
        libraryEx.muscleGroups.forEach((mg, idx) => {
          if (volume[mg] !== undefined) {
            // Primary muscle gets full sets, secondary gets half
            volume[mg] += idx === 0 ? completedSets : Math.round(completedSets * 0.5)
          }
        })
      }
    }
  }

  return volume
})

// Find max for percentage calculation
const maxVolume = computed(() => Math.max(...Object.values(weeklyVolume.value), 1))

// Get balance status
function getBalanceStatus(sets: number): { label: string; type: 'success' | 'warning' | 'error' | 'default' } {
  if (sets === 0) return { label: 'None', type: 'default' }
  if (sets < 6) return { label: 'Low', type: 'error' }
  if (sets < 12) return { label: 'Moderate', type: 'warning' }
  return { label: 'Good', type: 'success' }
}

// Format muscle group name
function formatMuscle(muscle: string): string {
  return muscle.charAt(0).toUpperCase() + muscle.slice(1).replace('_', ' ')
}

// Group muscles into push/pull/legs categories
const muscleCategories = computed(() => {
  return [
    {
      name: 'Push',
      muscles: ['chest', 'shoulders', 'triceps'],
      totalSets: weeklyVolume.value.chest + weeklyVolume.value.shoulders + weeklyVolume.value.triceps,
    },
    {
      name: 'Pull',
      muscles: ['back', 'biceps'],
      totalSets: weeklyVolume.value.back + weeklyVolume.value.biceps,
    },
    {
      name: 'Legs',
      muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
      totalSets: weeklyVolume.value.quads + weeklyVolume.value.hamstrings + weeklyVolume.value.glutes + weeklyVolume.value.calves,
    },
  ]
})

// Find imbalances (categories with significantly different volume)
const imbalances = computed(() => {
  const cats = muscleCategories.value
  const avgSets = cats.reduce((sum, c) => sum + c.totalSets, 0) / 3

  return cats
    .filter(c => c.totalSets < avgSets * 0.5 && avgSets > 5) // Less than half the average
    .map(c => c.name)
})

const hasData = computed(() => Object.values(weeklyVolume.value).some(v => v > 0))
</script>

<template>
  <NCard>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white">Muscle Balance</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Sets per muscle group this week</p>
      </div>
    </div>

    <template v-if="hasData">
      <!-- Category Summary -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div
          v-for="cat in muscleCategories"
          :key="cat.name"
          class="text-center p-3 rounded-lg"
          :class="imbalances.includes(cat.name)
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            : 'bg-gray-50 dark:bg-gray-800'"
        >
          <p class="text-lg font-bold text-gray-900 dark:text-white">{{ cat.totalSets }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ cat.name }}</p>
        </div>
      </div>

      <!-- Imbalance Warning -->
      <div v-if="imbalances.length > 0" class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div class="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Consider adding more {{ imbalances.join(' and ') }} exercises</span>
        </div>
      </div>

      <!-- Detailed Breakdown -->
      <div class="space-y-2">
        <div
          v-for="muscle in muscleGroups"
          :key="muscle"
          class="flex items-center gap-3"
        >
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400 truncate">
            {{ formatMuscle(muscle) }}
          </span>
          <div class="flex-1">
            <NProgress
              type="line"
              :percentage="(weeklyVolume[muscle] / maxVolume) * 100"
              :height="8"
              :border-radius="4"
              :show-indicator="false"
              :status="getBalanceStatus(weeklyVolume[muscle]).type === 'error' ? 'error' : 'success'"
            />
          </div>
          <span class="w-8 text-sm font-medium text-gray-900 dark:text-white text-right">
            {{ weeklyVolume[muscle] }}
          </span>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="text-center py-6">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-sm">Complete some workouts to see your muscle balance</p>
      </div>
    </template>
  </NCard>
</template>
