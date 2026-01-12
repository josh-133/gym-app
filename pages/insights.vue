<script setup lang="ts">
import { NCard, NButton, NTag, NEmpty, NSpin } from 'naive-ui'
import UpgradeModal from '~/components/subscription/UpgradeModal.vue'

definePageMeta({
  middleware: ['auth'],
})

const { session } = useAuth()
const { isPremium } = useSubscription()
const { workouts, loadWorkouts } = useWorkoutHistory()

const showUpgradeModal = ref(false)

interface Insight {
  id: string
  type: 'recommendation' | 'analysis' | 'warning' | 'celebration'
  title: string
  content: string
  createdAt: string
  isRead: boolean
}

const insights = ref<Insight[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const hasGenerated = ref(false)

// Load workouts on mount
onMounted(() => {
  loadWorkouts()
  // Load cached insights from localStorage
  loadCachedInsights()
})

function loadCachedInsights() {
  if (import.meta.client) {
    const cached = localStorage.getItem('gym-app-insights')
    if (cached) {
      try {
        const data = JSON.parse(cached)
        // Check if insights are less than 24 hours old
        if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          insights.value = data.insights
          hasGenerated.value = true
        }
      } catch (e) {
        console.error('Failed to load cached insights:', e)
      }
    }
  }
}

function saveCachedInsights() {
  if (import.meta.client) {
    localStorage.setItem('gym-app-insights', JSON.stringify({
      insights: insights.value,
      timestamp: Date.now(),
    }))
  }
}

async function generateInsights() {
  if (!isPremium.value) {
    showUpgradeModal.value = true
    return
  }

  if (workouts.value.length === 0) {
    error.value = 'Complete some workouts first to get AI insights!'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await $fetch('/api/ai/insights', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.value?.access_token}`,
      },
      body: {
        workouts: workouts.value,
      },
    })

    insights.value = response.insights
    hasGenerated.value = true
    saveCachedInsights()
  } catch (e) {
    console.error('Failed to generate insights:', e)
    error.value = 'Failed to generate insights. Please check your API key configuration.'
  } finally {
    isLoading.value = false
  }
}

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
  if (insight) {
    insight.isRead = true
    saveCachedInsights()
  }
}

function markAllAsRead() {
  insights.value.forEach(i => i.isRead = true)
  saveCachedInsights()
}

function dismissInsight(id: string) {
  insights.value = insights.value.filter(i => i.id !== id)
  saveCachedInsights()
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Personalized recommendations powered by Claude AI
        </p>
      </div>
      <div class="flex gap-2">
        <NButton
          v-if="unreadCount > 0"
          quaternary
          @click="markAllAsRead"
        >
          Mark all as read
        </NButton>
        <NButton
          type="primary"
          :loading="isLoading"
          @click="generateInsights"
        >
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </template>
          {{ hasGenerated ? 'Refresh Insights' : 'Generate Insights' }}
        </NButton>
      </div>
    </div>

    <!-- Error State -->
    <NCard v-if="error" class="!bg-red-50 dark:!bg-red-900/20 border-red-200 dark:border-red-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <span class="text-xl">⚠️</span>
        </div>
        <div>
          <p class="font-medium text-red-900 dark:text-red-100">
            Unable to generate insights
          </p>
          <p class="text-sm text-red-700 dark:text-red-300">
            {{ error }}
          </p>
        </div>
      </div>
    </NCard>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-12 text-center">
      <NSpin size="large" />
      <p class="text-gray-500 dark:text-gray-400 mt-4">Analyzing your workout data...</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">This may take a few seconds</p>
    </div>

    <!-- Unread Badge -->
    <NCard v-else-if="unreadCount > 0" class="!bg-indigo-50 dark:!bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <span class="text-xl">✨</span>
        </div>
        <div>
          <p class="font-medium text-indigo-900 dark:text-indigo-100">
            You have {{ unreadCount }} new insight{{ unreadCount > 1 ? 's' : '' }}
          </p>
          <p class="text-sm text-indigo-700 dark:text-indigo-300">
            Check out what Claude AI has discovered about your training
          </p>
        </div>
      </div>
    </NCard>

    <!-- Insights List -->
    <div v-if="!isLoading && insights.length > 0" class="space-y-4">
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
    <NEmpty v-if="!isLoading && insights.length === 0 && !error" description="No insights yet">
      <template #extra>
        <div class="text-center max-w-md">
          <p class="text-gray-500 dark:text-gray-400 mb-4">
            {{ workouts.length === 0
              ? 'Complete some workouts first, then generate AI-powered insights and recommendations.'
              : 'Click "Generate Insights" to get personalized recommendations based on your workout history.'
            }}
          </p>
          <NButton
            v-if="workouts.length > 0"
            type="primary"
            :loading="isLoading"
            @click="generateInsights"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </template>
            Generate Insights
          </NButton>
          <NuxtLink
            v-else
            to="/workout/new"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 dark:bg-white text-white dark:text-primary-900 rounded-xl font-medium hover:opacity-90 transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Start a Workout
          </NuxtLink>
        </div>
      </template>
    </NEmpty>

    <!-- Info Card -->
    <NCard v-if="!isLoading && insights.length > 0" class="!bg-gray-50 dark:!bg-gray-800/50">
      <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          Insights are generated by Claude AI based on your workout history.
          Click "Refresh Insights" for updated recommendations based on your latest workouts.
        </p>
      </div>
    </NCard>

    <!-- Upgrade Modal -->
    <UpgradeModal v-model:show="showUpgradeModal" />
  </div>
</template>
