<script setup lang="ts">
import { NCard, NButton, NInputNumber, NSelect, NInput, NSpin } from 'naive-ui'
import type { MealType, FoodEntry } from '~/composables/useNutrition'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()
const notification = useNotification()

const { getFoodEntryById, updateFoodEntry, getMealInfo, selectedDate } = useNutrition()

// Entry ID from route
const entryId = computed(() => route.params.id as string)

// Loading states
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

// Original entry data
const originalEntry = ref<FoodEntry | null>(null)

// Form state
const form = ref({
  food_name: '',
  brand: '' as string | null,
  meal_type: 'breakfast' as MealType,
  serving_size_g: 100,
  servings: 1,
  notes: '' as string | null,
})

// Nutrition per 100g (calculated from original entry)
const nutritionPer100g = ref({
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: null as number | null,
  sugar_g: null as number | null,
})

// Meal type options for the select
const mealOptions = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snacks', value: 'snacks' },
]

// Load entry on mount
onMounted(async () => {
  try {
    const entry = await getFoodEntryById(entryId.value)
    if (!entry) {
      error.value = 'Food entry not found'
      return
    }

    originalEntry.value = entry

    // Populate form
    form.value = {
      food_name: entry.food_name,
      brand: entry.brand,
      meal_type: entry.meal_type,
      serving_size_g: entry.serving_size_g,
      servings: entry.servings,
      notes: entry.notes,
    }

    // Calculate nutrition per 100g from the original entry
    // The stored values are for (serving_size_g * servings)
    const totalGrams = entry.serving_size_g * entry.servings
    if (totalGrams > 0) {
      nutritionPer100g.value = {
        calories: (entry.calories / totalGrams) * 100,
        protein_g: (entry.protein_g / totalGrams) * 100,
        carbs_g: (entry.carbs_g / totalGrams) * 100,
        fat_g: (entry.fat_g / totalGrams) * 100,
        fiber_g: entry.fiber_g ? (entry.fiber_g / totalGrams) * 100 : null,
        sugar_g: entry.sugar_g ? (entry.sugar_g / totalGrams) * 100 : null,
      }
    }
  } catch (err: any) {
    console.error('Error loading food entry:', err)
    error.value = err?.message || 'Failed to load food entry'
  } finally {
    loading.value = false
  }
})

// Calculate current portion nutrition
const portionNutrition = computed(() => {
  const multiplier = (form.value.serving_size_g * form.value.servings) / 100
  return {
    calories: Math.round(nutritionPer100g.value.calories * multiplier),
    protein_g: Math.round(nutritionPer100g.value.protein_g * multiplier * 10) / 10,
    carbs_g: Math.round(nutritionPer100g.value.carbs_g * multiplier * 10) / 10,
    fat_g: Math.round(nutritionPer100g.value.fat_g * multiplier * 10) / 10,
    fiber_g: nutritionPer100g.value.fiber_g
      ? Math.round(nutritionPer100g.value.fiber_g * multiplier * 10) / 10
      : null,
    sugar_g: nutritionPer100g.value.sugar_g
      ? Math.round(nutritionPer100g.value.sugar_g * multiplier * 10) / 10
      : null,
  }
})

// Save changes
async function handleSave() {
  if (!originalEntry.value) return

  saving.value = true
  try {
    await updateFoodEntry(entryId.value, {
      food_name: form.value.food_name,
      brand: form.value.brand || null,
      meal_type: form.value.meal_type,
      serving_size_g: form.value.serving_size_g,
      servings: form.value.servings,
      calories: portionNutrition.value.calories,
      protein_g: portionNutrition.value.protein_g,
      carbs_g: portionNutrition.value.carbs_g,
      fat_g: portionNutrition.value.fat_g,
      fiber_g: portionNutrition.value.fiber_g,
      sugar_g: portionNutrition.value.sugar_g,
      notes: form.value.notes || null,
    })

    notification.success('Food entry updated!')
    router.push('/nutrition')
  } catch (err: any) {
    console.error('Error updating food entry:', err)
    notification.error(err?.message || 'Failed to update food entry')
  } finally {
    saving.value = false
  }
}

// Quick add preset portions
const presetServings = [50, 100, 150, 200]
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
      <div class="flex-1">
        <h1 class="text-2xl font-bold">
          <span class="gradient-text">Edit Food Entry</span>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Update serving size or meal
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <!-- Error State -->
    <NCard v-else-if="error" class="text-center py-8">
      <svg class="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ error }}</h3>
      <NuxtLink to="/nutrition">
        <NButton type="primary">Back to Nutrition</NButton>
      </NuxtLink>
    </NCard>

    <!-- Edit Form -->
    <template v-else-if="originalEntry">
      <!-- Food Info Card -->
      <NCard>
        <div class="space-y-4">
          <!-- Food Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Food Name
            </label>
            <NInput
              v-model:value="form.food_name"
              size="large"
              placeholder="Food name"
            />
          </div>

          <!-- Brand -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brand (optional)
            </label>
            <NInput
              v-model:value="form.brand"
              placeholder="Brand name"
            />
          </div>
        </div>
      </NCard>

      <!-- Serving Size Card -->
      <NCard title="Serving Size">
        <div class="space-y-6">
          <!-- Serving Size -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Serving Size (g)
            </label>
            <div class="flex gap-2 mb-2">
              <button
                v-for="preset in presetServings"
                :key="preset"
                class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                :class="form.serving_size_g === preset
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                @click="form.serving_size_g = preset"
              >
                {{ preset }}g
              </button>
            </div>
            <NInputNumber
              v-model:value="form.serving_size_g"
              :min="1"
              :max="2000"
              :step="10"
              size="large"
            />
          </div>

          <!-- Number of Servings -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Servings
            </label>
            <div class="flex gap-2 mb-2">
              <button
                v-for="num in [0.5, 1, 1.5, 2]"
                :key="num"
                class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                :class="form.servings === num
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                @click="form.servings = num"
              >
                {{ num }}
              </button>
            </div>
            <NInputNumber
              v-model:value="form.servings"
              :min="0.25"
              :max="10"
              :step="0.25"
              size="large"
            />
          </div>
        </div>
      </NCard>

      <!-- Nutrition Summary -->
      <NCard title="Nutrition">
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Per serving ({{ form.serving_size_g }}g x {{ form.servings }}):
          </p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ portionNutrition.calories }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Calories</p>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">{{ portionNutrition.protein_g }}g</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Protein</p>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">{{ portionNutrition.carbs_g }}g</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Carbs</p>
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">{{ portionNutrition.fat_g }}g</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Fat</p>
              </div>
            </div>
          </div>
        </div>
      </NCard>

      <!-- Meal Type Card -->
      <NCard title="Meal">
        <NSelect
          v-model:value="form.meal_type"
          :options="mealOptions"
          size="large"
        />
      </NCard>

      <!-- Notes Card -->
      <NCard title="Notes (optional)">
        <NInput
          v-model:value="form.notes"
          type="textarea"
          placeholder="Add any notes..."
          :rows="3"
        />
      </NCard>

      <!-- Save Button -->
      <NButton
        type="primary"
        size="large"
        block
        :loading="saving"
        @click="handleSave"
      >
        Save Changes
      </NButton>
    </template>
  </div>
</template>
