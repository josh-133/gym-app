<script setup lang="ts">
import { NButton, NCard, NTag, NProgress, NAvatar, NEmpty } from 'naive-ui'
import type { ChallengeParticipant } from '~/types/database'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const challengeId = route.params.id as string
const auth = useAuth()
const notification = useNotification()

const { challenges, fetchChallenges, joinChallenge, leaveChallenge, getLeaderboard } = useChallenges()

const loading = ref(true)
const leaderboard = ref<(ChallengeParticipant & { user?: { username: string; display_name: string | null } })[]>([])

const challenge = computed(() => challenges.value.find(c => c.id === challengeId))
const isJoined = computed(() => !!challenge.value?.user_participant)
const isExpired = computed(() => challenge.value ? new Date(challenge.value.end_date).getTime() < Date.now() : false)
const isCreator = computed(() => challenge.value?.creator_id === auth.user.value?.id)

const daysLeft = computed(() => {
  if (!challenge.value) return 0
  const diff = new Date(challenge.value.end_date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const daysTotal = computed(() => {
  if (!challenge.value) return 1
  const diff = new Date(challenge.value.end_date).getTime() - new Date(challenge.value.start_date).getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

function getProgressPercent(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100))
}

function getRankSuffix(rank: number): string {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

async function handleJoin() {
  await joinChallenge(challengeId)
  await Promise.all([fetchChallenges(), loadLeaderboard()])
  notification.success('Joined challenge!')
}

async function handleLeave() {
  await leaveChallenge(challengeId)
  await loadLeaderboard()
  notification.success('Left challenge')
}

async function loadLeaderboard() {
  leaderboard.value = await getLeaderboard(challengeId)
}

onMounted(async () => {
  await fetchChallenges()
  await loadLeaderboard()
  loading.value = false
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
    <NuxtLink to="/challenges" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
      ← Back to challenges
    </NuxtLink>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <NCard v-else-if="!challenge" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400 mb-4">Challenge not found</p>
      <NuxtLink to="/challenges">
        <NButton type="primary">Back to Challenges</NButton>
      </NuxtLink>
    </NCard>

    <template v-else>
      <!-- Challenge Header -->
      <NCard>
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ challenge.name }}</h1>
              <NTag v-if="isExpired" type="default" size="small">Ended</NTag>
              <NTag v-else type="success" size="small">Active</NTag>
            </div>
            <p v-if="challenge.description" class="text-gray-500 dark:text-gray-400">
              {{ challenge.description }}
            </p>
          </div>
          <div v-if="!isExpired">
            <NButton v-if="isJoined" ghost @click="handleLeave">Leave</NButton>
            <NButton v-else type="primary" @click="handleJoin">Join Challenge</NButton>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ challenge.target_value }}</p>
            <p class="text-xs text-gray-500">{{ challenge.unit }} goal</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ challenge.participants_count }}</p>
            <p class="text-xs text-gray-500">participants</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold" :class="isExpired ? 'text-gray-400' : 'text-green-500'">
              {{ isExpired ? 'Ended' : `${daysLeft}d` }}
            </p>
            <p class="text-xs text-gray-500">{{ isExpired ? '' : 'remaining' }}</p>
          </div>
        </div>

        <!-- Time progress -->
        <div v-if="!isExpired" class="mt-4">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>{{ new Date(challenge.start_date).toLocaleDateString() }}</span>
            <span>{{ new Date(challenge.end_date).toLocaleDateString() }}</span>
          </div>
          <NProgress
            type="line"
            :percentage="Math.round(((daysTotal - daysLeft) / daysTotal) * 100)"
            :show-indicator="false"
            rail-color="var(--n-fill-color)"
          />
        </div>

        <!-- Your Progress -->
        <div v-if="isJoined && challenge.user_participant" class="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">Your Progress</span>
            <span class="text-sm font-bold text-indigo-700 dark:text-indigo-300">
              {{ challenge.user_participant.current_value }}/{{ challenge.target_value }} {{ challenge.unit }}
            </span>
          </div>
          <NProgress
            type="line"
            :percentage="getProgressPercent(challenge.user_participant.current_value, challenge.target_value)"
            :indicator-text-color="'white'"
          />
          <p v-if="challenge.user_participant.completed_at" class="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
            Challenge completed!
          </p>
        </div>
      </NCard>

      <!-- Leaderboard -->
      <NCard title="Leaderboard">
        <NEmpty v-if="leaderboard.length === 0" description="No participants yet" />

        <div v-else class="space-y-2">
          <div
            v-for="(entry, idx) in leaderboard"
            :key="entry.id"
            class="flex items-center gap-3 p-3 rounded-lg"
            :class="[
              idx === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
              idx === 1 ? 'bg-gray-100 dark:bg-gray-800' :
              idx === 2 ? 'bg-orange-50 dark:bg-orange-900/10' :
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              entry.user_id === auth.user.value?.id ? 'ring-1 ring-indigo-400' : ''
            ]"
          >
            <!-- Rank -->
            <div class="w-8 text-center">
              <span
                class="text-lg font-bold"
                :class="idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-gray-500'"
              >
                {{ idx + 1 }}
              </span>
            </div>

            <!-- User -->
            <NAvatar round :size="32">
              {{ (entry.user?.display_name || entry.user?.username)?.[0]?.toUpperCase() || '?' }}
            </NAvatar>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white text-sm">
                {{ entry.user?.display_name || entry.user?.username || 'Unknown' }}
                <NTag v-if="entry.user_id === auth.user.value?.id" size="small" type="info" class="ml-1">You</NTag>
              </p>
              <NProgress
                type="line"
                :percentage="getProgressPercent(entry.current_value, challenge.target_value)"
                :show-indicator="false"
                class="mt-1"
              />
            </div>

            <!-- Value -->
            <div class="text-right">
              <p class="font-bold text-gray-900 dark:text-white">{{ entry.current_value }}</p>
              <p class="text-xs text-gray-400">{{ challenge.unit }}</p>
            </div>

            <!-- Completion badge -->
            <NTag v-if="entry.completed_at" type="success" size="small">Done</NTag>
          </div>
        </div>
      </NCard>

      <!-- Challenge Details -->
      <NCard title="Details">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Type</span>
            <span class="text-gray-900 dark:text-white capitalize">{{ challenge.challenge_type }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Start Date</span>
            <span class="text-gray-900 dark:text-white">{{ new Date(challenge.start_date).toLocaleDateString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">End Date</span>
            <span class="text-gray-900 dark:text-white">{{ new Date(challenge.end_date).toLocaleDateString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Visibility</span>
            <span class="text-gray-900 dark:text-white">{{ challenge.is_public ? 'Public' : 'Private' }}</span>
          </div>
        </div>
      </NCard>
    </template>
  </div>
</template>
