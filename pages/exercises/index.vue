<script setup lang="ts">
import { NCard, NButton, NInput, NSelect, NEmpty, NTag, NModal, NForm, NFormItem, NCheckbox } from 'naive-ui'
import { EXERCISE_LIBRARY, type ExerciseDefinition, type MuscleGroup, type ExerciseCategory, type Equipment } from '~/utils/exercises'

definePageMeta({
  middleware: ['auth'],
})

const { customExercisesAsDefinitions, fetchCustomExercises, addCustomExercise, deleteCustomExercise, loading: customLoading } = useCustomExercises()

// Fetch custom exercises on mount
onMounted(() => {
  fetchCustomExercises()
})

// Combine library exercises with custom exercises
const exercises = computed(() => {
  const libraryExercises = EXERCISE_LIBRARY.filter(ex => ex.category !== 'warmup')
  return [...customExercisesAsDefinitions.value, ...libraryExercises]
})

// Modal state
const showAddModal = ref(false)
const saving = ref(false)
const newExercise = ref({
  name: '',
  category: 'strength' as ExerciseCategory,
  muscleGroups: [] as MuscleGroup[],
  equipment: [] as Equipment[],
  difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
  isCompound: false,
})

function resetForm() {
  newExercise.value = {
    name: '',
    category: 'strength',
    muscleGroups: [],
    equipment: [],
    difficulty: 'intermediate',
    isCompound: false,
  }
}

async function handleAddExercise() {
  if (!newExercise.value.name.trim() || newExercise.value.muscleGroups.length === 0) return

  saving.value = true
  try {
    await addCustomExercise(newExercise.value)
    showAddModal.value = false
    resetForm()
  } catch (err) {
    console.error('Error adding exercise:', err)
  } finally {
    saving.value = false
  }
}

// Check if exercise is custom (UUID format vs slug format)
function isCustomExercise(id: string) {
  return id.includes('-') && id.length > 20
}

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

// Options for the add exercise form
const muscleSelectOptions = [
  { label: 'Chest', value: 'chest' },
  { label: 'Back', value: 'back' },
  { label: 'Lats', value: 'lats' },
  { label: 'Shoulders', value: 'shoulders' },
  { label: 'Biceps', value: 'biceps' },
  { label: 'Triceps', value: 'triceps' },
  { label: 'Forearms', value: 'forearms' },
  { label: 'Quads', value: 'quads' },
  { label: 'Hamstrings', value: 'hamstrings' },
  { label: 'Glutes', value: 'glutes' },
  { label: 'Calves', value: 'calves' },
  { label: 'Abs', value: 'abs' },
  { label: 'Lower Back', value: 'lower_back' },
  { label: 'Traps', value: 'traps' },
]

const equipmentSelectOptions = [
  { label: 'Barbell', value: 'barbell' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Kettlebell', value: 'kettlebell' },
  { label: 'Cable', value: 'cable' },
  { label: 'Machine', value: 'machine' },
  { label: 'Bodyweight', value: 'bodyweight' },
  { label: 'Resistance Band', value: 'resistance_band' },
  { label: 'Bench', value: 'bench' },
  { label: 'Pull-up Bar', value: 'pull_up_bar' },
]

const difficultySelectOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

const categorySelectOptions = [
  { label: 'Strength', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Flexibility', value: 'flexibility' },
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
      <NButton type="primary" @click="showAddModal = true">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </template>
        Add Custom Exercise
      </NButton>
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
              <NTag v-if="isCustomExercise(exercise.id)" type="warning" size="small">
                Custom
              </NTag>
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

    <!-- Add Custom Exercise Modal -->
    <NModal
      v-model:show="showAddModal"
      preset="card"
      title="Add Custom Exercise"
      :style="{ maxWidth: '500px' }"
      :mask-closable="!saving"
      :closable="!saving"
    >
      <NForm>
        <NFormItem label="Exercise Name" required>
          <NInput v-model:value="newExercise.name" placeholder="e.g., Cable Crossover" />
        </NFormItem>

        <NFormItem label="Category" required>
          <NSelect
            v-model:value="newExercise.category"
            :options="categorySelectOptions"
            placeholder="Select category"
          />
        </NFormItem>

        <NFormItem label="Target Muscles" required>
          <NSelect
            v-model:value="newExercise.muscleGroups"
            :options="muscleSelectOptions"
            multiple
            placeholder="Select muscle groups"
          />
        </NFormItem>

        <NFormItem label="Equipment">
          <NSelect
            v-model:value="newExercise.equipment"
            :options="equipmentSelectOptions"
            multiple
            placeholder="Select equipment (optional)"
          />
        </NFormItem>

        <NFormItem label="Difficulty">
          <NSelect
            v-model:value="newExercise.difficulty"
            :options="difficultySelectOptions"
            placeholder="Select difficulty"
          />
        </NFormItem>

        <NFormItem>
          <NCheckbox v-model:checked="newExercise.isCompound">
            Compound exercise (works multiple muscle groups)
          </NCheckbox>
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton :disabled="saving" @click="showAddModal = false">
            Cancel
          </NButton>
          <NButton
            type="primary"
            :loading="saving"
            :disabled="!newExercise.name.trim() || newExercise.muscleGroups.length === 0"
            @click="handleAddExercise"
          >
            Add Exercise
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
