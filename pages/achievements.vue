<script setup lang="ts">
import { NCard, NProgress, NTag } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  unlocked: boolean
  progress: number
  unlockedAt?: string
}

// Achievements (empty by default, will be populated from real data)
const achievements = ref<Achievement[]>([])

const unlockedAchievements = computed(() => achievements.value.filter(a => a.unlocked))
const lockedAchievements = computed(() => achievements.value.filter(a => !a.unlocked))
const totalPoints = computed(() => unlockedAchievements.value.length * 25)

function getCategoryColor(category: string) {
  switch (category) {
    case 'consistency': return 'warning'
    case 'strength': return 'error'
    case 'endurance': return 'success'
    case 'milestone': return 'info'
    default: return 'default'
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Achievements</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Track your fitness milestones</p>
    </div>

    <!-- No Data State -->
    <div v-if="achievements.length === 0" class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
        <span class="text-3xl">🏆</span>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Achievements Yet</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Complete workouts and reach milestones to unlock achievements!</p>
      <NuxtLink to="/workout/new" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-white text-white dark:text-primary-900 rounded-xl font-medium hover:opacity-90 transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Start a Workout
      </NuxtLink>
    </div>

    <template v-else>
    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4">
      <NCard class="text-center">
        <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ unlockedAchievements.length }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Unlocked</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-gray-400">{{ lockedAchievements.length }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Locked</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{{ totalPoints }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Points</p>
      </NCard>
    </div>

    <!-- Unlocked Achievements -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Unlocked</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NCard v-for="achievement in unlockedAchievements" :key="achievement.id" class="relative overflow-hidden">
          <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-bl-full"></div>
          <div class="flex items-start gap-4">
            <div class="text-4xl">{{ achievement.icon }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ achievement.name }}</h3>
                <NTag :type="getCategoryColor(achievement.category)" size="small">
                  {{ achievement.category }}
                </NTag>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ achievement.description }}</p>
              <p class="text-xs text-green-600 dark:text-green-400 mt-2">
                Unlocked {{ formatDate(achievement.unlockedAt) }}
              </p>
            </div>
          </div>
        </NCard>
      </div>
    </div>

    <!-- Locked Achievements -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">In Progress</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NCard v-for="achievement in lockedAchievements" :key="achievement.id" class="opacity-75">
          <div class="flex items-start gap-4">
            <div class="text-4xl grayscale">{{ achievement.icon }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ achievement.name }}</h3>
                <NTag :type="getCategoryColor(achievement.category)" size="small">
                  {{ achievement.category }}
                </NTag>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ achievement.description }}</p>
              <div class="mt-3">
                <div class="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{{ achievement.progress }}%</span>
                </div>
                <NProgress
                  type="line"
                  :percentage="achievement.progress"
                  :height="8"
                  :border-radius="4"
                  :show-indicator="false"
                />
              </div>
            </div>
          </div>
        </NCard>
      </div>
    </div>
    </template>
  </div>
</template>
