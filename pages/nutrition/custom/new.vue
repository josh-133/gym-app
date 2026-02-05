<script setup lang="ts">
import { NCard, NButton, NInput, NInputNumber, NSwitch } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const router = useRouter()
const { createCustomFood } = useFoodSearch()

// Form state
const form = ref({
  food_name: '',
  brand: '',
  calories_per_100g: 0,
  protein_per_100g: 0,
  carbs_per_100g: 0,
  fat_per_100g: 0,
  fiber_per_100g: null as number | null,
  sugar_per_100g: null as number | null,
  default_serving_size_g: 100,
  default_serving_description: '',
  is_favorite: false,
})

const saving = ref(false)

// Validation
const isValid = computed(() => {
  return form.value.food_name.trim().length > 0 && form.value.calories_per_100g > 0
})

// Calculate calories from macros
const calculatedCalories = computed(() => {
  return Math.round(
    form.value.protein_per_100g * 4 +
    form.value.carbs_per_100g * 4 +
    form.value.fat_per_100g * 9
  )
})

// Save custom food
async function handleSave() {
  if (!isValid.value) return

  saving.value = true
  try {
    await createCustomFood({
      food_name: form.value.food_name.trim(),
      brand: form.value.brand.trim() || null,
      calories_per_100g: form.value.calories_per_100g,
      protein_per_100g: form.value.protein_per_100g,
      carbs_per_100g: form.value.carbs_per_100g,
      fat_per_100g: form.value.fat_per_100g,
      fiber_per_100g: form.value.fiber_per_100g,
      sugar_per_100g: form.value.sugar_per_100g,
      default_serving_size_g: form.value.default_serving_size_g,
      default_serving_description: form.value.default_serving_description.trim() || null,
      is_favorite: form.value.is_favorite,
    })
    router.push('/nutrition/add')
  } catch (err) {
    console.error('Error creating custom food:', err)
  } finally {
    saving.value = false
  }
}

// Auto-calculate calories from macros
function autoCalculateCalories() {
  form.value.calories_per_100g = calculatedCalories.value
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/nutrition/add">
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
          <span class="gradient-text">Create Custom Food</span>
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Add your own food to your library</p>
      </div>
    </div>

    <!-- Basic Info -->
    <NCard title="Basic Information">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Food Name *
          </label>
          <NInput
            v-model:value="form.food_name"
            placeholder="e.g., Homemade Protein Shake"
            size="large"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Brand (optional)
          </label>
          <NInput
            v-model:value="form.brand"
            placeholder="e.g., Homemade"
          />
        </div>
      </div>
    </NCard>

    <!-- Nutrition Info -->
    <NCard title="Nutrition per 100g">
      <div class="space-y-4">
        <!-- Calories -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="font-medium text-gray-700 dark:text-gray-300">Calories *</label>
            <button
              class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              @click="autoCalculateCalories"
            >
              Calculate from macros ({{ calculatedCalories }})
            </button>
          </div>
          <NInputNumber
            v-model:value="form.calories_per_100g"
            :min="0"
            :max="1000"
            size="large"
            class="w-full"
          >
            <template #suffix>
              <span class="text-gray-500">cal</span>
            </template>
          </NInputNumber>
        </div>

        <!-- Macros -->
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Protein
            </label>
            <NInputNumber
              v-model:value="form.protein_per_100g"
              :min="0"
              :max="100"
              :step="0.1"
            >
              <template #suffix>
                <span class="text-gray-500">g</span>
              </template>
            </NInputNumber>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Carbs
            </label>
            <NInputNumber
              v-model:value="form.carbs_per_100g"
              :min="0"
              :max="100"
              :step="0.1"
            >
              <template #suffix>
                <span class="text-gray-500">g</span>
              </template>
            </NInputNumber>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fat
            </label>
            <NInputNumber
              v-model:value="form.fat_per_100g"
              :min="0"
              :max="100"
              :step="0.1"
            >
              <template #suffix>
                <span class="text-gray-500">g</span>
              </template>
            </NInputNumber>
          </div>
        </div>

        <!-- Optional: Fiber & Sugar -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fiber (optional)
            </label>
            <NInputNumber
              v-model:value="form.fiber_per_100g"
              :min="0"
              :max="100"
              :step="0.1"
            >
              <template #suffix>
                <span class="text-gray-500">g</span>
              </template>
            </NInputNumber>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sugar (optional)
            </label>
            <NInputNumber
              v-model:value="form.sugar_per_100g"
              :min="0"
              :max="100"
              :step="0.1"
            >
              <template #suffix>
                <span class="text-gray-500">g</span>
              </template>
            </NInputNumber>
          </div>
        </div>
      </div>
    </NCard>

    <!-- Serving Info -->
    <NCard title="Default Serving">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Serving Size
          </label>
          <NInputNumber
            v-model:value="form.default_serving_size_g"
            :min="1"
            :max="1000"
            size="large"
            class="w-full"
          >
            <template #suffix>
              <span class="text-gray-500">g</span>
            </template>
          </NInputNumber>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Serving Description (optional)
          </label>
          <NInput
            v-model:value="form.default_serving_description"
            placeholder="e.g., 1 scoop, 1 cup, 1 slice"
          />
        </div>
      </div>
    </NCard>

    <!-- Options -->
    <NCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">Add to Favorites</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Quick access from your food list</p>
        </div>
        <NSwitch v-model:value="form.is_favorite" />
      </div>
    </NCard>

    <!-- Save Button -->
    <NButton
      type="primary"
      size="large"
      block
      :loading="saving"
      :disabled="!isValid"
      @click="handleSave"
    >
      Create Food
    </NButton>
  </div>
</template>
