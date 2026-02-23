<script setup lang="ts">
import { NCard, NButton, NSelect, NTag } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const { workouts, loadWorkouts } = useWorkoutHistory()
const { formatVolume } = useUnits()
const route = useRoute()

// Selected workout IDs
const workoutA = ref<string | null>(route.query.a as string || null)
const workoutB = ref<string | null>(route.query.b as string || null)

// Workout options for the select
const workoutOptions = computed(() => {
  return workouts.value.map(w => ({
    label: `${w.name} — ${new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    value: w.id,
  }))
})

// Selected workouts
const selectedA = computed(() => workouts.value.find(w => w.id === workoutA.value))
const selectedB = computed(() => workouts.value.find(w => w.id === workoutB.value))

// Comparison data
const comparison = computed(() => {
  if (!selectedA.value || !selectedB.value) return null

  const a = selectedA.value
  const b = selectedB.value

  // Build exercise maps
  const exercisesA = new Map(a.exercises.map(e => [e.name, e]))
  const exercisesB = new Map(b.exercises.map(e => [e.name, e]))

  // All unique exercises
  const allExercises = [...new Set([...exercisesA.keys(), ...exercisesB.keys()])]

  const exerciseComparisons = allExercises.map(name => {
    const exA = exercisesA.get(name)
    const exB = exercisesB.get(name)

    const volumeA = exA ? exA.sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0) : 0
    const volumeB = exB ? exB.sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0) : 0

    const bestWeightA = exA ? Math.max(...exA.sets.filter(s => s.completed).map(s => s.weight || 0)) : 0
    const bestWeightB = exB ? Math.max(...exB.sets.filter(s => s.completed).map(s => s.weight || 0)) : 0

    const setsA = exA ? exA.sets.filter(s => s.completed).length : 0
    const setsB = exB ? exB.sets.filter(s => s.completed).length : 0

    return {
      name,
      inA: !!exA,
      inB: !!exB,
      volumeA,
      volumeB,
      volumeChange: volumeA > 0 ? ((volumeB - volumeA) / volumeA) * 100 : (volumeB > 0 ? 100 : 0),
      bestWeightA,
      bestWeightB,
      weightChange: bestWeightA > 0 ? bestWeightB - bestWeightA : 0,
      setsA,
      setsB,
    }
  })

  return {
    totalVolumeA: a.volume,
    totalVolumeB: b.volume,
    durationA: a.duration,
    durationB: b.duration,
    exerciseCountA: a.exercises.length,
    exerciseCountB: b.exercises.length,
    exercises: exerciseComparisons,
  }
})

onMounted(() => {
  loadWorkouts()
})

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  const hrs = Math.floor(mins / 60)
  const m = mins % 60
  return hrs > 0 ? `${hrs}h ${m}m` : `${m}m`
}

function changeClass(value: number): string {
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-500 dark:text-gray-400'
}

function changePrefix(value: number): string {
  return value > 0 ? '+' : ''
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
    <div class="flex items-center gap-4">
      <NuxtLink to="/workout">
        <NButton quaternary circle>
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </template>
        </NButton>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Compare Workouts</h1>
    </div>

    <!-- Selectors -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Workout A (older)</label>
        <NSelect
          v-model:value="workoutA"
          :options="workoutOptions"
          placeholder="Select first workout"
          filterable
        />
      </div>
      <div>
        <label class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Workout B (newer)</label>
        <NSelect
          v-model:value="workoutB"
          :options="workoutOptions"
          placeholder="Select second workout"
          filterable
        />
      </div>
    </div>

    <!-- Comparison Results -->
    <template v-if="comparison">
      <!-- Summary Stats -->
      <div class="grid grid-cols-3 gap-4">
        <NCard>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Volume</p>
            <p class="text-sm text-gray-500">{{ formatVolume(comparison.totalVolumeA) }}</p>
            <p class="text-lg font-bold" :class="changeClass(comparison.totalVolumeB - comparison.totalVolumeA)">
              {{ formatVolume(comparison.totalVolumeB) }}
            </p>
          </div>
        </NCard>
        <NCard>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
            <p class="text-sm text-gray-500">{{ formatDuration(comparison.durationA) }}</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ formatDuration(comparison.durationB) }}</p>
          </div>
        </NCard>
        <NCard>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Exercises</p>
            <p class="text-sm text-gray-500">{{ comparison.exerciseCountA }}</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ comparison.exerciseCountB }}</p>
          </div>
        </NCard>
      </div>

      <!-- Per-Exercise Comparison -->
      <NCard title="Exercise Breakdown">
        <div class="space-y-3">
          <div
            v-for="ex in comparison.exercises"
            :key="ex.name"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white truncate">{{ ex.name }}</p>
                <NTag v-if="!ex.inA" size="tiny" type="success">New</NTag>
                <NTag v-if="!ex.inB" size="tiny" type="warning">Removed</NTag>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ ex.setsA }} sets &rarr; {{ ex.setsB }} sets
              </p>
            </div>

            <div class="text-right flex-shrink-0 ml-4">
              <p v-if="ex.weightChange !== 0" class="text-sm font-medium" :class="changeClass(ex.weightChange)">
                {{ changePrefix(ex.weightChange) }}{{ ex.weightChange }}kg
              </p>
              <p v-if="ex.inA && ex.inB" class="text-xs" :class="changeClass(ex.volumeChange)">
                {{ changePrefix(ex.volumeChange) }}{{ Math.round(ex.volumeChange) }}% vol
              </p>
            </div>
          </div>
        </div>
      </NCard>
    </template>

    <!-- Empty State -->
    <div v-else-if="workoutA || workoutB" class="text-center py-12 text-gray-500 dark:text-gray-400">
      Select both workouts to see comparison
    </div>
  </div>
</template>
