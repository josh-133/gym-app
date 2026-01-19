<script setup lang="ts">
import { NCard, NProgress, NTag } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const { achievements, loading, fetchAchievements, unlockedAchievements, lockedAchievements, totalPoints } = useAchievements()

// Fetch achievements on mount
onMounted(() => {
  fetchAchievements()
})

// Icon mapping for achievement icons (stored as text in DB)
const iconMap: Record<string, string> = {
  trophy: '🏆',
  fire: '🔥',
  calendar: '📅',
  zap: '⚡',
  flame: '🔥',
  award: '🏅',
  medal: '🎖️',
  star: '⭐',
  target: '🎯',
  dumbbell: '🏋️',
  crown: '👑',
  'trending-up': '📈',
  activity: '🏃',
  'map-pin': '📍',
  compass: '🧭',
  user: '👤',
}

function getIcon(iconName: string) {
  return iconMap[iconName] || '🏆'
}

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

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <!-- No Data State (only if not loading and no achievements in database) -->
    <div v-else-if="achievements.length === 0" class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
        <span class="text-3xl">🏆</span>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Achievements Available</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Achievements will appear here once they're set up.</p>
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
        <p class="text-sm text-gray-500 dark:text-gray-400">Available</p>
      </NCard>
      <NCard class="text-center">
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{{ totalPoints }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Points</p>
      </NCard>
    </div>

    <!-- Unlocked Achievements -->
    <div v-if="unlockedAchievements.length > 0">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Unlocked</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NCard v-for="achievement in unlockedAchievements" :key="achievement.id" class="relative overflow-hidden">
          <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-bl-full"></div>
          <div class="flex items-start gap-4">
            <div class="text-4xl">{{ getIcon(achievement.icon) }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ achievement.name }}</h3>
                <NTag :type="getCategoryColor(achievement.category)" size="small">
                  {{ achievement.category }}
                </NTag>
                <NTag type="warning" size="small">{{ achievement.points }} pts</NTag>
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

    <!-- Available Achievements -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {{ unlockedAchievements.length > 0 ? 'Available to Unlock' : 'All Achievements' }}
      </h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NCard v-for="achievement in lockedAchievements" :key="achievement.id" class="opacity-80 hover:opacity-100 transition-opacity">
          <div class="flex items-start gap-4">
            <div class="text-4xl grayscale">{{ getIcon(achievement.icon) }}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ achievement.name }}</h3>
                <NTag :type="getCategoryColor(achievement.category)" size="small">
                  {{ achievement.category }}
                </NTag>
                <NTag size="small">{{ achievement.points }} pts</NTag>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ achievement.description }}</p>
              <div v-if="achievement.progress > 0" class="mt-3">
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
