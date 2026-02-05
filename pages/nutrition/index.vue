<script setup lang="ts">
import { NCard, NButton, NProgress, NSpin, NEmpty } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const {
  nutritionGoals,
  foodEntries,
  selectedDate,
  loading,
  fetchNutritionGoals,
  fetchFoodEntries,
  deleteFoodEntry,
  goToPreviousDay,
  goToNextDay,
  goToToday,
  dailyTotals,
  mealGroups,
  calorieProgress,
  proteinProgress,
  carbsProgress,
  fatProgress,
  remaining,
  isToday,
  formattedDate,
  getMealInfo,
} = useNutrition()

// Track which meal is expanded (all expanded by default)
const expandedMeals = ref<Set<string>>(new Set(['breakfast', 'lunch', 'dinner', 'snacks']))

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchNutritionGoals(),
    fetchFoodEntries(),
  ])
})

// Toggle meal section
function toggleMeal(mealType: string) {
  if (expandedMeals.value.has(mealType)) {
    expandedMeals.value.delete(mealType)
  } else {
    expandedMeals.value.add(mealType)
  }
}

// Handle delete food entry
async function handleDelete(id: string) {
  try {
    await deleteFoodEntry(id)
  } catch (err) {
    console.error('Error deleting food entry:', err)
  }
}

// Navigate to add food page with meal type
function addFood(mealType: string) {
  navigateTo(`/nutrition/add?meal=${mealType}&date=${selectedDate.value}`)
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          <span class="gradient-text">Nutrition</span>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Track your daily nutrition</p>
      </div>
      <NuxtLink to="/nutrition/goals">
        <NButton quaternary circle>
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </template>
        </NButton>
      </NuxtLink>
    </div>

    <!-- Date Navigation -->
    <div class="flex items-center justify-center gap-4">
      <NButton quaternary circle @click="goToPreviousDay">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </template>
      </NButton>
      <button
        class="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-4 py-2 rounded-lg"
        @click="goToToday"
      >
        {{ formattedDate }}
      </button>
      <NButton quaternary circle :disabled="isToday" @click="goToNextDay">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </template>
      </NButton>
    </div>

    <!-- Daily Progress Summary -->
    <NCard v-if="nutritionGoals">
      <div class="space-y-4">
        <!-- Calories -->
        <div class="text-center">
          <div class="relative inline-flex items-center justify-center">
            <svg class="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                stroke-width="8"
                class="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="url(#calorieGradient)"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="`${calorieProgress * 3.52} 352`"
                class="transition-all duration-500"
              />
              <defs>
                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#6366f1" />
                  <stop offset="50%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ Math.round(dailyTotals.calories) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">/ {{ nutritionGoals.daily_calories }}</p>
            </div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Calories</p>
        </div>

        <!-- Macros -->
        <div class="grid grid-cols-3 gap-4">
          <!-- Protein -->
          <div class="text-center">
            <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                class="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                :style="{ width: `${proteinProgress}%` }"
              />
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ Math.round(dailyTotals.protein_g) }}g
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              / {{ nutritionGoals.daily_protein_g }}g Protein
            </p>
          </div>

          <!-- Carbs -->
          <div class="text-center">
            <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                class="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                :style="{ width: `${carbsProgress}%` }"
              />
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ Math.round(dailyTotals.carbs_g) }}g
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              / {{ nutritionGoals.daily_carbs_g }}g Carbs
            </p>
          </div>

          <!-- Fat -->
          <div class="text-center">
            <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                class="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
                :style="{ width: `${fatProgress}%` }"
              />
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ Math.round(dailyTotals.fat_g) }}g
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              / {{ nutritionGoals.daily_fat_g }}g Fat
            </p>
          </div>
        </div>

        <!-- Remaining -->
        <div class="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <span class="font-medium text-gray-900 dark:text-white">{{ Math.round(remaining.calories) }}</span> cal remaining
          </p>
        </div>
      </div>
    </NCard>

    <!-- No Goals Set -->
    <NCard v-else class="text-center py-8">
      <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Set Your Nutrition Goals</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">Configure your daily calorie and macro targets</p>
      <NuxtLink to="/nutrition/goals">
        <NButton type="primary">Set Goals</NButton>
      </NuxtLink>
    </NCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <NSpin size="large" />
    </div>

    <!-- Meal Sections -->
    <div v-else class="space-y-4">
      <div
        v-for="meal in mealGroups"
        :key="meal.meal_type"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      >
        <!-- Meal Header -->
        <button
          class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          @click="toggleMeal(meal.meal_type)"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ getMealInfo(meal.meal_type).icon }}</span>
            <div class="text-left">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ getMealInfo(meal.meal_type).label }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ meal.entries.length }} {{ meal.entries.length === 1 ? 'item' : 'items' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ Math.round(meal.calories) }} cal
            </span>
            <svg
              class="w-5 h-5 text-gray-400 transition-transform"
              :class="{ 'rotate-180': expandedMeals.has(meal.meal_type) }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <!-- Meal Content -->
        <div v-if="expandedMeals.has(meal.meal_type)" class="border-t border-gray-200 dark:border-gray-700">
          <!-- Food Entries -->
          <div v-if="meal.entries.length > 0" class="divide-y divide-gray-100 dark:divide-gray-700">
            <div
              v-for="entry in meal.entries"
              :key="entry.id"
              class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
            >
              <div class="flex-1 min-w-0 mr-4">
                <p class="font-medium text-gray-900 dark:text-white truncate">
                  {{ entry.food_name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ entry.brand ? `${entry.brand} • ` : '' }}{{ entry.serving_size_g }}g × {{ entry.servings }}
                </p>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="font-semibold text-gray-900 dark:text-white">{{ Math.round(entry.calories) }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">cal</p>
                </div>
                <button
                  class="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                  @click.stop="handleDelete(entry.id)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="p-6 text-center text-gray-500 dark:text-gray-400">
            No foods logged
          </div>

          <!-- Add Food Button -->
          <div class="p-3 border-t border-gray-200 dark:border-gray-700">
            <NButton
              block
              dashed
              @click="addFood(meal.meal_type)"
            >
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </template>
              Add Food
            </NButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
