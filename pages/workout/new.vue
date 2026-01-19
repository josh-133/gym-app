<script setup lang="ts">
import { NCard, NButton, NInput, NModal, NEmpty, NTabs, NTabPane, NDatePicker } from 'naive-ui'
import type { Exercise } from '~/types/database'
import RestTimer from '~/components/workout/RestTimer.vue'

definePageMeta({
  middleware: ['auth'],
})

const workoutStore = useWorkoutStore()
const { addWorkout: saveWorkout } = useWorkoutHistory()
const router = useRouter()
const route = useRoute()

// Workout name and date
const workoutName = ref('')
const showExercisePicker = ref(false)
const showFinishModal = ref(false)
const workoutDate = ref<number>(Date.now()) // Timestamp for date picker

// Mock templates for demo - in real app, fetch from Supabase
interface WorkoutTemplate {
  id: string
  name: string
  description: string
  exercises: Exercise[]
  estimatedDuration: number
  muscleGroups: string[]
  lastUsed?: string
}

const templates = ref<WorkoutTemplate[]>([
  {
    id: '1',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps',
    estimatedDuration: 60,
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    lastUsed: '2024-01-09',
    exercises: [
      { id: '1', name: 'Bench Press', category: 'strength', muscle_groups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'bench'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '2', name: 'Incline Dumbbell Press', category: 'strength', muscle_groups: ['chest', 'shoulders'], equipment: ['dumbbell', 'bench'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '3', name: 'Cable Fly', category: 'strength', muscle_groups: ['chest'], equipment: ['cable'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '4', name: 'Overhead Press', category: 'strength', muscle_groups: ['shoulders', 'triceps'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '5', name: 'Lateral Raise', category: 'strength', muscle_groups: ['shoulders'], equipment: ['dumbbell'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '6', name: 'Tricep Pushdown', category: 'strength', muscle_groups: ['triceps'], equipment: ['cable'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
    ],
  },
  {
    id: '2',
    name: 'Pull Day',
    description: 'Back and biceps',
    estimatedDuration: 55,
    muscleGroups: ['back', 'biceps'],
    lastUsed: '2024-01-08',
    exercises: [
      { id: '8', name: 'Deadlift', category: 'strength', muscle_groups: ['back', 'glutes', 'hamstrings'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'advanced', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '10', name: 'Barbell Row', category: 'strength', muscle_groups: ['back', 'biceps'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '9', name: 'Pull-up', category: 'strength', muscle_groups: ['back', 'biceps'], equipment: ['pull_up_bar'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '11', name: 'Lat Pulldown', category: 'strength', muscle_groups: ['back', 'biceps'], equipment: ['cable'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '12', name: 'Barbell Curl', category: 'strength', muscle_groups: ['biceps'], equipment: ['barbell'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
    ],
  },
  {
    id: '3',
    name: 'Leg Day',
    description: 'Quads, hamstrings, and glutes',
    estimatedDuration: 70,
    muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
    lastUsed: '2024-01-06',
    exercises: [
      { id: '7', name: 'Squat', category: 'strength', muscle_groups: ['quads', 'glutes', 'hamstrings'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '13', name: 'Romanian Deadlift', category: 'strength', muscle_groups: ['hamstrings', 'glutes'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '14', name: 'Leg Press', category: 'strength', muscle_groups: ['quads', 'glutes'], equipment: ['machine'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '15', name: 'Leg Curl', category: 'strength', muscle_groups: ['hamstrings'], equipment: ['machine'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '16', name: 'Leg Extension', category: 'strength', muscle_groups: ['quads'], equipment: ['machine'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '17', name: 'Calf Raise', category: 'strength', muscle_groups: ['calves'], equipment: ['machine'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
    ],
  },
  {
    id: '4',
    name: 'Upper Body',
    description: 'Full upper body workout',
    estimatedDuration: 65,
    muscleGroups: ['chest', 'back', 'shoulders', 'arms'],
    exercises: [
      { id: '1', name: 'Bench Press', category: 'strength', muscle_groups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'bench'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '10', name: 'Barbell Row', category: 'strength', muscle_groups: ['back', 'biceps'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '4', name: 'Overhead Press', category: 'strength', muscle_groups: ['shoulders', 'triceps'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '9', name: 'Pull-up', category: 'strength', muscle_groups: ['back', 'biceps'], equipment: ['pull_up_bar'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '12', name: 'Barbell Curl', category: 'strength', muscle_groups: ['biceps'], equipment: ['barbell'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
      { id: '6', name: 'Tricep Pushdown', category: 'strength', muscle_groups: ['triceps'], equipment: ['cable'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
    ],
  },
])

// Mock exercises for demo
const exercises: Exercise[] = [
  { id: '1', name: 'Bench Press', category: 'strength', muscle_groups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'bench'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '2', name: 'Incline Dumbbell Press', category: 'strength', muscle_groups: ['chest', 'shoulders'], equipment: ['dumbbell', 'bench'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '3', name: 'Cable Fly', category: 'strength', muscle_groups: ['chest'], equipment: ['cable'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '4', name: 'Overhead Press', category: 'strength', muscle_groups: ['shoulders', 'triceps'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '5', name: 'Lateral Raise', category: 'strength', muscle_groups: ['shoulders'], equipment: ['dumbbell'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '6', name: 'Tricep Pushdown', category: 'strength', muscle_groups: ['triceps'], equipment: ['cable'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '7', name: 'Squat', category: 'strength', muscle_groups: ['quads', 'glutes', 'hamstrings'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '8', name: 'Deadlift', category: 'strength', muscle_groups: ['back', 'glutes', 'hamstrings'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'advanced', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '9', name: 'Pull-up', category: 'strength', muscle_groups: ['back', 'biceps'], equipment: ['pull_up_bar'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '10', name: 'Barbell Row', category: 'strength', muscle_groups: ['back', 'biceps'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '11', name: 'Lat Pulldown', category: 'strength', muscle_groups: ['back', 'biceps'], equipment: ['cable'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '12', name: 'Barbell Curl', category: 'strength', muscle_groups: ['biceps'], equipment: ['barbell'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '13', name: 'Romanian Deadlift', category: 'strength', muscle_groups: ['hamstrings', 'glutes'], equipment: ['barbell'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'intermediate', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '14', name: 'Leg Press', category: 'strength', muscle_groups: ['quads', 'glutes'], equipment: ['machine'], is_compound: true, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '15', name: 'Leg Curl', category: 'strength', muscle_groups: ['hamstrings'], equipment: ['machine'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '16', name: 'Leg Extension', category: 'strength', muscle_groups: ['quads'], equipment: ['machine'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
  { id: '17', name: 'Calf Raise', category: 'strength', muscle_groups: ['calves'], equipment: ['machine'], is_compound: false, is_system: true, user_id: null, description: null, difficulty: 'beginner', instructions: [], video_url: null, image_url: null, created_at: '' },
]

const exerciseSearch = ref('')
const filteredExercises = computed(() => {
  if (!exerciseSearch.value) return exercises
  const search = exerciseSearch.value.toLowerCase()
  return exercises.filter(e =>
    e.name.toLowerCase().includes(search) ||
    e.muscle_groups.some(m => m.includes(search))
  )
})

function startWorkout() {
  const name = workoutName.value || `Workout ${new Date().toLocaleDateString()}`
  workoutStore.startWorkout(name)
}

function startFromTemplate(template: WorkoutTemplate) {
  workoutStore.startWorkout(template.name)
  // Add all exercises from the template
  template.exercises.forEach(exercise => {
    workoutStore.addExercise(exercise)
    // Add 3 default sets for each exercise
    const exerciseIndex = workoutStore.exerciseLogs.length - 1
    workoutStore.addSet(exerciseIndex)
    workoutStore.addSet(exerciseIndex)
    workoutStore.addSet(exerciseIndex)
  })
}

function addExercise(exercise: Exercise) {
  workoutStore.addExercise(exercise)
  showExercisePicker.value = false
  exerciseSearch.value = ''
}

function removeExercise(index: number) {
  workoutStore.removeExercise(index)
}

function formatMuscleGroups(groups: string[]) {
  return groups.map(g => g.replace('_', ' ')).join(', ')
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Never used'
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Handle finishing workout - show modal to confirm
function finishWorkout() {
  showFinishModal.value = true
}

// Confirm and save the workout
async function confirmFinishWorkout() {
  const result = await workoutStore.endWorkout()
  if (result) {
    // Calculate total volume
    const volume = result.exerciseLogs.reduce((sum, log) => {
      return sum + log.sets.reduce((setSum, set) => {
        if (set.completed_at && set.reps && set.weight_kg) {
          return setSum + (set.reps * set.weight_kg)
        }
        return setSum
      }, 0)
    }, 0)

    // Use selected date or current time
    const selectedDate = new Date(workoutDate.value).toISOString()

    // Save to history
    saveWorkout({
      id: result.session.id,
      name: result.session.name,
      date: selectedDate,
      duration: result.session.duration_sec || 0,
      exercises: result.exerciseLogs.map(log => ({
        name: log.exercise.name,
        sets: log.sets.map(set => ({
          weight: set.weight_kg,
          reps: set.reps,
          completed: !!set.completed_at,
        })),
      })),
      volume,
      rating: null,
      notes: result.session.notes,
    })

    showFinishModal.value = false
    // Navigate to workout history
    router.push('/workout')
  }
}

// Date validation - can't select future dates
function disableFutureDates(ts: number) {
  return ts > Date.now()
}

// Check if there's an active workout
onMounted(() => {
  if (workoutStore.isActive) {
    // Resume existing workout
  }
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Not Started State -->
    <template v-if="!workoutStore.isActive">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex items-center justify-center shadow-xl glow-primary">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold gradient-text">Start a Workout</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Choose a template or start from scratch</p>
        </div>

        <!-- Tabs for Templates vs Empty -->
        <NTabs type="line" animated default-value="templates">
          <!-- Templates Tab -->
          <NTabPane name="templates" tab="From Template">
            <div class="space-y-4 mt-4">
              <div
                v-for="template in templates"
                :key="template.id"
                class="group cursor-pointer"
                @click="startFromTemplate(template)"
              >
                <NCard class="hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:-translate-y-1">
                  <div class="flex items-start gap-4">
                    <!-- Icon -->
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                      <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
                      </svg>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <h3 class="font-semibold text-gray-900 dark:text-white text-lg">
                          {{ template.name }}
                        </h3>
                        <span class="text-sm text-gray-400 dark:text-gray-500">
                          {{ formatDate(template.lastUsed) }}
                        </span>
                      </div>
                      <p class="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        {{ template.description }}
                      </p>
                      <div class="flex items-center gap-4 text-sm">
                        <span class="text-gray-500 dark:text-gray-400">
                          <span class="font-medium text-gray-700 dark:text-gray-300">{{ template.exercises.length }}</span> exercises
                        </span>
                        <span class="text-gray-500 dark:text-gray-400">
                          ~<span class="font-medium text-gray-700 dark:text-gray-300">{{ template.estimatedDuration }}</span> min
                        </span>
                      </div>
                      <!-- Muscle group tags -->
                      <div class="flex flex-wrap gap-1 mt-3">
                        <span
                          v-for="muscle in template.muscleGroups.slice(0, 4)"
                          :key="muscle"
                          class="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full capitalize"
                        >
                          {{ muscle }}
                        </span>
                      </div>
                    </div>

                    <!-- Arrow -->
                    <div class="flex-shrink-0 self-center">
                      <svg class="w-6 h-6 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </NCard>
              </div>

              <!-- Create Template Link -->
              <NuxtLink to="/templates/new" class="block">
                <NCard class="border-dashed hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                  <div class="flex items-center justify-center gap-3 py-4 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="font-medium">Create New Template</span>
                  </div>
                </NCard>
              </NuxtLink>
            </div>
          </NTabPane>

          <!-- Empty Workout Tab -->
          <NTabPane name="empty" tab="Empty Workout">
            <NCard class="mt-4">
              <div class="text-center py-6">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-secondary-400 to-primary-500 flex items-center justify-center shadow-lg">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Start from Scratch</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Create a custom workout and add exercises as you go
                </p>

                <div class="max-w-xs mx-auto space-y-4">
                  <NInput
                    v-model:value="workoutName"
                    placeholder="Workout name (optional)"
                    size="large"
                  />

                  <div class="text-left">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Workout Date
                    </label>
                    <NDatePicker
                      v-model:value="workoutDate"
                      type="date"
                      :is-date-disabled="disableFutureDates"
                      class="w-full"
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Log a past workout or start one for today
                    </p>
                  </div>

                  <NButton
                    type="primary"
                    size="large"
                    block
                    @click="startWorkout"
                  >
                    <template #icon>
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </template>
                    Start Empty Workout
                  </NButton>
                </div>
              </div>
            </NCard>
          </NTabPane>
        </NTabs>
      </div>
    </template>

    <!-- Active Workout -->
    <template v-else>
      <!-- Header with Timer -->
      <div class="sticky top-0 z-10 -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 glass border-b border-white/10 dark:border-gray-700/50">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold gradient-text">
              {{ workoutStore.session?.name }}
            </h1>
            <div class="flex items-center gap-3 mt-1">
              <WorkoutWorkoutTimer />
              <span class="text-xs text-gray-400">•</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ new Date(workoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <NButton @click="workoutStore.cancelWorkout">
              Cancel
            </NButton>
            <NButton type="primary" class="btn-glow" @click="finishWorkout">
              Finish
            </NButton>
          </div>
        </div>
      </div>

      <!-- Exercise List -->
      <div class="space-y-4">
        <div
          v-for="(log, index) in workoutStore.exerciseLogs"
          :key="log.id"
        >
          <NCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                      {{ log.exercise.name }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatMuscleGroups(log.exercise.muscle_groups) }}
                    </p>
                  </div>
                </div>
                <NButton quaternary circle @click="removeExercise(index)">
                  <template #icon>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </template>
                </NButton>
              </div>
            </template>

            <!-- Sets -->
            <div class="space-y-2">
              <!-- Set Headers -->
              <div class="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
                <div class="col-span-1">Set</div>
                <div class="col-span-3">Previous</div>
                <div class="col-span-3">Weight</div>
                <div class="col-span-3">Reps</div>
                <div class="col-span-2"></div>
              </div>

              <!-- Set Rows -->
              <WorkoutSetInput
                v-for="(set, setIndex) in log.sets"
                :key="setIndex"
                :set="set"
                :set-index="setIndex"
                :exercise-index="index"
              />

              <!-- Add Set Button -->
              <NButton
                dashed
                block
                @click="workoutStore.addSet(index)"
              >
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

        <!-- Add Exercise Button -->
        <NButton
          type="primary"
          dashed
          block
          size="large"
          @click="showExercisePicker = true"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Add Exercise
        </NButton>

        <!-- Empty State -->
        <NEmpty
          v-if="workoutStore.exerciseLogs.length === 0"
          description="Add your first exercise to get started"
        />
      </div>

      <!-- Rest Timer -->
      <RestTimer />
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
            {{ formatMuscleGroups(exercise.muscle_groups) }}
          </div>
        </button>
      </div>
    </NModal>

    <!-- Finish Workout Modal -->
    <NModal
      v-model:show="showFinishModal"
      preset="dialog"
      title="Finish Workout"
      style="width: 90%; max-width: 400px;"
    >
      <div class="space-y-6">
        <!-- Workout Summary -->
        <div class="text-center py-2">
          <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Great workout!</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ workoutStore.exerciseLogs.length }} exercises completed
          </p>
        </div>

        <!-- Workout Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">Duration</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ Math.floor((workoutStore.session?.duration_sec || 0) / 60) }}m
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">Sets</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ workoutStore.exerciseLogs.reduce((sum, log) => sum + log.sets.filter(s => s.completed_at).length, 0) }}
            </p>
          </div>
        </div>

        <!-- Buttons inside content -->
        <div class="flex gap-3 pt-2">
          <NButton block @click="showFinishModal = false">
            Continue
          </NButton>
          <NButton type="primary" block @click="confirmFinishWorkout">
            Save & Finish
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>
