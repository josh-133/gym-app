<script setup lang="ts">
import { NInputNumber } from 'naive-ui'

interface SetData {
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  set_type: string
  completed_at: string | null
  is_pr: boolean
}

const props = defineProps<{
  set: SetData
  setIndex: number
  exerciseIndex: number
}>()

const workoutStore = useWorkoutStore()

const weight = ref<number | null>(props.set.weight_kg)
const reps = ref<number | null>(props.set.reps)
const isCompleted = ref(!!props.set.completed_at)
const isBodyweight = ref(props.set.weight_kg === 0)

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
    class="grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors"
    :class="isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800/50'"
  >
    <!-- Set Number -->
    <div class="col-span-1 text-center font-medium text-gray-500 dark:text-gray-400">
      {{ set.set_number }}
    </div>

    <!-- Previous -->
    <div class="col-span-3 text-sm text-gray-400 dark:text-gray-500">
      -
    </div>

    <!-- Weight -->
    <div class="col-span-3">
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
          placeholder="kg"
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
    <div class="col-span-3">
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
    <div class="col-span-2 flex justify-center gap-1">
      <span v-if="isCompleted" class="text-green-600 dark:text-green-400">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
        </svg>
      </span>

      <button
        class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
        @click="removeSet"
        title="Remove set"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- PR Badge -->
    <div v-if="set.is_pr" class="col-span-12 mt-1">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        New PR!
      </span>
    </div>
  </div>
</template>
