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

const achievements = ref<Achievement[]>([
  { id: '1', name: 'First Workout', description: 'Complete your first workout', icon: '🏆', category: 'milestone', unlocked: true, progress: 100, unlockedAt: '2024-01-01' },
  { id: '2', name: 'Week Warrior', description: 'Complete 5 workouts in a week', icon: '🔥', category: 'consistency', unlocked: true, progress: 100, unlockedAt: '2024-01-07' },
  { id: '3', name: 'First PR', description: 'Set your first personal record', icon: '⭐', category: 'strength', unlocked: true, progress: 100, unlockedAt: '2024-01-05' },
  { id: '4', name: 'Streak Starter', description: 'Maintain a 7-day workout streak', icon: '⚡', category: 'consistency', unlocked: true, progress: 100, unlockedAt: '2024-01-08' },
  { id: '5', name: 'Monthly Master', description: 'Complete 20 workouts in a month', icon: '📅', category: 'consistency', unlocked: false, progress: 80 },
  { id: '6', name: 'Streak Master', description: 'Maintain a 30-day workout streak', icon: '🔥', category: 'consistency', unlocked: false, progress: 40 },
  { id: '7', name: 'Century Club', description: 'Complete 100 workouts', icon: '🎖️', category: 'milestone', unlocked: false, progress: 65 },
  { id: '8', name: 'PR Hunter', description: 'Set 10 personal records', icon: '🎯', category: 'strength', unlocked: false, progress: 60 },
  { id: '9', name: '100kg Bench', description: 'Bench press 100kg', icon: '💪', category: 'strength', unlocked: true, progress: 100, unlockedAt: '2024-01-08' },
  { id: '10', name: 'Volume Rookie', description: 'Lift 10,000kg total volume', icon: '📈', category: 'endurance', unlocked: true, progress: 100, unlockedAt: '2024-01-03' },
  { id: '11', name: 'Volume Pro', description: 'Lift 100,000kg total volume', icon: '📈', category: 'endurance', unlocked: false, progress: 45 },
  { id: '12', name: 'Exercise Explorer', description: 'Try 20 different exercises', icon: '🧭', category: 'milestone', unlocked: false, progress: 75 },
])

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
  </div>
</template>
