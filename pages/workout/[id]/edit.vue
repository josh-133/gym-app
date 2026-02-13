<script setup lang="ts">
import { NCard, NButton, NInput, NInputNumber, NDatePicker, NModal, NEmpty } from 'naive-ui'
import { EXERCISE_LIBRARY, type CardioTrackingType, type ExerciseCategory } from '~/utils/exercises'
import type { ExerciseGroupType } from '~/types/database'
import CardioInput from '~/components/workout/CardioInput.vue'
import ExerciseGroup from '~/components/workout/ExerciseGroup.vue'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()
const { workouts, getWorkout, updateWorkout, loadWorkouts } = useWorkoutHistory()

// Get workout ID from route - computed to ensure reactivity
const workoutId = computed(() => route.params.id as string)

type SetType = 'warmup' | 'working' | 'dropset' | 'failure' | 'amrap'

interface ExerciseData {
  name: string
  category: ExerciseCategory
  trackingType?: CardioTrackingType
  sets: {
    weight: number | null
    reps: number | null
    completed: boolean
    set_type?: SetType
    rpe?: number | null
  }[]
  cardio?: {
    duration_sec: number | null
    distance_km: number | null
    calories: number | null
    completed: boolean
  }
  group_id?: string | null
  group_type?: ExerciseGroupType | null
}

// Form state
const workoutName = ref('')
const workoutDate = ref<number>(Date.now())
const durationHours = ref(0)
const durationMinutes = ref(0)
const workoutNotes = ref<string | null>(null)
const exercises = ref<ExerciseData[]>([])

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
    exercises.value = savedWorkout.exercises.map(ex => {
      // Look up exercise in library to get category and tracking type
      const libraryExercise = EXERCISE_LIBRARY.find(e => e.name === ex.name)
      const category = ex.category || libraryExercise?.category || 'strength'
      const trackingType = libraryExercise?.trackingType

      return {
        name: ex.name,
        category: category as ExerciseCategory,
        trackingType,
        sets: ex.sets.map(set => ({
          weight: set.weight,
          reps: set.reps,
          completed: set.completed,
          set_type: set.set_type,
          rpe: set.rpe,
        })),
        cardio: ex.cardio ? {
          duration_sec: ex.cardio.duration_sec || null,
          distance_km: ex.cardio.distance_km || null,
          calories: ex.cardio.calories || null,
          completed: ex.cardio.completed || false,
        } : undefined,
        group_id: ex.group_id,
        group_type: ex.group_type,
      }
    })
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
      category: ex.category,
      muscleGroups: ex.muscleGroups,
      trackingType: ex.trackingType,
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

function addExercise(exercise: { name: string; category: ExerciseCategory; trackingType?: CardioTrackingType }) {
  const isCardio = exercise.category === 'cardio'

  exercises.value.push({
    name: exercise.name,
    category: exercise.category,
    trackingType: exercise.trackingType,
    sets: isCardio ? [] : [{ weight: null, reps: null, completed: true }],
    cardio: isCardio ? {
      duration_sec: null,
      distance_km: null,
      calories: null,
      completed: false,
    } : undefined,
  })
  showExercisePicker.value = false
  exerciseSearch.value = ''
}

function removeExercise(index: number) {
  const removed = exercises.value[index]
  const groupId = removed?.group_id
  exercises.value.splice(index, 1)
  if (groupId) {
    const remaining = exercises.value.filter(e => e.group_id === groupId)
    if (remaining.length < 2) {
      remaining.forEach(e => { e.group_id = null; e.group_type = null })
    }
  }
}

function addSet(exerciseIndex: number, setType: SetType = 'working') {
  const lastSet = exercises.value[exerciseIndex].sets.at(-1)
  exercises.value[exerciseIndex].sets.push({
    weight: lastSet?.weight || null,
    reps: lastSet?.reps || null,
    completed: true,
    set_type: setType,
    rpe: null,
  })
}

function addDropSet(exerciseIndex: number) {
  const lastSet = exercises.value[exerciseIndex].sets.at(-1)
  const reducedWeight = lastSet?.weight
    ? Math.round(lastSet.weight * 0.75 * 2) / 2 // 75% weight, rounded to 0.5
    : null

  exercises.value[exerciseIndex].sets.push({
    weight: reducedWeight,
    reps: lastSet?.reps || null,
    completed: true,
    set_type: 'dropset',
    rpe: null,
  })
}

function isDropSet(setType?: SetType): boolean {
  return setType === 'dropset'
}

function getSetTypeLabel(type?: SetType): string {
  switch (type) {
    case 'warmup': return 'W'
    case 'dropset': return 'D'
    case 'failure': return 'F'
    case 'amrap': return 'A'
    default: return ''
  }
}

function getSetTypeBadgeClass(type?: SetType): string {
  switch (type) {
    case 'warmup': return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
    case 'dropset': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    case 'failure': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    case 'amrap': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    default: return ''
  }
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

// Handle cardio updates
function handleCardioUpdate(exerciseIndex: number, data: { duration_sec: number | null; distance_km: number | null; calories: number | null }) {
  const exercise = exercises.value[exerciseIndex]
  if (!exercise || !exercise.cardio) return

  exercise.cardio = {
    ...exercise.cardio,
    duration_sec: data.duration_sec,
    distance_km: data.distance_km,
    calories: data.calories,
  }
}

function handleCardioComplete(exerciseIndex: number) {
  const exercise = exercises.value[exerciseIndex]
  if (!exercise || !exercise.cardio) return

  exercise.cardio.completed = true
}

function handleCardioRemove(exerciseIndex: number) {
  removeExercise(exerciseIndex)
}

// --- Superset / Circuit grouping ---
type EditGroupedEntry = { type: 'standalone'; exercise: ExerciseData; index: number }
  | { type: 'group'; groupId: string; groupType: ExerciseGroupType; exercises: { exercise: ExerciseData; index: number }[] }

const groupedExercises = computed<EditGroupedEntry[]>(() => {
  const entries: EditGroupedEntry[] = []
  const seenGroupIds = new Set<string>()

  for (let i = 0; i < exercises.value.length; i++) {
    const ex = exercises.value[i]
    if (ex.group_id) {
      if (seenGroupIds.has(ex.group_id)) continue
      seenGroupIds.add(ex.group_id)
      const members = exercises.value
        .map((e, idx) => ({ exercise: e, index: idx }))
        .filter(item => item.exercise.group_id === ex.group_id)
      entries.push({
        type: 'group',
        groupId: ex.group_id,
        groupType: (ex.group_type || 'superset') as ExerciseGroupType,
        exercises: members,
      })
    } else {
      entries.push({ type: 'standalone', exercise: ex, index: i })
    }
  }
  return entries
})

function linkWithNext(exerciseIndex: number) {
  const current = exercises.value[exerciseIndex]
  const next = exercises.value[exerciseIndex + 1]
  if (!current || !next) return

  const groupId = current.group_id || next.group_id || crypto.randomUUID()

  if (current.group_id && !next.group_id) {
    next.group_id = current.group_id
    next.group_type = current.group_type
  } else if (!current.group_id && next.group_id) {
    current.group_id = next.group_id
    current.group_type = next.group_type
  } else if (!current.group_id && !next.group_id) {
    current.group_id = groupId
    current.group_type = 'superset'
    next.group_id = groupId
    next.group_type = 'superset'
  } else if (current.group_id === next.group_id) {
    return
  } else {
    const targetId = current.group_id!
    const sourceId = next.group_id!
    exercises.value.forEach(e => {
      if (e.group_id === sourceId) e.group_id = targetId
    })
  }

  const finalGroupId = current.group_id!
  const members = exercises.value.filter(e => e.group_id === finalGroupId)
  const groupType: ExerciseGroupType = members.length >= 3 ? 'circuit' : 'superset'
  members.forEach(e => { e.group_type = groupType })
}

function editRemoveFromGroup(exerciseIndex: number) {
  const ex = exercises.value[exerciseIndex]
  if (!ex || !ex.group_id) return

  const groupId = ex.group_id
  ex.group_id = null
  ex.group_type = null

  const remaining = exercises.value.filter(e => e.group_id === groupId)
  if (remaining.length < 2) {
    remaining.forEach(e => { e.group_id = null; e.group_type = null })
  } else {
    const groupType: ExerciseGroupType = remaining.length >= 3 ? 'circuit' : 'superset'
    remaining.forEach(e => { e.group_type = groupType })
  }
}

function dissolveGroup(groupId: string) {
  exercises.value.forEach(e => {
    if (e.group_id === groupId) {
      e.group_id = null
      e.group_type = null
    }
  })
}

// Calculate volume (only for strength exercises)
const totalVolume = computed(() => {
  return exercises.value.reduce((sum, ex) => {
    if (ex.category === 'cardio') return sum
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
    exercises: exercises.value.map(ex => ({
      name: ex.name,
      category: ex.category,
      sets: ex.sets,
      cardio: ex.cardio ? {
        duration_sec: ex.cardio.duration_sec || 0,
        distance_km: ex.cardio.distance_km,
        calories: ex.cardio.calories,
        completed: ex.cardio.completed,
      } : undefined,
      group_id: ex.group_id,
      group_type: ex.group_type,
    })),
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

        <template v-for="entry in groupedExercises" :key="entry.type === 'group' ? entry.groupId : entry.index">
          <!-- Grouped Exercises -->
          <ExerciseGroup
            v-if="entry.type === 'group'"
            :group-type="entry.groupType"
            :exercise-count="entry.exercises.length"
            @dissolve="dissolveGroup(entry.groupId)"
          >
            <NCard v-for="(member, memberIdx) in entry.exercises" :key="member.index">
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span class="font-bold text-sm text-indigo-600 dark:text-indigo-400">{{ String.fromCharCode(65 + memberIdx) }}</span>
                    </div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">{{ member.exercise.name }}</h3>
                  </div>
                  <div class="flex items-center gap-1">
                    <NButton
                      v-if="member.index < exercises.length - 1"
                      size="tiny"
                      quaternary
                      title="Link with next exercise"
                      @click="linkWithNext(member.index)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </NButton>
                    <NButton size="tiny" quaternary title="Remove from group" @click="editRemoveFromGroup(member.index)">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </NButton>
                    <NButton size="tiny" quaternary type="error" @click="removeExercise(member.index)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </NButton>
                  </div>
                </div>
              </template>

              <!-- Cardio Input for cardio exercises -->
              <div v-if="member.exercise.category === 'cardio' && member.exercise.cardio" class="space-y-3">
                <CardioInput
                  :exercise-index="member.index"
                  :tracking-type="member.exercise.trackingType || 'duration'"
                  :cardio-log="{
                    duration_sec: member.exercise.cardio.duration_sec,
                    distance_km: member.exercise.cardio.distance_km,
                    calories: member.exercise.cardio.calories,
                  }"
                  @update="(data) => handleCardioUpdate(member.index, data)"
                  @complete="handleCardioComplete(member.index)"
                  @remove="handleCardioRemove(member.index)"
                />
                <div v-if="member.exercise.cardio.completed" class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm font-medium text-green-700 dark:text-green-300">Completed</span>
                </div>
              </div>

              <!-- Sets Table for strength exercises -->
              <div v-else class="space-y-3">
                <div class="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                  <div class="col-span-2">Set</div>
                  <div class="col-span-4">Weight (kg)</div>
                  <div class="col-span-4">Reps</div>
                  <div class="col-span-2"></div>
                </div>

                <div
                  v-for="(set, setIndex) in member.exercise.sets"
                  :key="setIndex"
                  class="grid grid-cols-12 gap-2 items-center rounded-lg p-1 transition-colors"
                  :class="isDropSet(set.set_type) ? 'bg-amber-50/50 dark:bg-amber-900/10 ml-3 border-l-2 border-amber-400' : ''"
                >
                  <div class="col-span-2 text-center font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1">
                    <span>{{ setIndex + 1 }}</span>
                    <span
                      v-if="getSetTypeLabel(set.set_type)"
                      class="w-4 h-4 text-xs font-bold rounded flex items-center justify-center"
                      :class="getSetTypeBadgeClass(set.set_type)"
                      :title="set.set_type"
                    >
                      {{ getSetTypeLabel(set.set_type) }}
                    </span>
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
                      :disabled="member.exercise.sets.length <= 1"
                      @click="removeSet(member.index, setIndex)"
                    >
                      <svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </NButton>
                  </div>
                </div>

                <div class="flex gap-2">
                  <NButton size="small" dashed class="flex-1" @click="addSet(member.index)">
                    <template #icon>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </template>
                    Add Set
                  </NButton>
                  <NButton
                    size="small"
                    dashed
                    class="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    @click="addDropSet(member.index)"
                  >
                    <template #icon>
                      <span class="font-bold">D</span>
                    </template>
                    Drop Set
                  </NButton>
                </div>
              </div>
            </NCard>
          </ExerciseGroup>

          <!-- Standalone Exercise -->
          <NCard v-else>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <span class="font-bold text-sm text-indigo-600 dark:text-indigo-400">{{ entry.index + 1 }}</span>
                  </div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ entry.exercise.name }}</h3>
                </div>
                <div class="flex items-center gap-1">
                  <NButton
                    v-if="entry.index < exercises.length - 1"
                    size="tiny"
                    quaternary
                    title="Link with next exercise"
                    @click="linkWithNext(entry.index)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </NButton>
                  <NButton size="tiny" quaternary :disabled="entry.index === 0" @click="moveExerciseUp(entry.index)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </NButton>
                  <NButton size="tiny" quaternary :disabled="entry.index === exercises.length - 1" @click="moveExerciseDown(entry.index)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </NButton>
                  <NButton size="tiny" quaternary type="error" @click="removeExercise(entry.index)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </NButton>
                </div>
              </div>
            </template>

            <!-- Cardio Input for cardio exercises -->
            <div v-if="entry.exercise.category === 'cardio' && entry.exercise.cardio" class="space-y-3">
              <CardioInput
                :exercise-index="entry.index"
                :tracking-type="entry.exercise.trackingType || 'duration'"
                :cardio-log="{
                  duration_sec: entry.exercise.cardio.duration_sec,
                  distance_km: entry.exercise.cardio.distance_km,
                  calories: entry.exercise.cardio.calories,
                }"
                @update="(data) => handleCardioUpdate(entry.index, data)"
                @complete="handleCardioComplete(entry.index)"
                @remove="handleCardioRemove(entry.index)"
              />
              <div v-if="entry.exercise.cardio.completed" class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm font-medium text-green-700 dark:text-green-300">Completed</span>
              </div>
            </div>

            <!-- Sets Table for strength exercises -->
            <div v-else class="space-y-3">
              <div class="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                <div class="col-span-2">Set</div>
                <div class="col-span-4">Weight (kg)</div>
                <div class="col-span-4">Reps</div>
                <div class="col-span-2"></div>
              </div>

              <div
                v-for="(set, setIndex) in entry.exercise.sets"
                :key="setIndex"
                class="grid grid-cols-12 gap-2 items-center rounded-lg p-1 transition-colors"
                :class="isDropSet(set.set_type) ? 'bg-amber-50/50 dark:bg-amber-900/10 ml-3 border-l-2 border-amber-400' : ''"
              >
                <div class="col-span-2 text-center font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1">
                  <span>{{ setIndex + 1 }}</span>
                  <span
                    v-if="getSetTypeLabel(set.set_type)"
                    class="w-4 h-4 text-xs font-bold rounded flex items-center justify-center"
                    :class="getSetTypeBadgeClass(set.set_type)"
                    :title="set.set_type"
                  >
                    {{ getSetTypeLabel(set.set_type) }}
                  </span>
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
                    :disabled="entry.exercise.sets.length <= 1"
                    @click="removeSet(entry.index, setIndex)"
                  >
                    <svg class="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </NButton>
                </div>
              </div>

              <div class="flex gap-2">
                <NButton size="small" dashed class="flex-1" @click="addSet(entry.index)">
                  <template #icon>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </template>
                  Add Set
                </NButton>
                <NButton
                  size="small"
                  dashed
                  class="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  @click="addDropSet(entry.index)"
                >
                  <template #icon>
                    <span class="font-bold">D</span>
                  </template>
                  Drop Set
                </NButton>
              </div>
            </div>
          </NCard>
        </template>
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
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-white">
              {{ exercise.name }}
            </span>
            <span
              v-if="exercise.category === 'cardio'"
              class="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            >
              Cardio
            </span>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatMuscleGroups(exercise.muscleGroups) }}
          </div>
        </button>
      </div>
    </NModal>
  </div>
</template>
