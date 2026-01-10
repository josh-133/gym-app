<script setup lang="ts">
import { NCard, NButton, NTag, NEmpty, NTabs, NTabPane } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const exerciseId = route.params.id as string

// Mock exercise data - in real app, fetch from Supabase
const exercise = ref({
  id: exerciseId,
  name: 'Bench Press',
  description: 'The bench press is a compound exercise that primarily targets the chest muscles (pectoralis major), with secondary emphasis on the anterior deltoids and triceps.',
  category: 'strength',
  muscle_groups: ['chest', 'triceps', 'shoulders'],
  equipment: ['barbell', 'bench'],
  difficulty: 'intermediate',
  is_compound: true,
  instructions: [
    'Lie flat on a bench with your feet firmly on the ground',
    'Grip the barbell slightly wider than shoulder-width apart',
    'Unrack the bar and hold it directly above your chest with arms extended',
    'Lower the bar slowly to your mid-chest, keeping elbows at about 45 degrees',
    'Press the bar back up to the starting position',
    'Repeat for desired number of reps',
  ],
})

// Mock history data
const history = ref([
  { date: '2024-01-09', sets: 4, bestWeight: 100, bestReps: 5, volume: 1800 },
  { date: '2024-01-05', sets: 4, bestWeight: 97.5, bestReps: 6, volume: 1755 },
  { date: '2024-01-02', sets: 4, bestWeight: 95, bestReps: 6, volume: 1710 },
  { date: '2023-12-28', sets: 3, bestWeight: 95, bestReps: 5, volume: 1425 },
  { date: '2023-12-24', sets: 4, bestWeight: 92.5, bestReps: 6, volume: 1665 },
])

// Mock PR
const personalRecord = ref({
  weight: 100,
  reps: 5,
  date: '2024-01-09',
})

const loading = ref(false)
const notFound = ref(false)

// Simulate fetching exercise
onMounted(async () => {
  loading.value = true
  // In real app: fetch from Supabase
  await new Promise(resolve => setTimeout(resolve, 300))
  loading.value = false

  // Check if exercise exists (mock check)
  if (!exerciseId || exerciseId === 'undefined') {
    notFound.value = true
  }
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'success'
    case 'intermediate': return 'warning'
    case 'advanced': return 'error'
    default: return 'default'
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <!-- Not Found State -->
    <NCard v-else-if="notFound" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Exercise Not Found</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4">The exercise you're looking for doesn't exist or has been removed.</p>
      <NuxtLink to="/exercises">
        <NButton type="primary">Browse Exercises</NButton>
      </NuxtLink>
    </NCard>

    <!-- Exercise Content -->
    <template v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <NuxtLink to="/exercises" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block">
            ← Back to exercises
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ exercise.name }}</h1>
          <div class="flex flex-wrap gap-2 mt-2">
            <NTag :type="getDifficultyColor(exercise.difficulty)">{{ exercise.difficulty }}</NTag>
            <NTag>{{ exercise.category }}</NTag>
            <NTag v-if="exercise.is_compound" type="info">Compound</NTag>
          </div>
        </div>
        <NuxtLink to="/workout/new">
          <NButton type="primary">
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            Add to Workout
          </NButton>
        </NuxtLink>
      </div>

      <!-- PR Card -->
      <NCard class="!bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
            <svg class="w-7 h-7 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-yellow-700 dark:text-yellow-300">Personal Record</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ personalRecord.weight }}kg × {{ personalRecord.reps }} reps
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Set on {{ formatDate(personalRecord.date) }}</p>
          </div>
        </div>
      </NCard>

      <!-- Tabs -->
      <NTabs type="line" animated>
        <!-- Overview Tab -->
        <NTabPane name="overview" tab="Overview">
          <div class="grid lg:grid-cols-2 gap-6 mt-4">
            <!-- Description -->
            <NCard title="About">
              <p class="text-gray-600 dark:text-gray-300">{{ exercise.description }}</p>

              <div class="mt-4 space-y-3">
                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Target Muscles</p>
                  <div class="flex flex-wrap gap-2 mt-1">
                    <span
                      v-for="muscle in exercise.muscle_groups"
                      :key="muscle"
                      class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm capitalize"
                    >
                      {{ muscle.replace('_', ' ') }}
                    </span>
                  </div>
                </div>

                <div>
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Equipment</p>
                  <div class="flex flex-wrap gap-2 mt-1">
                    <span
                      v-for="eq in exercise.equipment"
                      :key="eq"
                      class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm capitalize"
                    >
                      {{ eq.replace('_', ' ') }}
                    </span>
                  </div>
                </div>
              </div>
            </NCard>

            <!-- Instructions -->
            <NCard title="How to Perform">
              <ol class="space-y-3">
                <li
                  v-for="(instruction, index) in exercise.instructions"
                  :key="index"
                  class="flex gap-3"
                >
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center justify-center">
                    {{ index + 1 }}
                  </span>
                  <span class="text-gray-600 dark:text-gray-300">{{ instruction }}</span>
                </li>
              </ol>
            </NCard>
          </div>
        </NTabPane>

        <!-- History Tab -->
        <NTabPane name="history" tab="History">
          <div class="space-y-3 mt-4">
            <NCard v-for="session in history" :key="session.date">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(session.date) }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ session.sets }} sets</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ session.bestWeight }}kg × {{ session.bestReps }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ session.volume }}kg volume
                  </p>
                </div>
              </div>
            </NCard>

            <NEmpty v-if="history.length === 0" description="No history yet for this exercise" />
          </div>
        </NTabPane>
      </NTabs>
    </template>
  </div>
</template>
