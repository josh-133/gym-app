<script setup lang="ts">
import { NCard, NButton, NInput, NInputNumber, NDatePicker, NModal, NEmpty } from 'naive-ui'
import { EXERCISE_LIBRARY } from '~/utils/exercises'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()
const { workouts, getWorkout, updateWorkout, loadWorkouts } = useWorkoutHistory()

// Get workout ID from route - computed to ensure reactivity
const workoutId = computed(() => route.params.id as string)

// Form state
const workoutName = ref('')
const workoutDate = ref<number>(Date.now())
const durationHours = ref(0)
const durationMinutes = ref(0)
const workoutNotes = ref<string | null>(null)
const exercises = ref<{
  name: string
  sets: {
    weight: number | null
    reps: number | null
    completed: boolean
  }[]
}[]>([])

const loading = ref(true)
const saving = ref(false)
const notFound = ref(false)
const showExercisePicker = ref(false)
const exerciseSearch = ref('')
const dataLoaded = ref(false)

// Load workout data
function loadWorkoutData() {
  if (!workoutId.value || workoutId.value === 'undefined') {
    notFound.value = true
    loading.value = false
    return
  }

  const savedWorkout = getWorkout(workoutId.value)

  if (savedWorkout) {
    workoutName.value = savedWorkout.name
    workoutDate.value = new Date(savedWorkout.date).getTime()
    durationHours.value = Math.floor(savedWorkout.duration / 3600)
    durationMinutes.value = Math.floor((savedWorkout.duration % 3600) / 60)
    workoutNotes.value = savedWorkout.notes
    exercises.value = savedWorkout.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets.map(set => ({
        weight: set.weight,
        reps: set.reps,
        completed: set.completed,
      })),
    }))
    dataLoaded.value = true
    loading.value = false
  }
}

onMounted(() => {
  loadWorkouts()
  // Try to load immediately in case workouts are already in state
  loadWorkoutData()

  // If not loaded yet, wait for workouts to be populated
  if (!dataLoaded.value) {
    const stopWatch = watch(workouts, (newWorkouts) => {
      if (newWorkouts.length > 0 && !dataLoaded.value) {
        loadWorkoutData()
        if (dataLoaded.value || notFound.value) {
          stopWatch()
        }
      }
    }, { immediate: true })

    // Timeout to show not found if workouts never load
    setTimeout(() => {
      if (!dataLoaded.value && !notFound.value) {
        notFound.value = true
        loading.value = false
        stopWatch()
      }
    }, 2000)
  }
})

// Exercise library for picker
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
  if (!exerciseSearch.value) return availableExercises.value
  const search = exerciseSearch.value.toLowerCase()
  return availableExercises.value.filter(e =>
    e.name.toLowerCase().includes(search) ||
    e.muscleGroups.some(m => m.includes(search))
  )
})

function addExercise(exercise: { name: string }) {
  exercises.value.push({
    name: exercise.name,
    sets: [{ weight: null, reps: null, completed: true }],
  })
  showExercisePicker.value = false
  exerciseSearch.value = ''
}

function removeExercise(index: number) {
  exercises.value.splice(index, 1)
}

function addSet(exerciseIndex: number) {
  const lastSet = exercises.value[exerciseIndex].sets.at(-1)
  exercises.value[exerciseIndex].sets.push({
    weight: lastSet?.weight || null,
    reps: lastSet?.reps || null,
    completed: true,
  })
}

function removeSet(exerciseIndex: number, setIndex: number) {
  if (exercises.value[exerciseIndex].sets.length > 1) {
    exercises.value[exerciseIndex].sets.splice(setIndex, 1)
  }
}

function moveExerciseUp(index: number) {
  if (index > 0) {
    const temp = exercises.value[index]
    exercises.value[index] = exercises.value[index - 1]
    exercises.value[index - 1] = temp
  }
}

function moveExerciseDown(index: number) {
  if (index < exercises.value.length - 1) {
    const temp = exercises.value[index]
    exercises.value[index] = exercises.value[index + 1]
    exercises.value[index + 1] = temp
  }
}

// Calculate volume
const totalVolume = computed(() => {
  return exercises.value.reduce((sum, ex) => {
    return sum + ex.sets.reduce((setSum, set) => {
      return setSum + ((set.weight || 0) * (set.reps || 0))
    }, 0)
  }, 0)
})

// Save changes
async function saveChanges() {
  saving.value = true

  const duration = (durationHours.value * 3600) + (durationMinutes.value * 60)
  const selectedDate = new Date(workoutDate.value).toISOString()

  const success = updateWorkout(workoutId.value, {
    name: workoutName.value,
    date: selectedDate,
    duration,
    exercises: exercises.value,
    volume: totalVolume.value,
    notes: workoutNotes.value,
  })

  saving.value = false

  if (success) {
    router.push(`/workout/${workoutId.value}`)
  }
}

function disableFutureDates(ts: number) {
  return ts > Date.now()
}

function formatMuscleGroups(groups: string[]) {
  return groups.map(g => g.replace('_', ' ')).join(', ')
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
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Workout Not Found</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4">The workout you're looking for doesn't exist.</p>
      <NuxtLink to="/workout">
        <NButton type="primary">View All Workouts</NButton>
      </NuxtLink>
    </NCard>

    <!-- Edit Form -->
    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <NuxtLink :to="`/workout/${workoutId}`" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block">
            ← Back to workout
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Edit Workout</h1>
        </div>
        <div class="flex gap-2">
          <NuxtLink :to="`/workout/${workoutId}`">
            <NButton :disabled="saving">Cancel</NButton>
          </NuxtLink>
          <NButton type="primary" :loading="saving" @click="saveChanges">
            Save Changes
          </NButton>
        </div>
      </div>

      <!-- Basic Info -->
      <NCard title="Workout Details">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workout Name
            </label>
            <NInput v-model:value="workoutName" placeholder="e.g., Push Day" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <NDatePicker
                v-model:value="workoutDate"
                type="date"
                :is-date-disabled="disableFutureDates"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <div class="flex gap-2">
                <div class="flex-1">
                  <NInputNumber
                    v-model:value="durationHours"
                    :min="0"
                    :max="12"
                    placeholder="Hours"
                  >
                    <template #suffix>h</template>
                  </NInputNumber>
                </div>
                <div class="flex-1">
                  <NInputNumber
                    v-model:value="durationMinutes"
                    :min="0"
                    :max="59"
                    placeholder="Minutes"
                  >
                    <template #suffix>m</template>
                  </NInputNumber>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <NInput
              v-model:value="workoutNotes"
              type="textarea"
              placeholder="How did the workout feel?"
              :rows="2"
            />
          </div>
        </div>
      </NCard>

      <!-- Exercises -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Exercises</h2>
          <NButton type="primary" @click="showExercisePicker = true">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            Add Exercise
          </NButton>
        </div>

        <NEmpty v-if="exercises.length === 0" description="No exercises added yet" />

        <NCard v-for="(exercise, exIndex) in exercises" :key="exIndex">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span class="font-bold text-sm text-indigo-600 dark:text-indigo-400">{{ exIndex + 1 }}</span>
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ exercise.name }}</h3>
              </div>
              <div class="flex items-center gap-1">
                <NButton size="tiny" quaternary :disabled="exIndex === 0" @click="moveExerciseUp(exIndex)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </NButton>
                <NButton size="tiny" quaternary :disabled="exIndex === exercises.length - 1" @click="moveExerciseDown(exIndex)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </NButton>
                <NButton size="tiny" quaternary type="error" @click="removeExercise(exIndex)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </NButton>
              </div>
            </div>
          </template>

          <!-- Sets Table -->
          <div class="space-y-3">
            <div class="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
              <div class="col-span-2">Set</div>
              <div class="col-span-4">Weight (kg)</div>
              <div class="col-span-4">Reps</div>
              <div class="col-span-2"></div>
            </div>

            <div
              v-for="(set, setIndex) in exercise.sets"
              :key="setIndex"
              class="grid grid-cols-12 gap-2 items-center"
            >
              <div class="col-span-2 text-center font-medium text-gray-700 dark:text-gray-300">
                {{ setIndex + 1 }}
              </div>
              <div class="col-span-4">
                <NInputNumber
                  v-model:value="set.weight"
                  :min="0"
                  :max="500"
                  :precision="1"
                  placeholder="0"
                  size="small"
                />
              </div>
              <div class="col-span-4">
                <NInputNumber
                  v-model:value="set.reps"
                  :min="0"
                  :max="100"
                  placeholder="0"
                  size="small"
                />
              </div>
              <div class="col-span-2 flex justify-center">
                <NButton
                  size="tiny"
                  quaternary
                  :disabled="exercise.sets.length <= 1"
                  @click="removeSet(exIndex, setIndex)"
                >
                  <svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </NButton>
              </div>
            </div>

            <NButton size="small" dashed block @click="addSet(exIndex)">
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </template>
              Add Set
            </NButton>
          </div>
        </NCard>
      </div>

      <!-- Summary -->
      <NCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Volume</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ (totalVolume / 1000).toFixed(1) }}k kg
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500 dark:text-gray-400">Exercises</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ exercises.length }}</p>
          </div>
        </div>
      </NCard>
    </template>

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
          @click="addExercise(exercise)"
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
