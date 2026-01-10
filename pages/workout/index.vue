<script setup lang="ts">
import { NCard, NButton, NTabs, NTabPane, NEmpty } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

// Get saved workouts from localStorage
const { workouts: savedWorkouts, loadWorkouts } = useWorkoutHistory()

// Load workouts on mount
onMounted(() => {
  loadWorkouts()
})

// Transform saved workouts for display
const workouts = computed(() => {
  return savedWorkouts.value.map(w => ({
    id: w.id,
    name: w.name,
    date: w.date,
    duration: Math.floor(w.duration / 60), // Convert seconds to minutes
    exercises: w.exercises.length,
    volume: w.volume,
    rating: w.rating || 0,
  }))
})

const templates = ref([
  { id: '1', name: 'Push Day', exercises: 6, lastUsed: '2024-01-09' },
  { id: '2', name: 'Pull Day', exercises: 5, lastUsed: '2024-01-08' },
  { id: '3', name: 'Leg Day', exercises: 7, lastUsed: '2024-01-06' },
  { id: '4', name: 'Full Body', exercises: 10, lastUsed: '2024-01-01' },
])

function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

function formatVolume(kg: number) {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k kg`
  }
  return `${kg} kg`
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getRatingStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Workouts</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">View your workout history and templates</p>
      </div>
      <NuxtLink to="/workout/new">
        <NButton type="primary" size="large">
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          New Workout
        </NButton>
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <NTabs type="line" animated>
      <!-- History Tab -->
      <NTabPane name="history" tab="History">
        <div class="space-y-3 mt-4">
          <NuxtLink
            v-for="workout in workouts"
            :key="workout.id"
            :to="`/workout/${workout.id}`"
            class="block"
          >
            <NCard class="hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4">
                <!-- Icon -->
                <div class="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
                  </svg>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                      {{ workout.name }}
                    </h3>
                    <span class="text-yellow-500 text-sm">{{ getRatingStars(workout.rating) }}</span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(workout.date) }} · {{ workout.exercises }} exercises
                  </p>
                </div>

                <!-- Stats -->
                <div class="text-right flex-shrink-0 hidden sm:block">
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ formatDuration(workout.duration) }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatVolume(workout.volume) }}
                  </p>
                </div>

                <!-- Arrow -->
                <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </NCard>
          </NuxtLink>

          <NEmpty v-if="workouts.length === 0" description="No workouts yet">
            <template #extra>
              <NuxtLink to="/workout/new">
                <NButton type="primary">Start Your First Workout</NButton>
              </NuxtLink>
            </template>
          </NEmpty>
        </div>
      </NTabPane>

      <!-- Templates Tab -->
      <NTabPane name="templates" tab="Templates">
        <div class="space-y-3 mt-4">
          <div
            v-for="template in templates"
            :key="template.id"
            class="block"
          >
            <NCard class="hover:shadow-md transition-shadow">
              <div class="flex items-center gap-4">
                <!-- Icon -->
                <div class="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                    {{ template.name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ template.exercises }} exercises · Last used {{ formatDate(template.lastUsed) }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 flex-shrink-0">
                  <NuxtLink :to="`/workout/new?template=${template.id}`">
                    <NButton type="primary" size="small">Use</NButton>
                  </NuxtLink>
                  <NuxtLink :to="`/templates/${template.id}`">
                    <NButton size="small">Edit</NButton>
                  </NuxtLink>
                </div>
              </div>
            </NCard>
          </div>

          <NEmpty v-if="templates.length === 0" description="No templates yet">
            <template #extra>
              <NuxtLink to="/templates/new">
                <NButton type="primary">Create Template</NButton>
              </NuxtLink>
            </template>
          </NEmpty>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>
