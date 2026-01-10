<script setup lang="ts">
import { NCard, NButton, NTag, NEmpty } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

interface Insight {
  id: string
  type: 'recommendation' | 'analysis' | 'warning' | 'celebration'
  title: string
  content: string
  createdAt: string
  isRead: boolean
}

const insights = ref<Insight[]>([
  {
    id: '1',
    type: 'celebration',
    title: 'New PR on Bench Press!',
    content: 'Congratulations! You just hit 100kg on bench press. That\'s a 5kg improvement from your previous best. Keep up the great work!',
    createdAt: '2024-01-09T10:00:00Z',
    isRead: false,
  },
  {
    id: '2',
    type: 'recommendation',
    title: 'Consider a Deload Week',
    content: 'You\'ve been training consistently for 6 weeks. Your volume has been high and progress is starting to plateau. A deload week could help you recover and come back stronger.',
    createdAt: '2024-01-08T14:00:00Z',
    isRead: false,
  },
  {
    id: '3',
    type: 'analysis',
    title: 'Push/Pull Imbalance Detected',
    content: 'Your pushing volume is 40% higher than your pulling volume this month. Consider adding more back exercises to maintain muscle balance and prevent shoulder issues.',
    createdAt: '2024-01-07T09:00:00Z',
    isRead: true,
  },
  {
    id: '4',
    type: 'warning',
    title: 'Recovery Time Needed',
    content: 'You trained legs yesterday and they\'re scheduled again today. Consider resting this muscle group for at least 48 hours between sessions for optimal recovery.',
    createdAt: '2024-01-06T08:00:00Z',
    isRead: true,
  },
  {
    id: '5',
    type: 'recommendation',
    title: 'Try Progressive Overload',
    content: 'You\'ve been using the same weight for Squats for 3 weeks. Try adding 2.5kg this week to continue making progress.',
    createdAt: '2024-01-05T11:00:00Z',
    isRead: true,
  },
])

const unreadCount = computed(() => insights.value.filter(i => !i.isRead).length)

function getTypeIcon(type: Insight['type']) {
  switch (type) {
    case 'celebration': return '🎉'
    case 'recommendation': return '💡'
    case 'analysis': return '📊'
    case 'warning': return '⚠️'
  }
}

function getTypeColor(type: Insight['type']) {
  switch (type) {
    case 'celebration': return 'success'
    case 'recommendation': return 'info'
    case 'analysis': return 'default'
    case 'warning': return 'warning'
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function markAsRead(id: string) {
  const insight = insights.value.find(i => i.id === id)
  if (insight) insight.isRead = true
}

function markAllAsRead() {
  insights.value.forEach(i => i.isRead = true)
}

function dismissInsight(id: string) {
  insights.value = insights.value.filter(i => i.id !== id)
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Personalized recommendations powered by AI
        </p>
      </div>
      <NButton v-if="unreadCount > 0" @click="markAllAsRead">
        Mark all as read
      </NButton>
    </div>

    <!-- Unread Badge -->
    <NCard v-if="unreadCount > 0" class="!bg-indigo-50 dark:!bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <span class="text-xl">✨</span>
        </div>
        <div>
          <p class="font-medium text-indigo-900 dark:text-indigo-100">
            You have {{ unreadCount }} new insight{{ unreadCount > 1 ? 's' : '' }}
          </p>
          <p class="text-sm text-indigo-700 dark:text-indigo-300">
            Check out what the AI has discovered about your training
          </p>
        </div>
      </div>
    </NCard>

    <!-- Insights List -->
    <div class="space-y-4">
      <NCard
        v-for="insight in insights"
        :key="insight.id"
        :class="{ 'border-l-4 border-l-indigo-500': !insight.isRead }"
      >
        <div class="flex gap-4">
          <!-- Icon -->
          <div class="text-3xl flex-shrink-0">
            {{ getTypeIcon(insight.type) }}
          </div>

          <!-- Content -->
          <div class="flex-1">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    {{ insight.title }}
                  </h3>
                  <NTag :type="getTypeColor(insight.type)" size="small">
                    {{ insight.type }}
                  </NTag>
                  <span v-if="!insight.isRead" class="w-2 h-2 bg-indigo-500 rounded-full"></span>
                </div>
                <p class="text-gray-600 dark:text-gray-300">
                  {{ insight.content }}
                </p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {{ formatDate(insight.createdAt) }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 flex-shrink-0">
                <button
                  v-if="!insight.isRead"
                  class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title="Mark as read"
                  @click="markAsRead(insight.id)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Dismiss"
                  @click="dismissInsight(insight.id)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- Empty State -->
    <NEmpty v-if="insights.length === 0" description="No insights yet">
      <template #extra>
        <p class="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Complete more workouts and the AI will start providing personalized insights and recommendations.
        </p>
      </template>
    </NEmpty>
  </div>
</template>
