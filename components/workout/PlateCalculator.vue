<script setup lang="ts">
import { NCard, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import {
  calculatePlatesNeeded,
  calculateActualWeight,
  formatWeight as formatWeightUtil,
  METRIC_PLATES,
  IMPERIAL_PLATES_IN_KG,
} from '~/utils/fitness'

// Bar weight options
const barOptions = [
  { label: 'Olympic Bar (20kg)', value: 20 },
  { label: 'Women\'s Bar (15kg)', value: 15 },
  { label: 'EZ Curl Bar (10kg)', value: 10 },
  { label: 'Smith Machine (0kg)', value: 0 },
]

const targetWeight = ref<number | null>(100)
const barWeight = ref(20)
const useMetric = ref(true)

const plates = computed(() => useMetric.value ? METRIC_PLATES : IMPERIAL_PLATES_IN_KG)

// Calculate plates needed per side
const platesNeeded = computed(() => {
  return calculatePlatesNeeded(targetWeight.value ?? 0, barWeight.value, plates.value)
})

// Calculate actual loaded weight (may differ from target due to plate availability)
const actualWeight = computed(() => {
  return calculateActualWeight(platesNeeded.value, barWeight.value)
})

const remainder = computed(() => {
  if (!targetWeight.value) return 0
  return Math.round((targetWeight.value - actualWeight.value) * 100) / 100
})

function formatWeight(kg: number): string {
  return formatWeightUtil(kg, useMetric.value)
}

function formatPlateLabel(kg: number): string {
  if (useMetric.value) {
    return `${kg}`
  }
  // Convert to lbs for display
  const lbsMap: Record<number, string> = {
    20.41: '45',
    11.34: '25',
    6.80: '15',
    4.54: '10',
    2.27: '5',
    1.13: '2.5',
  }
  return lbsMap[kg] || `${Math.round(kg * 2.205)}`
}
</script>

<template>
  <NCard title="Plate Calculator">
    <div class="space-y-6">
      <!-- Settings Row -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">lbs</span>
          <NSwitch v-model:value="useMetric" />
          <span class="text-sm text-gray-500 dark:text-gray-400">kg</span>
        </div>
        <NSelect
          v-model:value="barWeight"
          :options="barOptions"
          class="w-48"
        />
      </div>

      <!-- Target Weight Input -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Weight ({{ useMetric ? 'kg' : 'lbs' }})
        </label>
        <NInputNumber
          v-model:value="targetWeight"
          :min="barWeight"
          :max="500"
          :step="useMetric ? 2.5 : 5"
          placeholder="Enter target weight"
          class="w-full"
          size="large"
        />
      </div>

      <!-- Bar Visualization -->
      <div class="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
        <div class="flex items-center justify-center">
          <!-- Left Plates -->
          <div class="flex items-center flex-row-reverse">
            <template v-for="plate in platesNeeded" :key="plate.weight">
              <div
                v-for="i in plate.count"
                :key="`left-${plate.weight}-${i}`"
                class="rounded-sm flex items-center justify-center text-xs font-bold shadow-md mx-0.5"
                :class="[
                  plate.color,
                  plate.weight >= 20 ? 'w-4 h-16' : plate.weight >= 10 ? 'w-3 h-14' : 'w-2 h-12',
                  plate.color.includes('white') ? 'text-gray-700' : 'text-white'
                ]"
              >
                <span class="transform -rotate-90 whitespace-nowrap text-[8px]">
                  {{ formatPlateLabel(plate.weight) }}
                </span>
              </div>
            </template>
          </div>

          <!-- Bar -->
          <div class="relative">
            <!-- Collar Left -->
            <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-gray-600 rounded-sm"></div>
            <!-- Bar Center -->
            <div class="w-32 h-4 bg-gradient-to-b from-gray-400 to-gray-500 rounded-full shadow-inner mx-2"></div>
            <!-- Collar Right -->
            <div class="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-gray-600 rounded-sm"></div>
          </div>

          <!-- Right Plates -->
          <div class="flex items-center">
            <template v-for="plate in platesNeeded" :key="plate.weight">
              <div
                v-for="i in plate.count"
                :key="`right-${plate.weight}-${i}`"
                class="rounded-sm flex items-center justify-center text-xs font-bold shadow-md mx-0.5"
                :class="[
                  plate.color,
                  plate.weight >= 20 ? 'w-4 h-16' : plate.weight >= 10 ? 'w-3 h-14' : 'w-2 h-12',
                  plate.color.includes('white') ? 'text-gray-700' : 'text-white'
                ]"
              >
                <span class="transform -rotate-90 whitespace-nowrap text-[8px]">
                  {{ formatPlateLabel(plate.weight) }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Plates List -->
      <div v-if="platesNeeded.length > 0">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Load per side</h4>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="plate in platesNeeded"
            :key="plate.weight"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-4 h-4 rounded-full shadow-sm"
                :class="plate.color"
              ></div>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ formatPlateLabel(plate.weight) }}{{ useMetric ? 'kg' : 'lb' }}
              </span>
            </div>
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
              &times;{{ plate.count }}
            </span>
          </div>
        </div>
      </div>

      <!-- Weight Summary -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-500 dark:text-gray-400">Bar weight</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ formatWeight(barWeight) }}</span>
        </div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-500 dark:text-gray-400">Plates (total both sides)</span>
          <span class="font-medium text-gray-900 dark:text-white">
            {{ formatWeight(actualWeight - barWeight) }}
          </span>
        </div>
        <div class="flex justify-between items-center text-lg">
          <span class="font-semibold text-gray-900 dark:text-white">Total loaded</span>
          <span class="font-bold text-primary-600 dark:text-primary-400">
            {{ formatWeight(actualWeight) }}
          </span>
        </div>
        <p
          v-if="remainder !== 0"
          class="text-sm text-amber-600 dark:text-amber-400 mt-2"
        >
          Note: {{ Math.abs(remainder) }}kg {{ remainder > 0 ? 'cannot be loaded with available plates' : 'over target' }}
        </p>
      </div>

      <!-- Empty State -->
      <div
        v-if="platesNeeded.length === 0 && targetWeight && targetWeight > barWeight"
        class="text-center py-6 text-gray-500 dark:text-gray-400"
      >
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Weight too low - just use the bar!</p>
      </div>
    </div>
  </NCard>
</template>
