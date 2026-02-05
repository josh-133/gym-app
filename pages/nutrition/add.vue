<script setup lang="ts">
import { NCard, NInput, NButton, NInputNumber, NSelect, NTabs, NTabPane, NSpin, NEmpty, NModal } from 'naive-ui'
import type { FoodSearchResult } from '~/composables/useFoodSearch'
import type { MealType } from '~/composables/useNutrition'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const router = useRouter()

const {
  searchResults,
  customFoods,
  recentFoods,
  searching,
  searchError,
  searchFoods,
  clearSearch,
  fetchCustomFoods,
  fetchRecentFoods,
  customFoodToSearchResult,
  calculateNutrition,
} = useFoodSearch()

const { addFoodEntry, getMealInfo, fetchFoodEntries } = useNutrition()

// Get meal type and date from query params
const mealType = ref<MealType>((route.query.meal as MealType) || 'breakfast')
const selectedDate = ref<string>((route.query.date as string) || new Date().toISOString().split('T')[0])

// Search state
const searchQuery = ref('')
const activeTab = ref('search')

// Portion modal state
const showPortionModal = ref(false)
const selectedFood = ref<FoodSearchResult | null>(null)
const servingSize = ref(100)
const servings = ref(1)
const saving = ref(false)

// Meal type options for the select
const mealOptions = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snacks', value: 'snacks' },
]

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchCustomFoods(),
    fetchRecentFoods(),
  ])
})

// Handle search input
function handleSearch(value: string) {
  searchQuery.value = value
  if (value.length >= 2) {
    searchFoods(value)
  } else {
    clearSearch()
  }
}

// Select a food to add
function selectFood(food: FoodSearchResult) {
  selectedFood.value = food
  servingSize.value = food.serving_size_g || 100
  servings.value = 1
  showPortionModal.value = true
}

// Select a custom food
function selectCustomFood(food: any) {
  selectFood(customFoodToSearchResult(food))
}

// Calculate nutrition for current portion
const portionNutrition = computed(() => {
  if (!selectedFood.value) return null
  return calculateNutrition(selectedFood.value, servingSize.value, servings.value)
})

// Add food to diary
async function handleAddFood() {
  if (!selectedFood.value || !portionNutrition.value) return

  saving.value = true
  try {
    // Create date at noon for the selected date to avoid timezone issues
    const loggedAt = new Date(selectedDate.value)
    loggedAt.setHours(12, 0, 0, 0)

    await addFoodEntry({
      logged_at: loggedAt.toISOString(),
      meal_type: mealType.value,
      food_name: selectedFood.value.name,
      brand: selectedFood.value.brand,
      barcode: selectedFood.value.barcode,
      serving_size_g: servingSize.value,
      servings: servings.value,
      calories: portionNutrition.value.calories,
      protein_g: portionNutrition.value.protein_g,
      carbs_g: portionNutrition.value.carbs_g,
      fat_g: portionNutrition.value.fat_g,
      fiber_g: portionNutrition.value.fiber_g,
      sugar_g: portionNutrition.value.sugar_g,
    })

    // Close modal and refresh
    showPortionModal.value = false
    selectedFood.value = null

    // Refresh the recent foods
    await fetchRecentFoods()

    // Navigate back to nutrition page
    router.push('/nutrition')
  } catch (err) {
    console.error('Error adding food:', err)
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
          <span class="gradient-text">Add Food</span>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Adding to {{ getMealInfo(mealType).label }}
        </p>
      </div>
    </div>

    <!-- Meal Selector -->
    <NSelect
      v-model:value="mealType"
      :options="mealOptions"
      size="large"
    />

    <!-- Search Input -->
    <NInput
      :value="searchQuery"
      placeholder="Search foods..."
      size="large"
      clearable
      @update:value="handleSearch"
    >
      <template #prefix>
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </template>
    </NInput>

    <!-- Tabs -->
    <NTabs v-model:value="activeTab" type="segment" animated>
      <NTabPane name="search" tab="Search">
        <!-- Loading -->
        <div v-if="searching" class="flex justify-center py-12">
          <NSpin size="large" />
        </div>

        <!-- Error -->
        <div v-else-if="searchError" class="text-center py-12">
          <p class="text-red-500">{{ searchError }}</p>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchResults.length > 0" class="space-y-2">
          <button
            v-for="food in searchResults"
            :key="food.id"
            class="w-full p-4 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            @click="selectFood(food)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 mr-4">
                <p class="font-medium text-gray-900 dark:text-white truncate">
                  {{ food.name }}
                </p>
                <p v-if="food.brand" class="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {{ food.brand }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ Math.round(food.calories_per_100g) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">cal/100g</p>
              </div>
            </div>
            <div class="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>P: {{ food.protein_per_100g }}g</span>
              <span>C: {{ food.carbs_per_100g }}g</span>
              <span>F: {{ food.fat_per_100g }}g</span>
            </div>
          </button>
        </div>

        <!-- Empty State -->
        <div v-else class="py-12">
          <NEmpty description="Search for foods to add" />
        </div>
      </NTabPane>

      <NTabPane name="recent" tab="Recent">
        <div v-if="recentFoods.length > 0" class="space-y-2">
          <button
            v-for="food in recentFoods"
            :key="food.id"
            class="w-full p-4 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            @click="selectFood(food)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 mr-4">
                <p class="font-medium text-gray-900 dark:text-white truncate">
                  {{ food.name }}
                </p>
                <p v-if="food.brand" class="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {{ food.brand }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ Math.round(food.calories_per_100g) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">cal/100g</p>
              </div>
            </div>
          </button>
        </div>
        <div v-else class="py-12">
          <NEmpty description="No recent foods" />
        </div>
      </NTabPane>

      <NTabPane name="custom" tab="Custom">
        <div class="mb-4">
          <NuxtLink to="/nutrition/custom/new">
            <NButton block dashed>
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </template>
              Create Custom Food
            </NButton>
          </NuxtLink>
        </div>

        <div v-if="customFoods.length > 0" class="space-y-2">
          <button
            v-for="food in customFoods"
            :key="food.id"
            class="w-full p-4 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            @click="selectCustomFood(food)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 mr-4">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ food.food_name }}
                  </p>
                  <span v-if="food.is_favorite" class="text-yellow-500">★</span>
                </div>
                <p v-if="food.brand" class="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {{ food.brand }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ Math.round(food.calories_per_100g) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">cal/100g</p>
              </div>
            </div>
          </button>
        </div>
        <div v-else class="py-12">
          <NEmpty description="No custom foods yet" />
        </div>
      </NTabPane>
    </NTabs>

    <!-- Portion Modal -->
    <NModal
      v-model:show="showPortionModal"
      preset="card"
      :title="selectedFood?.name || 'Add Portion'"
      :style="{ width: '90%', maxWidth: '400px' }"
    >
      <div v-if="selectedFood" class="space-y-6">
        <!-- Brand -->
        <p v-if="selectedFood.brand" class="text-gray-500 dark:text-gray-400 -mt-2">
          {{ selectedFood.brand }}
        </p>

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
              :class="servingSize === preset
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
              @click="servingSize = preset"
            >
              {{ preset }}g
            </button>
          </div>
          <NInputNumber
            v-model:value="servingSize"
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
              :class="servings === num
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
              @click="servings = num"
            >
              {{ num }}
            </button>
          </div>
          <NInputNumber
            v-model:value="servings"
            :min="0.25"
            :max="10"
            :step="0.25"
            size="large"
          />
        </div>

        <!-- Nutrition Summary -->
        <div v-if="portionNutrition" class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Per serving ({{ servingSize }}g × {{ servings }}):
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

        <!-- Meal Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add to
          </label>
          <NSelect
            v-model:value="mealType"
            :options="mealOptions"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showPortionModal = false">Cancel</NButton>
          <NButton
            type="primary"
            class="flex-1"
            :loading="saving"
            @click="handleAddFood"
          >
            Add to Diary
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
