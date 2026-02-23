<script setup lang="ts">
import { NButton, NCard, NEmpty, NTag, NProgress } from 'naive-ui'

definePageMeta({ middleware: ['auth'] })

const { challenges, activeChallenges, loading, fetchChallenges, joinChallenge, leaveChallenge } = useChallenges()
const auth = useAuth()
const notification = useNotification()

const filter = ref<'all' | 'active' | 'mine'>('all')

const filteredChallenges = computed(() => {
  const today = new Date().toISOString().split('T')[0]

  switch (filter.value) {
    case 'active':
      return challenges.value.filter(c => c.end_date >= today && c.start_date <= today)
    case 'mine':
      return challenges.value.filter(c => c.creator_id === auth.user.value?.id)
    default:
      return challenges.value
  }
})

function getDaysLeft(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function isExpired(endDate: string): boolean {
  return new Date(endDate).getTime() < Date.now()
}

function getProgressPercent(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100))
}

async function handleJoin(challengeId: string) {
  await joinChallenge(challengeId)
  await fetchChallenges()
  notification.success('Joined challenge!')
}

async function handleLeave(challengeId: string) {
  await leaveChallenge(challengeId)
  notification.success('Left challenge')
}

onMounted(() => {
  fetchChallenges()
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Challenges</h1>
      <NuxtLink to="/challenges/create">
        <NButton type="primary">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          New Challenge
        </NButton>
      </NuxtLink>
    </div>

    <!-- Active Challenges Summary -->
    <NCard v-if="activeChallenges.length > 0" class="border-l-4 border-primary-500">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Your Active Challenges</h3>
      <div class="space-y-3">
        <div v-for="c in activeChallenges" :key="c.id" class="flex items-center justify-between">
          <NuxtLink :to="`/challenges/${c.id}`" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            {{ c.name }}
          </NuxtLink>
          <div class="flex items-center gap-2">
            <NProgress
              type="line"
              :percentage="getProgressPercent(c.user_participant?.current_value || 0, c.target_value)"
              :show-indicator="false"
              class="w-24"
            />
            <span class="text-xs text-gray-500">
              {{ c.user_participant?.current_value || 0 }}/{{ c.target_value }} {{ c.unit }}
            </span>
          </div>
        </div>
      </div>
    </NCard>

    <!-- Filter tabs -->
    <div class="flex gap-2">
      <NButton
        v-for="f in [{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'mine', label: 'My Challenges' }]"
        :key="f.key"
        size="small"
        :type="filter === f.key ? 'primary' : 'default'"
        :ghost="filter !== f.key"
        @click="filter = f.key as any"
      >
        {{ f.label }}
      </NButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Challenges List -->
    <div v-else-if="filteredChallenges.length > 0" class="space-y-3">
      <NCard v-for="challenge in filteredChallenges" :key="challenge.id" class="hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <NuxtLink :to="`/challenges/${challenge.id}`" class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ challenge.name }}</h3>
              <NTag v-if="isExpired(challenge.end_date)" type="default" size="small">Ended</NTag>
              <NTag v-else type="success" size="small">{{ getDaysLeft(challenge.end_date) }}d left</NTag>
            </div>
            <p v-if="challenge.description" class="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {{ challenge.description }}
            </p>
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="capitalize">{{ challenge.challenge_type }}</span>
              <span>Target: {{ challenge.target_value }} {{ challenge.unit }}</span>
              <span>{{ challenge.participants_count }} participant{{ challenge.participants_count !== 1 ? 's' : '' }}</span>
            </div>
          </NuxtLink>

          <div class="ml-4">
            <NButton
              v-if="challenge.user_participant"
              size="small"
              ghost
              @click="handleLeave(challenge.id)"
            >
              Leave
            </NButton>
            <NButton
              v-else-if="!isExpired(challenge.end_date)"
              size="small"
              type="primary"
              @click="handleJoin(challenge.id)"
            >
              Join
            </NButton>
          </div>
        </div>

        <!-- User progress if joined -->
        <div v-if="challenge.user_participant" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between text-sm mb-1">
            <span class="text-gray-500">Your progress</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ challenge.user_participant.current_value }}/{{ challenge.target_value }} {{ challenge.unit }}
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="getProgressPercent(challenge.user_participant.current_value, challenge.target_value)"
            :show-indicator="false"
          />
        </div>
      </NCard>
    </div>

    <NEmpty v-else description="No challenges found. Create one to get started!" />
  </div>
</template>
