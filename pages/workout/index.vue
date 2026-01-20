<script setup lang="ts">
import { NCard, NButton, NTabs, NTabPane, NEmpty, NModal, NInput, NInputNumber } from 'naive-ui'
import { EXERCISE_LIBRARY } from '~/utils/exercises'

definePageMeta({
  middleware: ['auth'],
})

// Get saved workouts from localStorage
const { workouts: savedWorkouts, loadWorkouts } = useWorkoutHistory()
const { templates: savedTemplates, loadTemplates, addTemplate, updateTemplate, deleteTemplate } = useTemplates()

// Modal state
const showTemplateModal = ref(false)
const editingTemplate = ref<string | null>(null)
const templateName = ref('')
const templateExercises = ref<{ name: string; sets: number; defaultReps?: number }[]>([])
const showExercisePicker = ref(false)
const exerciseSearch = ref('')

// Load on mount
onMounted(() => {
  loadWorkouts()
  loadTemplates()
})

// Transform saved workouts for display
const workouts = computed(() => {
  return savedWorkouts.value.map(w => ({
    id: w.id,
    name: w.name,
    date: w.date,
    duration: Math.floor(w.duration / 60), // Convert seconds to minutes
    exercises: w.exercises.length,
    volume: w.volume,
    rating: w.rating || 0,
  }))
})

// Transform templates for display
const templates = computed(() => {
  return savedTemplates.value.map(t => ({
    id: t.id,
    name: t.name,
    exercises: t.exercises.length,
    lastUsed: t.lastUsed || t.createdAt,
  }))
})

// Exercise picker
const availableExercises = computed(() => {
  return EXERCISE_LIBRARY
    .filter(ex => ex.category !== 'warmup')
    .map(ex => ({
      id: ex.id,
      name: ex.name,
      muscleGroups: ex.muscleGroups,
    }))
})

const filteredExercises = computed(() => {
  if (!exerciseSearch.value) return availableExercises.value.slice(0, 20)
  const search = exerciseSearch.value.toLowerCase()
  return availableExercises.value.filter(e =>
    e.name.toLowerCase().includes(search) ||
    e.muscleGroups.some(m => m.includes(search))
  ).slice(0, 20)
})

function openCreateTemplate() {
  editingTemplate.value = null
  templateName.value = ''
  templateExercises.value = []
  showTemplateModal.value = true
}

function openEditTemplate(id: string) {
  const template = savedTemplates.value.find(t => t.id === id)
  if (template) {
    editingTemplate.value = id
    templateName.value = template.name
    templateExercises.value = template.exercises.map(e => ({ ...e }))
    showTemplateModal.value = true
  }
}

function addExerciseToTemplate(exercise: { name: string }) {
  templateExercises.value.push({
    name: exercise.name,
    sets: 3,
    defaultReps: 10,
  })
  showExercisePicker.value = false
  exerciseSearch.value = ''
}

function removeExerciseFromTemplate(index: number) {
  templateExercises.value.splice(index, 1)
}

function moveExerciseUp(index: number) {
  if (index > 0) {
    const temp = templateExercises.value[index]
    templateExercises.value[index] = templateExercises.value[index - 1]
    templateExercises.value[index - 1] = temp
  }
}

function moveExerciseDown(index: number) {
  if (index < templateExercises.value.length - 1) {
    const temp = templateExercises.value[index]
    templateExercises.value[index] = templateExercises.value[index + 1]
    templateExercises.value[index + 1] = temp
  }
}

function saveTemplate() {
  if (!templateName.value.trim() || templateExercises.value.length === 0) return

  if (editingTemplate.value) {
    updateTemplate(editingTemplate.value, {
      name: templateName.value,
      exercises: templateExercises.value,
    })
  } else {
    addTemplate({
      name: templateName.value,
      exercises: templateExercises.value,
    })
  }

  showTemplateModal.value = false
}

function confirmDeleteTemplate(id: string) {
  if (confirm('Are you sure you want to delete this template?')) {
    deleteTemplate(id)
  }
}

function formatMuscleGroups(groups: string[]) {
  return groups.map(g => g.replace('_', ' ')).join(', ')
}

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

function getRatingStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Workouts</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">View your workout history and templates</p>
      </div>
      <NuxtLink to="/workout/new">
        <NButton type="primary" size="large">
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          New Workout
        </NButton>
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <NTabs type="line" animated>
      <!-- History Tab -->
      <NTabPane name="history" tab="History">
        <div class="space-y-3 mt-4">
          <NuxtLink
            v-for="workout in workouts"
            :key="workout.id"
            :to="`/workout/${workout.id}`"
            class="block"
          >
            <NCard class="hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4">
                <!-- Icon -->
                <div class="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
                  </svg>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                      {{ workout.name }}
                    </h3>
                    <span class="text-yellow-500 text-sm">{{ getRatingStars(workout.rating) }}</span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(workout.date) }} · {{ workout.exercises }} exercises
                  </p>
                </div>

                <!-- Stats -->
                <div class="text-right flex-shrink-0 hidden sm:block">
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ formatDuration(workout.duration) }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatVolume(workout.volume) }}
                  </p>
                </div>

                <!-- Arrow -->
                <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </NCard>
          </NuxtLink>

          <NEmpty v-if="workouts.length === 0" description="No workouts yet">
            <template #extra>
              <NuxtLink to="/workout/new">
                <NButton type="primary">Start Your First Workout</NButton>
              </NuxtLink>
            </template>
          </NEmpty>
        </div>
      </NTabPane>

      <!-- Templates Tab -->
      <NTabPane name="templates" tab="Templates">
        <div class="space-y-3 mt-4">
          <!-- Create Template Button -->
          <NButton type="primary" dashed block @click="openCreateTemplate">
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            Create New Template
          </NButton>

          <div
            v-for="template in templates"
            :key="template.id"
            class="block"
          >
            <NCard class="hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4">
                <!-- Icon -->
                <div class="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                    {{ template.name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ template.exercises }} exercises · Last used {{ formatDate(template.lastUsed) }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 flex-shrink-0">
                  <NuxtLink :to="`/workout/new?template=${template.id}`">
                    <NButton type="primary" size="small">Use</NButton>
                  </NuxtLink>
                  <NButton size="small" @click="openEditTemplate(template.id)">Edit</NButton>
                  <NButton size="small" type="error" quaternary @click="confirmDeleteTemplate(template.id)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </NButton>
                </div>
              </div>
            </NCard>
          </div>

          <NEmpty v-if="templates.length === 0" description="No templates yet">
            <template #extra>
              <NButton type="primary" @click="openCreateTemplate">Create Template</NButton>
            </template>
          </NEmpty>
        </div>
      </NTabPane>
    </NTabs>

    <!-- Template Editor Modal -->
    <NModal
      v-model:show="showTemplateModal"
      preset="card"
      :title="editingTemplate ? 'Edit Template' : 'Create Template'"
      style="width: 90%; max-width: 600px;"
    >
      <div class="space-y-4">
        <!-- Template Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template Name
          </label>
          <NInput v-model:value="templateName" placeholder="e.g., Push Day" />
        </div>

        <!-- Exercises List -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Exercises ({{ templateExercises.length }})
            </label>
            <NButton size="small" @click="showExercisePicker = true">
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </template>
              Add Exercise
            </NButton>
          </div>

          <div v-if="templateExercises.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No exercises added yet
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(exercise, index) in templateExercises"
              :key="index"
              class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
            >
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">{{ exercise.name }}</p>
                <div class="flex items-center gap-4 mt-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Sets:</span>
                    <NInputNumber v-model:value="exercise.sets" :min="1" :max="10" size="tiny" style="width: 60px" />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Reps:</span>
                    <NInputNumber v-model:value="exercise.defaultReps" :min="1" :max="100" size="tiny" style="width: 60px" />
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <NButton size="tiny" quaternary :disabled="index === 0" @click="moveExerciseUp(index)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </NButton>
                <NButton size="tiny" quaternary :disabled="index === templateExercises.length - 1" @click="moveExerciseDown(index)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </NButton>
                <NButton size="tiny" quaternary type="error" @click="removeExerciseFromTemplate(index)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showTemplateModal = false">Cancel</NButton>
          <NButton type="primary" class="flex-1" :disabled="!templateName.trim() || templateExercises.length === 0" @click="saveTemplate">
            {{ editingTemplate ? 'Save Changes' : 'Create Template' }}
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- Exercise Picker Modal -->
    <NModal
      v-model:show="showExercisePicker"
      preset="card"
      title="Add Exercise"
      style="width: 90%; max-width: 500px;"
    >
      <NInput
        v-model:value="exerciseSearch"
        placeholder="Search exercises..."
        size="large"
        class="mb-4"
      >
        <template #prefix>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </template>
      </NInput>

      <div class="space-y-2 max-h-96 overflow-y-auto">
        <button
          v-for="exercise in filteredExercises"
          :key="exercise.id"
          class="w-full text-left p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-md transition-all"
          @click="addExerciseToTemplate(exercise)"
        >
          <div class="font-medium text-gray-900 dark:text-white">
            {{ exercise.name }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatMuscleGroups(exercise.muscleGroups) }}
          </div>
        </button>
      </div>
    </NModal>
  </div>
</template>
