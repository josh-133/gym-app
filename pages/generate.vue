<script setup lang="ts">
import { NCard, NButton, NSpin, NSlider, NTag } from 'naive-ui'
import type { MuscleGroup, Equipment } from '~/utils/exercises'
import UpgradeModal from '~/components/subscription/UpgradeModal.vue'

definePageMeta({
  middleware: ['auth'],
})

const { session } = useAuth()
const { isPremium } = useSubscription()
const workoutStore = useWorkoutStore()
const router = useRouter()

const showUpgradeModal = ref(false)

// Form state
const workoutType = ref<'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'custom'>('push')
const customMuscleGroups = ref<MuscleGroup[]>([])
const duration = ref<30 | 45 | 60 | 75 | 90>(45)
const equipment = ref<Equipment[]>(['barbell', 'dumbbell', 'bodyweight'])
const experienceLevel = ref<'beginner' | 'intermediate' | 'advanced'>('intermediate')
const goal = ref<'strength' | 'hypertrophy' | 'endurance' | 'general'>('hypertrophy')

// UI state
const isGenerating = ref(false)
const error = ref<string | null>(null)
const generatedWorkout = ref<GeneratedWorkout | null>(null)

interface GeneratedExercise {
  exerciseId: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  intensity?: string
}

interface GeneratedWorkout {
  name: string
  estimatedDuration: number
  targetMuscleGroups: MuscleGroup[]
  warmup: GeneratedExercise[]
  mainWorkout: GeneratedExercise[]
  cooldown?: GeneratedExercise[]
}

const workoutTypes = [
  { value: 'push', label: 'Push', icon: '💪' },
  { value: 'pull', label: 'Pull', icon: '🔙' },
  { value: 'legs', label: 'Legs', icon: '🦵' },
  { value: 'upper', label: 'Upper', icon: '👆' },
  { value: 'lower', label: 'Lower', icon: '👇' },
  { value: 'full_body', label: 'Full Body', icon: '🏋️' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
]

const muscleGroups: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'core', label: 'Core' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
]

const equipmentOptions: { value: Equipment; label: string; icon: string }[] = [
  { value: 'barbell', label: 'Barbell', icon: '🏋️' },
  { value: 'dumbbell', label: 'Dumbbells', icon: '💪' },
  { value: 'kettlebell', label: 'Kettlebells', icon: '🔔' },
  { value: 'cable', label: 'Cables', icon: '🔗' },
  { value: 'machine', label: 'Machines', icon: '⚙️' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '🤸' },
  { value: 'bands', label: 'Bands', icon: '〰️' },
]

const experienceLevels = [
  { value: 'beginner', label: 'Beginner', description: '0-1 years' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years' },
  { value: 'advanced', label: 'Advanced', description: '3+ years' },
]

const goals = [
  { value: 'strength', label: 'Strength', description: 'Heavy weights, low reps' },
  { value: 'hypertrophy', label: 'Muscle Growth', description: 'Moderate weights, 8-12 reps' },
  { value: 'endurance', label: 'Endurance', description: 'Light weights, high reps' },
  { value: 'general', label: 'General Fitness', description: 'Balanced approach' },
]

const durationMarks = {
  30: '30m',
  45: '45m',
  60: '60m',
  75: '75m',
  90: '90m',
}

function toggleEquipment(eq: Equipment) {
  const index = equipment.value.indexOf(eq)
  if (index === -1) {
    equipment.value.push(eq)
  } else if (equipment.value.length > 1) {
    equipment.value.splice(index, 1)
  }
}

function toggleMuscleGroup(mg: MuscleGroup) {
  const index = customMuscleGroups.value.indexOf(mg)
  if (index === -1) {
    customMuscleGroups.value.push(mg)
  } else {
    customMuscleGroups.value.splice(index, 1)
  }
}

async function generateWorkout() {
  if (!isPremium.value) {
    showUpgradeModal.value = true
    return
  }

  if (workoutType.value === 'custom' && customMuscleGroups.value.length === 0) {
    error.value = 'Please select at least one muscle group for custom workouts.'
    return
  }

  isGenerating.value = true
  error.value = null

  try {
    const response = await $fetch('/api/ai/generate-workout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.value?.access_token}`,
      },
      body: {
        workoutType: workoutType.value,
        customMuscleGroups: workoutType.value === 'custom' ? customMuscleGroups.value : undefined,
        duration: duration.value,
        equipment: equipment.value,
        experienceLevel: experienceLevel.value,
        goal: goal.value,
      },
    })

    generatedWorkout.value = response.workout
  } catch (e: unknown) {
    console.error('Failed to generate workout:', e)
    const errorMessage = e && typeof e === 'object' && 'data' in e
      ? (e as { data?: { message?: string } }).data?.message
      : undefined
    error.value = errorMessage || 'Failed to generate workout. Please try again.'
  } finally {
    isGenerating.value = false
  }
}

function formatRestTime(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }
  return `${seconds}s`
}

function startWorkout() {
  if (!generatedWorkout.value) return

  // Convert generated workout to workout store format
  const exercises = generatedWorkout.value.mainWorkout.map(ex => ({
    id: crypto.randomUUID(),
    name: ex.name,
    sets: Array.from({ length: ex.sets }, () => ({
      id: crypto.randomUUID(),
      weight: null,
      reps: null,
      completed: false,
    })),
    notes: ex.notes || '',
    restSeconds: ex.restSeconds,
  }))

  // Start the workout with generated exercises
  workoutStore.startWorkout(generatedWorkout.value.name, exercises)
  router.push('/workout/active')
}

function regenerate() {
  generatedWorkout.value = null
  generateWorkout()
}

function goBack() {
  generatedWorkout.value = null
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">AI Workout Generator</h1>
        <p class="text-gray-500 dark:text-gray-400">Create a personalized workout with Claude AI</p>
      </div>
    </div>

    <!-- Generated Workout Preview -->
    <template v-if="generatedWorkout">
      <NCard class="!border-violet-200 dark:!border-violet-800">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <span class="text-xl">✨</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ generatedWorkout.name }}</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ generatedWorkout.estimatedDuration }} min · {{ generatedWorkout.targetMuscleGroups.join(', ') }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <NButton quaternary @click="goBack">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </NButton>
            <NButton secondary @click="regenerate" :loading="isGenerating">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </NButton>
          </div>
        </div>

        <!-- Warmup -->
        <div v-if="generatedWorkout.warmup.length > 0" class="mb-6">
          <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Warmup</h3>
          <div class="space-y-2">
            <div
              v-for="(ex, index) in generatedWorkout.warmup"
              :key="ex.exerciseId + index"
              class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
            >
              <span class="text-sm text-gray-400 w-6">{{ index + 1 }}</span>
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">{{ ex.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ ex.sets }} × {{ ex.reps }}
                  <span v-if="ex.intensity"> · {{ ex.intensity }}</span>
                </p>
              </div>
              <span class="text-sm text-gray-400">{{ formatRestTime(ex.restSeconds) }} rest</span>
            </div>
          </div>
        </div>

        <!-- Main Workout -->
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Main Workout</h3>
          <div class="space-y-2">
            <div
              v-for="(ex, index) in generatedWorkout.mainWorkout"
              :key="ex.exerciseId + index"
              class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <div class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <span class="text-sm font-bold text-violet-600 dark:text-violet-400">{{ index + 1 }}</span>
              </div>
              <div class="flex-1">
                <p class="font-semibold text-gray-900 dark:text-white">{{ ex.name }}</p>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm text-gray-600 dark:text-gray-300">{{ ex.sets }} × {{ ex.reps }}</span>
                  <span v-if="ex.intensity" class="text-sm text-violet-600 dark:text-violet-400">{{ ex.intensity }}</span>
                  <span class="text-sm text-gray-400">{{ formatRestTime(ex.restSeconds) }} rest</span>
                </div>
                <p v-if="ex.notes" class="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">{{ ex.notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Start Button -->
        <NButton type="primary" size="large" block @click="startWorkout" class="!rounded-xl">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start This Workout
        </NButton>
      </NCard>
    </template>

    <!-- Preferences Form -->
    <template v-else>
      <!-- Error State -->
      <NCard v-if="error" class="!bg-red-50 dark:!bg-red-900/20 border-red-200 dark:border-red-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
            <span class="text-xl">⚠️</span>
          </div>
          <div class="flex-1">
            <p class="font-medium text-red-900 dark:text-red-100">Unable to generate workout</p>
            <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
          </div>
          <NButton text @click="error = null">Dismiss</NButton>
        </div>
      </NCard>

      <!-- Loading State -->
      <NCard v-if="isGenerating" class="!bg-violet-50 dark:!bg-violet-900/20">
        <div class="py-8 text-center">
          <NSpin size="large" />
          <p class="text-violet-900 dark:text-violet-100 font-medium mt-4">Generating your workout...</p>
          <p class="text-sm text-violet-700 dark:text-violet-300 mt-1">Claude AI is crafting a personalized routine</p>
        </div>
      </NCard>

      <!-- Workout Type -->
      <NCard v-if="!isGenerating" title="What do you want to train?">
        <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
          <button
            v-for="type in workoutTypes"
            :key="type.value"
            @click="workoutType = type.value as typeof workoutType"
            :class="[
              'p-3 rounded-xl border-2 transition-all text-center',
              workoutType === type.value
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <span class="text-2xl block mb-1">{{ type.icon }}</span>
            <span class="text-xs font-medium" :class="workoutType === type.value ? 'text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400'">
              {{ type.label }}
            </span>
          </button>
        </div>

        <!-- Custom Muscle Groups -->
        <div v-if="workoutType === 'custom'" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Select target muscle groups:</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="mg in muscleGroups"
              :key="mg.value"
              @click="toggleMuscleGroup(mg.value)"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                customMuscleGroups.includes(mg.value)
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              ]"
            >
              {{ mg.label }}
            </button>
          </div>
        </div>
      </NCard>

      <!-- Duration -->
      <NCard v-if="!isGenerating" title="How long do you have?">
        <div class="px-2">
          <NSlider
            v-model:value="duration"
            :min="30"
            :max="90"
            :step="15"
            :marks="durationMarks"
            :format-tooltip="(v: number) => `${v} minutes`"
          />
        </div>
        <p class="text-center text-lg font-semibold text-violet-600 dark:text-violet-400 mt-4">
          {{ duration }} minutes
        </p>
      </NCard>

      <!-- Equipment -->
      <NCard v-if="!isGenerating" title="Available Equipment">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Select all equipment you have access to:</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            v-for="eq in equipmentOptions"
            :key="eq.value"
            @click="toggleEquipment(eq.value)"
            :class="[
              'p-3 rounded-xl border-2 transition-all text-left',
              equipment.includes(eq.value)
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <span class="text-xl">{{ eq.icon }}</span>
            <span class="block text-sm font-medium mt-1" :class="equipment.includes(eq.value) ? 'text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400'">
              {{ eq.label }}
            </span>
          </button>
        </div>
      </NCard>

      <!-- Experience Level -->
      <NCard v-if="!isGenerating" title="Your Experience Level">
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="level in experienceLevels"
            :key="level.value"
            @click="experienceLevel = level.value as typeof experienceLevel"
            :class="[
              'p-4 rounded-xl border-2 transition-all text-center',
              experienceLevel === level.value
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <span class="block font-semibold" :class="experienceLevel === level.value ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'">
              {{ level.label }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ level.description }}</span>
          </button>
        </div>
      </NCard>

      <!-- Training Goal -->
      <NCard v-if="!isGenerating" title="Training Goal">
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="g in goals"
            :key="g.value"
            @click="goal = g.value as typeof goal"
            :class="[
              'p-4 rounded-xl border-2 transition-all text-left',
              goal === g.value
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <span class="block font-semibold" :class="goal === g.value ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'">
              {{ g.label }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ g.description }}</span>
          </button>
        </div>
      </NCard>

      <!-- Generate Button -->
      <NButton
        v-if="!isGenerating"
        type="primary"
        size="large"
        block
        :loading="isGenerating"
        @click="generateWorkout"
        class="!rounded-xl !bg-gradient-to-r !from-violet-500 !to-purple-600"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Generate Workout
      </NButton>

      <!-- Upgrade Modal -->
      <UpgradeModal v-model:show="showUpgradeModal" />
    </template>
  </div>
</template>
