<script setup lang="ts">
import { NCard, NButton, NInput, NModal, NEmpty, NTabs, NTabPane, NDatePicker, NInputNumber, NSwitch, NTag } from 'naive-ui'
import type { Exercise } from '~/types/database'
import RestTimer from '~/components/workout/RestTimer.vue'
import CardioInput from '~/components/workout/CardioInput.vue'
import ExerciseGroup from '~/components/workout/ExerciseGroup.vue'
import { EXERCISE_LIBRARY, type CardioTrackingType } from '~/utils/exercises'

definePageMeta({
  middleware: ['auth'],
})

const workoutStore = useWorkoutStore()
const { addWorkout: saveWorkout, getLastPerformedSets } = useWorkoutHistory()
const { templates: savedTemplates, loadTemplates, markTemplateUsed, addTemplate } = useTemplates()
const router = useRouter()
const route = useRoute()

// Workout name and date
const workoutName = ref('')
const showExercisePicker = ref(false)
const showFinishModal = ref(false)
const workoutDate = ref<number>(Date.now()) // Timestamp for date picker

// Manual duration input for past workouts
const useManualDuration = ref(false)
const manualDurationHours = ref(0)
const manualDurationMinutes = ref(30)

// Save as template option
const saveAsTemplate = ref(false)
const templateName = ref('')

// Mood/energy/sleep tracking for workout completion
const workoutMood = ref<number | null>(null)
const workoutEnergy = ref<number | null>(null)
const workoutSleep = ref<number | null>(null)
const moodOptions = [
  { value: 1, emoji: '😫', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

// Transform saved templates to the format expected by the UI
const templates = computed(() => {
  return savedTemplates.value.map(t => ({
    id: t.id,
    name: t.name,
    description: getMuscleGroupDescription(t.exercises),
    exercises: t.exercises.map(ex => convertToExercise(ex)),
    estimatedDuration: t.exercises.length * 10, // Estimate ~10 min per exercise
    muscleGroups: getUniqueMuscleGroups(t.exercises),
    lastUsed: t.lastUsed || undefined,
  }))
})

// Helper to get muscle groups from template exercises
function getUniqueMuscleGroups(exercises: readonly { readonly name: string }[]): string[] {
  const muscleGroups = new Set<string>()
  exercises.forEach(ex => {
    const libraryEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
    if (libraryEx) {
      libraryEx.muscleGroups.forEach(m => muscleGroups.add(m))
    }
  })
  return Array.from(muscleGroups).slice(0, 4)
}

// Helper to create description from exercises
function getMuscleGroupDescription(exercises: readonly { readonly name: string }[]): string {
  const groups = getUniqueMuscleGroups(exercises)
  if (groups.length === 0) return `${exercises.length} exercises`
  return groups.slice(0, 3).map(g => g.replace('_', ' ')).join(', ')
}

// Helper to convert template exercise to full Exercise type
function convertToExercise(ex: { readonly name: string; readonly sets: number; readonly defaultReps?: number }): Exercise & { trackingType?: CardioTrackingType } {
  const libraryEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
  return {
    id: libraryEx?.id || ex.name,
    name: ex.name,
    category: (libraryEx?.category || 'strength') as Exercise['category'],
    muscle_groups: [...(libraryEx?.muscleGroups || [])] as Exercise['muscle_groups'],
    equipment: [...(libraryEx?.equipment || [])] as Exercise['equipment'],
    is_compound: libraryEx?.isCompound || false,
    is_system: true,
    user_id: null,
    description: null,
    difficulty: (libraryEx?.difficulty || 'intermediate') as Exercise['difficulty'],
    instructions: [],
    video_url: null,
    image_url: null,
    created_at: '',
    trackingType: libraryEx?.trackingType,
  }
}

// Extended Exercise type with tracking info
type ExerciseWithTracking = Exercise & { trackingType?: CardioTrackingType }

// Convert EXERCISE_LIBRARY to Exercise format for the picker
const exercises = computed<ExerciseWithTracking[]>(() => {
  return EXERCISE_LIBRARY
    .filter(ex => ex.category !== 'warmup')
    .map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category as Exercise['category'],
      muscle_groups: [...ex.muscleGroups] as Exercise['muscle_groups'],
      equipment: [...ex.equipment] as Exercise['equipment'],
      is_compound: ex.isCompound,
      is_system: true,
      user_id: null,
      description: null,
      difficulty: ex.difficulty as Exercise['difficulty'],
      instructions: [],
      video_url: null,
      image_url: null,
      created_at: '',
      trackingType: ex.trackingType,
    }))
})

// Group exercises by category for the picker
const exercisesByCategory = computed(() => {
  const grouped = {
    strength: [] as ExerciseWithTracking[],
    cardio: [] as ExerciseWithTracking[],
  }
  exercises.value.forEach(ex => {
    if (ex.category === 'cardio') {
      grouped.cardio.push(ex)
    } else {
      grouped.strength.push(ex)
    }
  })
  return grouped
})

// Get tracking type for an exercise
function getExerciseTrackingType(exerciseName: string): CardioTrackingType | undefined {
  const libraryEx = EXERCISE_LIBRARY.find(e => e.name === exerciseName)
  return libraryEx?.trackingType
}

const exerciseSearch = ref('')
const filteredExercises = computed(() => {
  if (!exerciseSearch.value) return exercises.value
  const search = exerciseSearch.value.toLowerCase()
  return exercises.value.filter(e =>
    e.name.toLowerCase().includes(search) ||
    e.muscle_groups.some(m => m.includes(search))
  )
})

function startWorkout() {
  const name = workoutName.value || `Workout ${new Date().toLocaleDateString()}`
  workoutStore.startWorkout(name)
}

function startFromTemplate(template: typeof templates.value[0]) {
  workoutStore.startWorkout(template.name)
  // Mark template as used
  markTemplateUsed(template.id)
  // Get the raw template to access group data
  const rawTemplate = savedTemplates.value.find(t => t.id === template.id)
  // Add all exercises from the template
  template.exercises.forEach((exercise, i) => {
    const rawEx = rawTemplate?.exercises[i]
    const groupOptions = rawEx?.group_id && rawEx?.group_type
      ? { groupId: rawEx.group_id, groupType: rawEx.group_type as 'superset' | 'circuit' }
      : undefined
    workoutStore.addExercise(exercise, groupOptions)
    // Add 3 default sets for each exercise
    const exerciseIndex = workoutStore.exerciseLogs.length - 1
    workoutStore.addSet(exerciseIndex)
    workoutStore.addSet(exerciseIndex)
    workoutStore.addSet(exerciseIndex)
  })
}

function addExercise(exercise: ExerciseWithTracking) {
  workoutStore.addExercise(exercise)
  // Only add default sets for strength exercises, not cardio
  if (exercise.category !== 'cardio') {
    const exerciseIndex = workoutStore.exerciseLogs.length - 1
    workoutStore.addSet(exerciseIndex)
  }
  showExercisePicker.value = false
  exerciseSearch.value = ''
}

// Handle cardio log updates
function handleCardioUpdate(exerciseIndex: number, data: { duration_sec: number | null; distance_km: number | null; calories: number | null }) {
  workoutStore.updateCardioLog(exerciseIndex, {
    duration_sec: data.duration_sec || 0,
    distance_km: data.distance_km || undefined,
    calories_burned: data.calories || undefined,
  })
}

function handleCardioComplete(exerciseIndex: number) {
  workoutStore.completeCardioLog(exerciseIndex)
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
    // Calculate total volume (only for strength exercises)
    const volume = result.exerciseLogs.reduce((sum, log) => {
      if (log.exercise.category === 'cardio') return sum
      return sum + log.sets.reduce((setSum, set) => {
        if (set.completed_at && set.reps && set.weight_kg) {
          return setSum + (set.reps * set.weight_kg)
        }
        return setSum
      }, 0)
    }, 0)

    // Use selected date or current time
    const selectedDate = new Date(workoutDate.value).toISOString()

    // Calculate duration - use manual input if enabled, otherwise use tracked duration
    const duration = useManualDuration.value
      ? (manualDurationHours.value * 3600) + (manualDurationMinutes.value * 60)
      : (result.session.duration_sec || 0)

    // Save to history
    saveWorkout({
      id: result.session.id,
      name: result.session.name,
      date: selectedDate,
      duration,
      exercises: result.exerciseLogs.map(log => ({
        name: log.exercise.name,
        category: log.exercise.category,
        sets: log.sets.map(set => ({
          weight: set.weight_kg,
          reps: set.reps,
          completed: !!set.completed_at,
          set_type: set.set_type,
          rpe: set.rpe,
          tempo: set.tempo || null,
        })),
        cardio: log.cardio_log ? {
          duration_sec: log.cardio_log.duration_sec || 0,
          distance_km: log.cardio_log.distance_km || undefined,
          calories: log.cardio_log.calories_burned || undefined,
          completed: !!log.cardio_log.completed_at,
        } : undefined,
        group_id: log.group_id,
        group_type: log.group_type,
      })),
      volume,
      rating: null,
      notes: result.session.notes,
      mood: workoutMood.value,
      energy: workoutEnergy.value,
      sleep_quality: workoutSleep.value,
    })

    // Save as template if enabled
    if (saveAsTemplate.value && templateName.value.trim()) {
      addTemplate({
        name: templateName.value.trim(),
        exercises: result.exerciseLogs.map(log => ({
          name: log.exercise.name,
          sets: log.sets.length || 1,
          defaultReps: log.sets.find(s => s.reps)?.reps || undefined,
          defaultWeight: log.sets.find(s => s.weight_kg)?.weight_kg || undefined,
          group_id: log.group_id,
          group_type: log.group_type,
        })),
      })
    }

    showFinishModal.value = false
    // Reset template save state
    saveAsTemplate.value = false
    templateName.value = ''
    // Navigate to workout history
    router.push('/workout')
  }
}

// Date validation - can't select future dates
function disableFutureDates(ts: number) {
  return ts > Date.now()
}

// Load templates and check for active workout
onMounted(() => {
  loadTemplates()

  // Check if a template ID was passed in the URL
  const templateId = route.query.template as string
  if (templateId && !workoutStore.isActive) {
    // Wait for templates to load, then start the specified template
    const checkAndStart = () => {
      const template = templates.value.find(t => t.id === templateId)
      if (template) {
        startFromTemplate(template)
      }
    }

    // Try immediately, or watch for templates to load
    if (templates.value.length > 0) {
      checkAndStart()
    } else {
      const stopWatch = watch(templates, (newTemplates) => {
        if (newTemplates.length > 0) {
          checkAndStart()
          stopWatch()
        }
      })
    }
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
        <template v-for="entry in workoutStore.groupedExerciseLogs" :key="entry.type === 'group' ? entry.groupId : entry.exercise.id">
          <!-- Grouped Exercises -->
          <ExerciseGroup
            v-if="entry.type === 'group'"
            :group-type="entry.groupType"
            :exercise-count="entry.exercises.length"
            @dissolve="workoutStore.dissolveGroup(entry.groupId)"
          >
            <div v-for="(member, memberIdx) in entry.exercises" :key="member.log.id">
              <NCard>
                <template #header>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
                        <span class="text-white font-bold text-sm">{{ String.fromCharCode(65 + memberIdx) }}</span>
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 dark:text-white">
                          {{ member.log.exercise.name }}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          {{ formatMuscleGroups(member.log.exercise.muscle_groups) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <!-- Link with next (only if not last in list) -->
                      <NButton
                        v-if="member.exerciseIndex < workoutStore.exerciseLogs.length - 1"
                        quaternary
                        circle
                        size="small"
                        title="Link with next exercise"
                        @click="workoutStore.linkWithNext(member.exerciseIndex)"
                      >
                        <template #icon>
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </template>
                      </NButton>
                      <!-- Unlink from group -->
                      <NButton quaternary circle size="small" title="Remove from group" @click="workoutStore.removeFromGroup(member.exerciseIndex)">
                        <template #icon>
                          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </template>
                      </NButton>
                      <NButton quaternary circle size="small" @click="removeExercise(member.exerciseIndex)">
                        <template #icon>
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </template>
                      </NButton>
                    </div>
                  </div>
                </template>

                <!-- Cardio Input -->
                <div v-if="member.log.exercise.category === 'cardio'" class="space-y-2">
                  <CardioInput
                    :exercise-index="member.exerciseIndex"
                    :tracking-type="getExerciseTrackingType(member.log.exercise.name) || 'duration'"
                    :cardio-log="{
                      duration_sec: member.log.cardio_log?.duration_sec || null,
                      distance_km: member.log.cardio_log?.distance_km || null,
                      calories: member.log.cardio_log?.calories_burned || null,
                    }"
                    @update="(data) => handleCardioUpdate(member.exerciseIndex, data)"
                    @complete="handleCardioComplete(member.exerciseIndex)"
                    @remove="removeExercise(member.exerciseIndex)"
                  />
                  <div v-if="member.log.cardio_log?.completed_at" class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-sm text-green-700 dark:text-green-300">Completed</span>
                  </div>
                </div>

                <!-- Strength Sets -->
                <div v-else class="space-y-2">
                  <div class="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
                    <div class="col-span-1">Set</div>
                    <div class="col-span-3">Previous</div>
                    <div class="col-span-3">Weight</div>
                    <div class="col-span-3">Reps</div>
                    <div class="col-span-2"></div>
                  </div>

                  <WorkoutSetInput
                    v-for="(set, setIndex) in member.log.sets"
                    :key="setIndex"
                    :set="set"
                    :set-index="setIndex"
                    :exercise-index="member.exerciseIndex"
                    :exercise-name="member.log.exercise.name"
                    :previous-sets="getLastPerformedSets(member.log.exercise.name)"
                    @add-drop-set="(setIdx: number) => workoutStore.addDropSet(member.exerciseIndex, setIdx)"
                  />

                  <NButton dashed block @click="workoutStore.addSet(member.exerciseIndex)">
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
          </ExerciseGroup>

          <!-- Standalone Exercise -->
          <NCard v-else>
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
                      {{ entry.exercise.exercise.name }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatMuscleGroups(entry.exercise.exercise.muscle_groups) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <!-- Link with next button -->
                  <NButton
                    v-if="entry.exerciseIndex < workoutStore.exerciseLogs.length - 1"
                    quaternary
                    circle
                    size="small"
                    title="Link with next exercise"
                    @click="workoutStore.linkWithNext(entry.exerciseIndex)"
                  >
                    <template #icon>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </template>
                  </NButton>
                  <NButton quaternary circle @click="removeExercise(entry.exerciseIndex)">
                    <template #icon>
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </template>
                  </NButton>
                </div>
              </div>
            </template>

            <!-- Cardio Input -->
            <div v-if="entry.exercise.exercise.category === 'cardio'" class="space-y-2">
              <CardioInput
                :exercise-index="entry.exerciseIndex"
                :tracking-type="getExerciseTrackingType(entry.exercise.exercise.name) || 'duration'"
                :cardio-log="{
                  duration_sec: entry.exercise.cardio_log?.duration_sec || null,
                  distance_km: entry.exercise.cardio_log?.distance_km || null,
                  calories: entry.exercise.cardio_log?.calories_burned || null,
                }"
                @update="(data) => handleCardioUpdate(entry.exerciseIndex, data)"
                @complete="handleCardioComplete(entry.exerciseIndex)"
                @remove="removeExercise(entry.exerciseIndex)"
              />
              <div v-if="entry.exercise.cardio_log?.completed_at" class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm text-green-700 dark:text-green-300">Completed</span>
              </div>
            </div>

            <!-- Strength Sets -->
            <div v-else class="space-y-2">
              <div class="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-2">
                <div class="col-span-1">Set</div>
                <div class="col-span-3">Previous</div>
                <div class="col-span-3">Weight</div>
                <div class="col-span-3">Reps</div>
                <div class="col-span-2"></div>
              </div>

              <WorkoutSetInput
                v-for="(set, setIndex) in entry.exercise.sets"
                :key="setIndex"
                :set="set"
                :set-index="setIndex"
                :exercise-index="entry.exerciseIndex"
                :exercise-name="entry.exercise.exercise.name"
                :previous-sets="getLastPerformedSets(entry.exercise.exercise.name)"
                @add-drop-set="(setIdx: number) => workoutStore.addDropSet(entry.exerciseIndex, setIdx)"
              />

              <NButton dashed block @click="workoutStore.addSet(entry.exerciseIndex)">
                <template #icon>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </template>
                Add Set
              </NButton>
            </div>
          </NCard>
        </template>

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

      <NTabs type="line" animated default-value="strength">
        <NTabPane name="strength" tab="Strength">
          <div class="space-y-2 max-h-80 overflow-y-auto mt-2">
            <button
              v-for="exercise in filteredExercises.filter(e => e.category !== 'cardio')"
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
        </NTabPane>
        <NTabPane name="cardio" tab="Cardio">
          <div class="space-y-2 max-h-80 overflow-y-auto mt-2">
            <button
              v-for="exercise in filteredExercises.filter(e => e.category === 'cardio')"
              :key="exercise.id"
              class="w-full text-left p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-md transition-all"
              @click="addExercise(exercise)"
            >
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ exercise.name }}
                </span>
                <NTag v-if="exercise.trackingType === 'reps'" size="tiny" type="info">Reps</NTag>
                <NTag v-else-if="exercise.trackingType === 'duration_distance'" size="tiny" type="success">Distance</NTag>
                <NTag v-else size="tiny" type="warning">Time</NTag>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatMuscleGroups(exercise.muscle_groups) }}
              </div>
            </button>
          </div>
        </NTabPane>
      </NTabs>
    </NModal>

    <!-- Finish Workout Modal -->
    <NModal
      v-model:show="showFinishModal"
      preset="card"
      title="Finish Workout"
      :style="{ width: '90%', maxWidth: '400px' }"
    >
      <div class="space-y-4">
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

        <!-- Mood / Energy / Sleep -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">How did you feel?</p>
          <div v-for="tracker in [
            { label: 'Mood', model: workoutMood, setter: (v: number | null) => workoutMood = v },
            { label: 'Energy', model: workoutEnergy, setter: (v: number | null) => workoutEnergy = v },
            { label: 'Sleep', model: workoutSleep, setter: (v: number | null) => workoutSleep = v },
          ]" :key="tracker.label" class="flex items-center gap-3">
            <span class="text-xs text-gray-500 dark:text-gray-400 w-12">{{ tracker.label }}</span>
            <div class="flex gap-1">
              <button
                v-for="opt in moodOptions"
                :key="opt.value"
                class="w-8 h-8 rounded-full flex items-center justify-center text-base transition-all"
                :class="tracker.model === opt.value
                  ? 'bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500 scale-110'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 opacity-50 hover:opacity-100'"
                :title="opt.label"
                @click="tracker.setter(tracker.model === opt.value ? null : opt.value)"
              >
                {{ opt.emoji }}
              </button>
            </div>
          </div>
        </div>

        <!-- Manual Duration Toggle -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">Set duration manually</span>
            <NSwitch v-model:value="useManualDuration" />
          </div>

          <!-- Manual Duration Inputs -->
          <div v-if="useManualDuration" class="flex items-center gap-3">
            <div class="flex-1">
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Hours</label>
              <NInputNumber
                v-model:value="manualDurationHours"
                :min="0"
                :max="12"
                size="small"
                class="w-full"
              />
            </div>
            <div class="flex-1">
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Minutes</label>
              <NInputNumber
                v-model:value="manualDurationMinutes"
                :min="0"
                :max="59"
                size="small"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Save as Template -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span class="text-sm text-gray-600 dark:text-gray-400">Save as template</span>
            </div>
            <NSwitch v-model:value="saveAsTemplate" />
          </div>

          <!-- Template Name Input -->
          <div v-if="saveAsTemplate">
            <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Template Name</label>
            <NInput
              v-model:value="templateName"
              placeholder="e.g., Upper Body Day"
              size="small"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showFinishModal = false">
            Continue
          </NButton>
          <NButton type="primary" class="flex-1" @click="confirmFinishWorkout">
            Save & Finish
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
