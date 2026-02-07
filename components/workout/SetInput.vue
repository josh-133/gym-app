<script setup lang="ts">
import { NInputNumber } from 'naive-ui'

type SetType = 'warmup' | 'working' | 'dropset' | 'failure' | 'amrap'

interface SetData {
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  set_type: SetType | string
  completed_at: string | null
  is_pr: boolean
}

interface PreviousSet {
  weight: number | null
  reps: number | null
}

const props = defineProps<{
  set: SetData
  setIndex: number
  exerciseIndex: number
  exerciseName: string
  previousSets?: PreviousSet[]
}>()

const emit = defineEmits<{
  addDropSet: [setIndex: number]
}>()

const workoutStore = useWorkoutStore()
const { weightUnit, convertWeight } = useUnits()

// Get previous set data for this set index
const previousSet = computed(() => {
  if (props.previousSets && props.previousSets[props.setIndex]) {
    return props.previousSets[props.setIndex]
  }
  return null
})

// Format previous set display
const previousDisplay = computed(() => {
  if (!previousSet.value) return null
  const { weight, reps } = previousSet.value
  if (weight === null && reps === null) return null
  if (weight === 0) {
    // Bodyweight exercise
    return reps ? `BW × ${reps}` : null
  }
  if (weight !== null && reps !== null) {
    const displayWeight = convertWeight(weight)
    return `${displayWeight} × ${reps}`
  }
  return null
})

const weight = ref<number | null>(props.set.weight_kg)
const reps = ref<number | null>(props.set.reps)
const rpe = ref<number | null>(props.set.rpe)
const isCompleted = ref(!!props.set.completed_at)
const isBodyweight = ref(props.set.weight_kg === 0)
const showRpeSelector = ref(false)
const showSetTypeSelector = ref(false)
const currentSetType = ref<SetType>((props.set.set_type as SetType) || 'working')

// Set type configuration
const setTypeConfig: Record<SetType, { label: string; badge: string; color: string }> = {
  warmup: { label: 'Warm-up', badge: 'W', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' },
  working: { label: 'Working', badge: '', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  dropset: { label: 'Drop Set', badge: 'D', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  failure: { label: 'Failure', badge: 'F', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  amrap: { label: 'AMRAP', badge: 'A', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
}

const isDropSet = computed(() => currentSetType.value === 'dropset')

function changeSetType(newType: SetType) {
  currentSetType.value = newType
  showSetTypeSelector.value = false
  workoutStore.updateSet(props.exerciseIndex, props.setIndex, { set_type: newType })
}

function handleAddDropSet() {
  emit('addDropSet', props.setIndex)
}

// RPE descriptions
const rpeDescriptions: Record<number, string> = {
  6: 'Light',
  7: 'Moderate',
  8: 'Hard',
  9: 'Very Hard',
  10: 'Max Effort',
}

function setRpe(value: number) {
  rpe.value = value
  showRpeSelector.value = false
  workoutStore.updateSet(props.exerciseIndex, props.setIndex, { rpe: value })
}

// Check if this is a valid completed set
function isValidSet(w: number | null, r: number | null, bw: boolean): boolean {
  const hasValidReps = r !== null && r > 0
  const hasValidWeight = bw ? true : (w !== null && w > 0)
  return hasValidReps && hasValidWeight
}

// Toggle bodyweight mode
function toggleBodyweight() {
  isBodyweight.value = !isBodyweight.value
  if (isBodyweight.value) {
    weight.value = 0
  } else {
    weight.value = null
  }
}

watch([weight, reps, isBodyweight], ([newWeight, newReps, newBodyweight]) => {
  workoutStore.updateSet(props.exerciseIndex, props.setIndex, {
    weight_kg: newWeight,
    reps: newReps,
  })

  // Auto-complete when values are valid
  if (isValidSet(newWeight, newReps, newBodyweight) && !isCompleted.value) {
    workoutStore.completeSet(props.exerciseIndex, props.setIndex, {
      weight_kg: newWeight,
      reps: newReps,
    })
    isCompleted.value = true
  }

  // Uncomplete if values become invalid
  if (isCompleted.value && !isValidSet(newWeight, newReps, newBodyweight)) {
    workoutStore.uncompleteSet(props.exerciseIndex, props.setIndex)
    isCompleted.value = false
  }
}, { immediate: true })

function removeSet() {
  workoutStore.removeSet(props.exerciseIndex, props.setIndex)
}
</script>

<template>
  <div
    class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors"
    :class="[
      isCompleted
        ? isDropSet
          ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400'
          : 'bg-green-50 dark:bg-green-900/20'
        : isDropSet
          ? 'bg-amber-50/50 dark:bg-amber-900/10 border-l-2 border-amber-300'
          : 'bg-gray-50 dark:bg-gray-800/50',
      isDropSet ? 'ml-4' : ''
    ]"
  >
    <!-- Set Number with Type Badge -->
    <div class="col-span-1 text-center font-medium text-gray-500 dark:text-gray-400 relative">
      <div class="flex items-center justify-center gap-1">
        <span>{{ set.set_number }}</span>
        <button
          v-if="setTypeConfig[currentSetType].badge"
          class="w-4 h-4 text-xs font-bold rounded flex items-center justify-center"
          :class="setTypeConfig[currentSetType].color"
          :title="setTypeConfig[currentSetType].label"
          @click.stop="showSetTypeSelector = !showSetTypeSelector"
        >
          {{ setTypeConfig[currentSetType].badge }}
        </button>
      </div>

      <!-- Set Type Selector Dropdown -->
      <div
        v-if="showSetTypeSelector"
        class="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[120px]"
      >
        <button
          v-for="(config, type) in setTypeConfig"
          :key="type"
          class="w-full px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          :class="currentSetType === type ? config.color : 'text-gray-700 dark:text-gray-300'"
          @click="changeSetType(type as SetType)"
        >
          <span v-if="config.badge" class="w-4 h-4 text-xs font-bold rounded flex items-center justify-center" :class="config.color">
            {{ config.badge }}
          </span>
          <span v-else class="w-4"></span>
          <span>{{ config.label }}</span>
        </button>
      </div>
    </div>

    <!-- Previous (hidden on smallest screens) -->
    <div class="hidden sm:block sm:col-span-2 lg:col-span-3 text-sm text-gray-400 dark:text-gray-500">
      {{ previousDisplay || '-' }}
    </div>

    <!-- Weight -->
    <div class="col-span-1 sm:col-span-1 lg:col-span-3">
      <div v-if="isBodyweight" class="flex items-center gap-1">
        <span class="text-sm text-gray-500 dark:text-gray-400 flex-1">BW</span>
        <button
          class="p-1 rounded text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="toggleBodyweight"
          title="Switch to weighted"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div v-else class="flex items-center gap-1">
        <NInputNumber
          v-model:value="weight"
          :placeholder="weightUnit"
          size="small"
          :min="0"
          :max="500"
          :precision="1"
          :show-button="false"
          class="flex-1"
        />
        <button
          class="p-1 rounded text-xs text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          @click="toggleBodyweight"
          title="Bodyweight"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Reps -->
    <div class="col-span-1 sm:col-span-1 lg:col-span-3">
      <NInputNumber
        v-model:value="reps"
        placeholder="reps"
        size="small"
        :min="0"
        :max="100"
        :show-button="false"
      />
    </div>

    <!-- Actions -->
    <div class="col-span-1 sm:col-span-1 lg:col-span-2 flex justify-center gap-1">
      <!-- RPE Button (shows after set is completed) -->
      <div v-if="isCompleted" class="relative">
        <button
          class="px-1.5 py-0.5 rounded text-xs font-medium transition-colors"
          :class="rpe
            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'"
          @click="showRpeSelector = !showRpeSelector"
          title="Rate of Perceived Exertion"
        >
          {{ rpe ? `@${rpe}` : 'RPE' }}
        </button>

        <!-- RPE Dropdown -->
        <div
          v-if="showRpeSelector"
          class="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 min-w-[120px]"
        >
          <button
            v-for="val in [6, 7, 8, 9, 10]"
            :key="val"
            class="w-full px-2 py-1 text-left text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
            :class="rpe === val ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'"
            @click="setRpe(val)"
          >
            <span>@{{ val }}</span>
            <span class="text-xs text-gray-400">{{ rpeDescriptions[val] }}</span>
          </button>
        </div>
      </div>

      <span v-if="isCompleted && !showRpeSelector" class="text-green-600 dark:text-green-400">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
      </span>

      <!-- Add Drop Set Button (shows after set is completed and not already a dropset) -->
      <button
        v-if="isCompleted && currentSetType === 'working'"
        class="px-1.5 py-0.5 rounded text-xs font-medium transition-colors bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
        @click="handleAddDropSet"
        title="Add drop set with reduced weight"
      >
        +D
      </button>

      <button
        class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
        @click="removeSet"
        title="Remove set"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- PR Badge -->
    <div v-if="set.is_pr" class="col-span-4 sm:col-span-6 lg:col-span-12 mt-1">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        New PR!
      </span>
    </div>
  </div>
</template>
