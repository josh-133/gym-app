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

// Border accent color based on weekly sets
function getBorderColor(muscle: string): string {
  const sets = muscleVolume.value.get(muscle) || 0
  if (sets === 0) return '#d1d5db' // gray-300
  if (sets < 5) return '#f59e0b'   // amber-500
  if (sets < 10) return '#22c55e'  // green-500
  if (sets < 15) return '#16a34a'  // green-600
  return '#15803d'                 // green-700
}

function getBorderDarkColor(muscle: string): string {
  const sets = muscleVolume.value.get(muscle) || 0
  if (sets === 0) return '#4b5563' // gray-600
  if (sets < 5) return '#d97706'   // amber-600
  if (sets < 10) return '#16a34a'  // green-600
  if (sets < 15) return '#15803d'  // green-700
  return '#166534'                 // green-800
}

// Number color matches the intensity — always readable on neutral card bg
function getNumberColor(muscle: string): string {
  const sets = muscleVolume.value.get(muscle) || 0
  if (sets === 0) return 'text-gray-400 dark:text-gray-500'
  if (sets < 5) return 'text-amber-600 dark:text-amber-400'
  if (sets < 10) return 'text-green-600 dark:text-green-400'
  if (sets < 15) return 'text-green-700 dark:text-green-400'
  return 'text-green-800 dark:text-green-300'
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
        class="rounded-lg p-3 text-center transition-all bg-gray-50 dark:bg-gray-800/60 border-l-4"
        :style="{
          borderLeftColor: getBorderColor(muscle.id),
        }"
      >
        <p class="text-xs font-medium text-gray-600 dark:text-gray-400">
          {{ muscle.label }}
        </p>
        <p class="text-lg font-bold" :class="getNumberColor(muscle.id)">
          {{ getSets(muscle.id) }}
        </p>
        <p class="text-[10px] text-gray-400 dark:text-gray-500">
          sets
        </p>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600"></div>
        <span>0</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-amber-500"></div>
        <span>1-4</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-500"></div>
        <span>5-9</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-600"></div>
        <span>10-14</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-700"></div>
        <span>15+</span>
      </div>
    </div>
  </div>
</template>
