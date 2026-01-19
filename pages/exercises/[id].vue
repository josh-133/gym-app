<script setup lang="ts">
import { NCard, NButton, NTag, NEmpty, NTabs, NTabPane } from 'naive-ui'
import { EXERCISE_LIBRARY, type ExerciseDefinition } from '~/utils/exercises'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const exerciseId = route.params.id as string

const { customExercisesAsDefinitions, fetchCustomExercises } = useCustomExercises()

// Fetch custom exercises on mount
onMounted(() => {
  fetchCustomExercises()
})

// Find exercise from the library or custom exercises
const exercise = computed<ExerciseDefinition | null>(() => {
  // First check the built-in library
  const libraryExercise = EXERCISE_LIBRARY.find(ex => ex.id === exerciseId)
  if (libraryExercise) return libraryExercise

  // Then check custom exercises
  const customExercise = customExercisesAsDefinitions.value.find(ex => ex.id === exerciseId)
  if (customExercise) return customExercise

  return null
})

// Check if this is a custom exercise
const isCustom = computed(() => exerciseId.includes('-') && exerciseId.length > 20)

// Empty history - would come from user's workout data in a real app
const history = ref<{ date: string; sets: number; bestWeight: number; bestReps: number; volume: number }[]>([])

// No personal record until user logs workouts
const personalRecord = ref<{ weight: number; reps: number; date: string } | null>(null)

const loading = ref(false)
const notFound = computed(() => !exercise.value)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'success'
    case 'intermediate': return 'warning'
    case 'advanced': return 'error'
    default: return 'default'
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <!-- Not Found State -->
    <NCard v-else-if="notFound" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Exercise Not Found</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4">The exercise you're looking for doesn't exist or has been removed.</p>
      <NuxtLink to="/exercises">
        <NButton type="primary">Browse Exercises</NButton>
      </NuxtLink>
    </NCard>

    <!-- Exercise Content -->
    <template v-else-if="exercise">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <NuxtLink to="/exercises" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block">
            ← Back to exercises
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ exercise.name }}</h1>
          <div class="flex flex-wrap gap-2 mt-2">
            <NTag v-if="isCustom" type="warning">Custom</NTag>
            <NTag :type="getDifficultyColor(exercise.difficulty)">{{ exercise.difficulty }}</NTag>
            <NTag>{{ exercise.category }}</NTag>
            <NTag v-if="exercise.isCompound" type="info">Compound</NTag>
            <NTag v-else type="default">Isolation</NTag>
          </div>
        </div>
        <div class="flex gap-2">
          <NuxtLink to="/workout/new">
            <NButton type="primary">
              <template #icon>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </template>
              Start Workout
            </NButton>
          </NuxtLink>
        </div>
      </div>

      <!-- PR Card - only show if user has a personal record -->
      <NCard v-if="personalRecord" class="!bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
            <svg class="w-7 h-7 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-yellow-700 dark:text-yellow-300">Personal Record</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ personalRecord.weight }}kg × {{ personalRecord.reps }} reps
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Set on {{ formatDate(personalRecord.date) }}</p>
          </div>
        </div>
      </NCard>

      <!-- Tabs -->
      <NTabs type="line" animated>
        <!-- Overview Tab -->
        <NTabPane name="overview" tab="Overview">
          <div class="space-y-6 mt-4">
            <!-- Exercise Info -->
            <NCard title="About This Exercise">
              <div class="space-y-4">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Target Muscles</p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="muscle in exercise.muscleGroups"
                      :key="muscle"
                      class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm capitalize"
                    >
                      {{ muscle.replace('_', ' ') }}
                    </span>
                  </div>
                </div>

                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Equipment Needed</p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="eq in exercise.equipment"
                      :key="eq"
                      class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm capitalize"
                    >
                      {{ eq.replace('_', ' ') }}
                    </span>
                  </div>
                </div>

                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Exercise Type</p>
                  <p class="text-gray-700 dark:text-gray-300">
                    {{ exercise.isCompound ? 'Compound movement (works multiple muscle groups)' : 'Isolation exercise (focuses on a single muscle group)' }}
                  </p>
                </div>

                <div v-if="exercise.instructions">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Instructions</p>
                  <p class="text-gray-600 dark:text-gray-300">{{ exercise.instructions }}</p>
                </div>
              </div>
            </NCard>
          </div>
        </NTabPane>

        <!-- History Tab -->
        <NTabPane name="history" tab="History">
          <div class="space-y-3 mt-4">
            <NCard v-for="session in history" :key="session.date">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(session.date) }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ session.sets }} sets</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ session.bestWeight }}kg × {{ session.bestReps }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ session.volume }}kg volume
                  </p>
                </div>
              </div>
            </NCard>

            <div v-if="history.length === 0" class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-gray-500 dark:text-gray-400 mb-4">No workout history yet for this exercise</p>
              <NuxtLink to="/workout/new">
                <NButton type="primary">Start a Workout</NButton>
              </NuxtLink>
            </div>
          </div>
        </NTabPane>
      </NTabs>
    </template>
  </div>
</template>
