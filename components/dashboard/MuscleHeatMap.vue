<script setup lang="ts">
/**
 * Body diagram colored by training volume per muscle group
 * Green = well-trained, yellow = moderate, grey = under-trained
 */

const { workouts } = useWorkoutHistory()
import { EXERCISE_LIBRARY } from '~/utils/exercises'

// Calculate weekly volume (sets) per muscle group
const muscleVolume = computed(() => {
  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000

  const volume = new Map<string, number>()

  workouts.value.forEach(w => {
    if (new Date(w.date).getTime() < weekAgo) return

    w.exercises.forEach(ex => {
      const libraryEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
      if (!libraryEx) return

      const completedSets = ex.sets.filter(s => s.completed).length

      libraryEx.muscleGroups.forEach(muscle => {
        volume.set(muscle, (volume.get(muscle) || 0) + completedSets)
      })
    })
  })

  return volume
})

// Color intensity based on weekly sets
function getColor(muscle: string): string {
  const sets = muscleVolume.value.get(muscle) || 0
  if (sets === 0) return '#e5e7eb' // gray-200
  if (sets < 5) return '#fde68a'   // amber-200
  if (sets < 10) return '#86efac'  // green-300
  if (sets < 15) return '#4ade80'  // green-400
  return '#22c55e'                 // green-500
}

function getDarkColor(muscle: string): string {
  const sets = muscleVolume.value.get(muscle) || 0
  if (sets === 0) return '#374151' // gray-700
  if (sets < 5) return '#92400e'   // amber-800
  if (sets < 10) return '#166534'  // green-800
  if (sets < 15) return '#15803d'  // green-700
  return '#16a34a'                 // green-600
}

function getSets(muscle: string): number {
  return muscleVolume.value.get(muscle) || 0
}

const muscles = [
  { id: 'chest', label: 'Chest', x: 50, y: 22 },
  { id: 'shoulders', label: 'Shoulders', x: 30, y: 16 },
  { id: 'biceps', label: 'Biceps', x: 22, y: 30 },
  { id: 'triceps', label: 'Triceps', x: 78, y: 30 },
  { id: 'abs', label: 'Abs', x: 50, y: 38 },
  { id: 'quads', label: 'Quads', x: 40, y: 58 },
  { id: 'hamstrings', label: 'Hamstrings', x: 60, y: 58 },
  { id: 'glutes', label: 'Glutes', x: 50, y: 48 },
  { id: 'calves', label: 'Calves', x: 40, y: 78 },
  { id: 'back', label: 'Back', x: 70, y: 22 },
  { id: 'lats', label: 'Lats', x: 25, y: 22 },
  { id: 'traps', label: 'Traps', x: 50, y: 12 },
  { id: 'forearms', label: 'Forearms', x: 18, y: 40 },
]
</script>

<template>
  <div class="card p-6">
    <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
      Muscle Heat Map
      <span class="text-xs font-normal lowercase ml-1">(last 7 days)</span>
    </h2>

    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
      <div
        v-for="muscle in muscles"
        :key="muscle.id"
        class="rounded-lg p-3 text-center transition-all"
        :style="{
          backgroundColor: getColor(muscle.id),
        }"
        :class="getSets(muscle.id) === 0 ? 'dark:!bg-gray-800' : ''"
      >
        <p class="text-xs font-medium" :class="getSets(muscle.id) > 5 ? 'text-white dark:text-white' : 'text-gray-700 dark:text-gray-300'">
          {{ muscle.label }}
        </p>
        <p class="text-lg font-bold" :class="getSets(muscle.id) > 5 ? 'text-white dark:text-white' : 'text-gray-900 dark:text-white'">
          {{ getSets(muscle.id) }}
        </p>
        <p class="text-[10px]" :class="getSets(muscle.id) > 5 ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'">
          sets
        </p>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700"></div>
        <span>0</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-amber-200"></div>
        <span>1-4</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-300"></div>
        <span>5-9</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-400"></div>
        <span>10-14</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-500"></div>
        <span>15+</span>
      </div>
    </div>
  </div>
</template>
