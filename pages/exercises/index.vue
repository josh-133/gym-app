<script setup lang="ts">
import { NCard, NButton, NInput, NSelect, NEmpty, NTag } from 'naive-ui'
import { EXERCISE_LIBRARY, type ExerciseDefinition, type MuscleGroup, type ExerciseCategory } from '~/utils/exercises'

definePageMeta({
  middleware: ['auth'],
})

// Use the exercise library (excluding warmup exercises from main list)
const exercises = computed(() => {
  return EXERCISE_LIBRARY.filter(ex => ex.category !== 'warmup')
})

const search = ref('')
const categoryFilter = ref<ExerciseCategory | null>(null)
const muscleFilter = ref<MuscleGroup | null>(null)

const categoryOptions = [
  { label: 'All Categories', value: null },
  { label: 'Strength', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Flexibility', value: 'flexibility' },
]

const muscleOptions = [
  { label: 'All Muscles', value: null },
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Biceps', value: 'biceps' },
  { label: 'Triceps', value: 'triceps' },
  { label: 'Quads', value: 'quads' },
  { label: 'Hamstrings', value: 'hamstrings' },
  { label: 'Glutes', value: 'glutes' },
  { label: 'Calves', value: 'calves' },
  { label: 'Abs', value: 'abs' },
]

const filteredExercises = computed(() => {
  return exercises.value.filter(e => {
    const matchesSearch = !search.value ||
      e.name.toLowerCase().includes(search.value.toLowerCase()) ||
      e.muscleGroups.some(m => m.includes(search.value.toLowerCase()))

    const matchesCategory = !categoryFilter.value || e.category === categoryFilter.value
    const matchesMuscle = !muscleFilter.value || e.muscleGroups.includes(muscleFilter.value)

    return matchesSearch && matchesCategory && matchesMuscle
  })
})

function formatMuscleGroups(groups: string[]) {
  return groups.map(g => g.replace('_', ' ')).slice(0, 3)
}

function getCategoryColor(category: ExerciseCategory) {
  switch (category) {
    case 'strength': return 'info'
    case 'cardio': return 'success'
    case 'flexibility': return 'warning'
    default: return 'default'
  }
}

function getDifficultyColor(difficulty: string | null) {
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
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Exercise Library</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Browse and search {{ exercises.length }} exercises</p>
      </div>
    </div>

    <!-- Filters -->
    <NCard>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <NInput
            v-model:value="search"
            placeholder="Search exercises..."
            size="large"
          >
            <template #prefix>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </template>
          </NInput>
        </div>
        <NSelect
          v-model:value="categoryFilter"
          :options="categoryOptions"
          placeholder="Category"
          class="w-full sm:w-40"
        />
        <NSelect
          v-model:value="muscleFilter"
          :options="muscleOptions"
          placeholder="Muscle"
          class="w-full sm:w-40"
        />
      </div>
    </NCard>

    <!-- Exercise Grid -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="exercise in filteredExercises"
        :key="exercise.id"
        :to="`/exercises/${exercise.id}`"
        class="block"
      >
        <NCard class="h-full hover:shadow-lg transition-shadow">
          <!-- Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <svg v-if="exercise.category === 'strength'" class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
              </svg>
              <svg v-else class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="flex gap-1">
              <NTag :type="getCategoryColor(exercise.category)" size="small">
                {{ exercise.category }}
              </NTag>
              <NTag v-if="exercise.difficulty" :type="getDifficultyColor(exercise.difficulty)" size="small">
                {{ exercise.difficulty }}
              </NTag>
            </div>
          </div>

          <!-- Content -->
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
            {{ exercise.name }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span v-if="exercise.isCompound">Compound</span>
            <span v-else>Isolation</span>
            · {{ exercise.difficulty }}
          </p>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1">
            <span
              v-for="muscle in formatMuscleGroups(exercise.muscleGroups)"
              :key="muscle"
              class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full capitalize"
            >
              {{ muscle }}
            </span>
            <span
              v-if="exercise.muscleGroups.length > 3"
              class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
            >
              +{{ exercise.muscleGroups.length - 3 }}
            </span>
          </div>
        </NCard>
      </NuxtLink>
    </div>

    <!-- Empty State -->
    <NEmpty v-if="filteredExercises.length === 0" description="No exercises found">
      <template #extra>
        <NButton @click="search = ''; categoryFilter = null; muscleFilter = null">
          Clear Filters
        </NButton>
      </template>
    </NEmpty>
  </div>
</template>
