<script setup lang="ts">
import { NCard, NButton, NInputNumber, NForm, NFormItem, NSpin } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const router = useRouter()

const {
  nutritionGoals,
  goalsLoading,
  fetchNutritionGoals,
  saveNutritionGoals,
} = useNutrition()

// Form state
const form = ref({
  daily_calories: 2000,
  daily_protein_g: 150,
  daily_carbs_g: 200,
  daily_fat_g: 65,
})

const saving = ref(false)

// Load existing goals on mount
onMounted(async () => {
  await fetchNutritionGoals()
  if (nutritionGoals.value) {
    form.value = {
      daily_calories: nutritionGoals.value.daily_calories,
      daily_protein_g: nutritionGoals.value.daily_protein_g,
      daily_carbs_g: nutritionGoals.value.daily_carbs_g,
      daily_fat_g: nutritionGoals.value.daily_fat_g,
    }
  }
})

// Calculate macros from calories
function calculateMacros(calories: number, proteinRatio: number, carbsRatio: number, fatRatio: number) {
  // Calories per gram: protein=4, carbs=4, fat=9
  const proteinCals = calories * proteinRatio
  const carbsCals = calories * carbsRatio
  const fatCals = calories * fatRatio

  return {
    protein: Math.round(proteinCals / 4),
    carbs: Math.round(carbsCals / 4),
    fat: Math.round(fatCals / 9),
  }
}

// Preset macro splits
const presets = [
  {
    name: 'Balanced',
    description: '30% protein, 40% carbs, 30% fat',
    ratios: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  },
  {
    name: 'High Protein',
    description: '40% protein, 35% carbs, 25% fat',
    ratios: { protein: 0.40, carbs: 0.35, fat: 0.25 },
  },
  {
    name: 'Low Carb',
    description: '35% protein, 20% carbs, 45% fat',
    ratios: { protein: 0.35, carbs: 0.20, fat: 0.45 },
  },
  {
    name: 'Keto',
    description: '25% protein, 5% carbs, 70% fat',
    ratios: { protein: 0.25, carbs: 0.05, fat: 0.70 },
  },
]

// Apply a preset
function applyPreset(preset: typeof presets[0]) {
  const macros = calculateMacros(
    form.value.daily_calories,
    preset.ratios.protein,
    preset.ratios.carbs,
    preset.ratios.fat
  )
  form.value.daily_protein_g = macros.protein
  form.value.daily_carbs_g = macros.carbs
  form.value.daily_fat_g = macros.fat
}

// Calculate total calories from macros
const calculatedCalories = computed(() => {
  return (
    form.value.daily_protein_g * 4 +
    form.value.daily_carbs_g * 4 +
    form.value.daily_fat_g * 9
  )
})

// Macro percentages
const macroPercentages = computed(() => {
  const total = calculatedCalories.value
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 }
  return {
    protein: Math.round((form.value.daily_protein_g * 4 / total) * 100),
    carbs: Math.round((form.value.daily_carbs_g * 4 / total) * 100),
    fat: Math.round((form.value.daily_fat_g * 9 / total) * 100),
  }
})

// Save goals
async function handleSave() {
  saving.value = true
  try {
    await saveNutritionGoals(form.value)
    router.push('/nutrition')
  } catch (err) {
    console.error('Error saving nutrition goals:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/nutrition">
        <NButton quaternary circle>
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </template>
        </NButton>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">
          <span class="gradient-text">Nutrition Goals</span>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Set your daily calorie and macro targets</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="goalsLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <template v-else>
      <!-- Calorie Goal -->
      <NCard title="Daily Calories">
        <div class="space-y-4">
          <NInputNumber
            v-model:value="form.daily_calories"
            :min="1000"
            :max="10000"
            :step="50"
            size="large"
            class="w-full"
          >
            <template #suffix>
              <span class="text-gray-500">cal</span>
            </template>
          </NInputNumber>

          <!-- Quick calorie presets -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cal in [1500, 1800, 2000, 2200, 2500, 3000]"
              :key="cal"
              class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              :class="form.daily_calories === cal
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
              @click="form.daily_calories = cal"
            >
              {{ cal.toLocaleString() }}
            </button>
          </div>
        </div>
      </NCard>

      <!-- Macro Presets -->
      <NCard title="Macro Split Presets">
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="preset in presets"
            :key="preset.name"
            class="p-4 rounded-xl text-left border-2 transition-colors hover:border-primary-500"
            :class="'border-gray-200 dark:border-gray-700'"
            @click="applyPreset(preset)"
          >
            <p class="font-semibold text-gray-900 dark:text-white">{{ preset.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ preset.description }}</p>
          </button>
        </div>
      </NCard>

      <!-- Macro Goals -->
      <NCard title="Daily Macros">
        <div class="space-y-6">
          <!-- Protein -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="font-medium text-gray-700 dark:text-gray-300">Protein</label>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ macroPercentages.protein }}% · {{ form.daily_protein_g * 4 }} cal
              </span>
            </div>
            <NInputNumber
              v-model:value="form.daily_protein_g"
              :min="0"
              :max="500"
              :step="5"
              size="large"
              class="w-full"
            >
              <template #suffix>
                <span class="text-gray-500">g</span>
              </template>
            </NInputNumber>
          </div>

          <!-- Carbs -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="font-medium text-gray-700 dark:text-gray-300">Carbohydrates</label>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ macroPercentages.carbs }}% · {{ form.daily_carbs_g * 4 }} cal
              </span>
            </div>
            <NInputNumber
              v-model:value="form.daily_carbs_g"
              :min="0"
              :max="500"
              :step="5"
              size="large"
              class="w-full"
            >
              <template #suffix>
                <span class="text-gray-500">g</span>
              </template>
            </NInputNumber>
          </div>

          <!-- Fat -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="font-medium text-gray-700 dark:text-gray-300">Fat</label>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ macroPercentages.fat }}% · {{ form.daily_fat_g * 9 }} cal
              </span>
            </div>
            <NInputNumber
              v-model:value="form.daily_fat_g"
              :min="0"
              :max="300"
              :step="5"
              size="large"
              class="w-full"
            >
              <template #suffix>
                <span class="text-gray-500">g</span>
              </template>
            </NInputNumber>
          </div>

          <!-- Macro Bar Visualization -->
          <div class="mt-4">
            <div class="h-4 rounded-full overflow-hidden flex">
              <div
                class="bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                :style="{ width: `${macroPercentages.protein}%` }"
              />
              <div
                class="bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                :style="{ width: `${macroPercentages.carbs}%` }"
              />
              <div
                class="bg-gradient-to-r from-yellow-500 to-amber-500 transition-all"
                :style="{ width: `${macroPercentages.fat}%` }"
              />
            </div>
            <div class="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-orange-500" />
                Protein
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-cyan-500" />
                Carbs
              </span>
              <span class="flex items-center gap-1">
                <span class="w-3 h-3 rounded bg-gradient-to-r from-yellow-500 to-amber-500" />
                Fat
              </span>
            </div>
          </div>

          <!-- Calorie Summary -->
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Calories from macros:</span>
              <span class="text-lg font-semibold" :class="calculatedCalories === form.daily_calories ? 'text-green-600' : 'text-yellow-600'">
                {{ calculatedCalories.toLocaleString() }} cal
              </span>
            </div>
            <p v-if="calculatedCalories !== form.daily_calories" class="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
              Note: Macro calories ({{ calculatedCalories }}) differ from your goal ({{ form.daily_calories }})
            </p>
          </div>
        </div>
      </NCard>

      <!-- Save Button -->
      <NButton
        type="primary"
        size="large"
        block
        :loading="saving"
        @click="handleSave"
      >
        Save Goals
      </NButton>
    </template>
  </div>
</template>
