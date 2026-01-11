<script setup lang="ts">
import { NCard, NButton, NInputNumber, NSlider } from 'naive-ui'
import {
  calculate1RM,
  calculatePercentageWeight,
  roundToNearestPlate,
  TRAINING_PERCENTAGES,
} from '~/utils/fitness'

const weight = ref<number | null>(100)
const reps = ref<number>(5)

const estimated1RM = computed(() => {
  return calculate1RM(weight.value ?? 0, reps.value)
})

function calculateWeight(percent: number) {
  return calculatePercentageWeight(estimated1RM.value, percent)
}
</script>

<template>
  <NCard title="1RM Calculator">
    <div class="space-y-6">
      <!-- Input Section -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Weight (kg)
          </label>
          <NInputNumber
            v-model:value="weight"
            :min="0"
            :max="500"
            :step="2.5"
            placeholder="Enter weight"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reps performed
          </label>
          <NInputNumber
            v-model:value="reps"
            :min="1"
            :max="30"
            :step="1"
            placeholder="Enter reps"
            class="w-full"
          />
        </div>
      </div>

      <!-- Slider for Reps -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">Adjust reps</span>
          <span class="text-sm font-medium text-primary-900 dark:text-white">{{ reps }} reps</span>
        </div>
        <NSlider
          v-model:value="reps"
          :min="1"
          :max="20"
          :step="1"
          :marks="{
            1: '1',
            5: '5',
            10: '10',
            15: '15',
            20: '20'
          }"
        />
      </div>

      <!-- Result -->
      <div class="bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 rounded-2xl p-6 text-center text-white shadow-lg">
        <p class="text-sm opacity-90 mb-1">Estimated 1 Rep Max</p>
        <p class="text-5xl font-bold">{{ estimated1RM }}</p>
        <p class="text-sm opacity-90 mt-1">kg</p>
      </div>

      <!-- Formula Explanation -->
      <div class="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Using Epley Formula: 1RM = weight &times; (1 + reps/30)</p>
        <p v-if="weight && reps > 1" class="mt-1">
          {{ weight }} &times; (1 + {{ reps }}/30) = {{ estimated1RM }} kg
        </p>
      </div>

      <!-- Percentage Table -->
      <div v-if="estimated1RM > 0">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Training Weights</h4>
        <div class="space-y-2">
          <div
            v-for="p in TRAINING_PERCENTAGES"
            :key="p.percent"
            class="flex items-center justify-between py-2 px-3 rounded-lg"
            :class="p.percent === 100 ? 'bg-primary-100 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'"
          >
            <div class="flex items-center gap-3">
              <span
                class="w-12 text-center font-medium"
                :class="p.percent === 100 ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
              >
                {{ p.percent }}%
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ p.description }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="font-semibold"
                :class="p.percent === 100 ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'"
              >
                {{ calculateWeight(p.percent) }} kg
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                ({{ roundToNearestPlate(calculateWeight(p.percent)) }})
              </span>
            </div>
          </div>
        </div>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
          Numbers in parentheses rounded to nearest 2.5kg
        </p>
      </div>
    </div>
  </NCard>
</template>
