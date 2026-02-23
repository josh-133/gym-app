<script setup lang="ts">
import { NButton, NCard, NAvatar, NEmpty, NTag } from 'naive-ui'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const profileId = route.params.id as string
const { $supabase } = useNuxtApp()
const auth = useAuth()
const { follow, unfollow, isFollowing, fetchFollowing } = useSocial()
const notification = useNotification()

const loading = ref(true)
const profile = ref<{ id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null } | null>(null)
const feedItems = ref<any[]>([])
const followerCount = ref(0)
const followingCount = ref(0)

const isOwnProfile = computed(() => auth.user.value?.id === profileId)
const userIsFollowing = computed(() => isFollowing(profileId))

async function loadProfile() {
  if (!$supabase) return

  const { data, error } = await $supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .eq('id', profileId)
    .single()

  if (!error && data) profile.value = data
}

async function loadStats() {
  if (!$supabase) return

  const [{ count: fwrs }, { count: fwng }] = await Promise.all([
    $supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId),
    $supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId),
  ])

  followerCount.value = fwrs || 0
  followingCount.value = fwng || 0
}

async function loadFeed() {
  if (!$supabase) return

  const { data } = await $supabase
    .from('feed_items')
    .select('*')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false })
    .limit(20)

  feedItems.value = data || []
}

async function handleFollow() {
  await follow(profileId)
  followerCount.value++
  notification.success('Followed!')
}

async function handleUnfollow() {
  await unfollow(profileId)
  followerCount.value = Math.max(0, followerCount.value - 1)
  notification.success('Unfollowed')
}

function getItemDescription(item: any): string {
  switch (item.item_type) {
    case 'workout': return 'Completed a workout'
    case 'pr': return 'Set a new personal record'
    case 'achievement': return 'Unlocked an achievement'
    case 'photo': return 'Added a progress photo'
    default: return 'Activity'
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

onMounted(async () => {
  await fetchFollowing()
  await Promise.all([loadProfile(), loadStats(), loadFeed()])
  loading.value = false
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
    <NuxtLink to="/social" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
      ← Back to community
    </NuxtLink>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <NCard v-else-if="!profile" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400 mb-4">User not found</p>
      <NuxtLink to="/social">
        <NButton type="primary">Back to Community</NButton>
      </NuxtLink>
    </NCard>

    <template v-else>
      <!-- Profile Header -->
      <NCard>
        <div class="flex items-center gap-4">
          <NAvatar round :size="72" :src="profile.avatar_url || undefined">
            {{ (profile.display_name || profile.username)?.[0]?.toUpperCase() }}
          </NAvatar>
          <div class="flex-1">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ profile.display_name || profile.username }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">@{{ profile.username }}</p>
            <p v-if="profile.bio" class="text-sm text-gray-600 dark:text-gray-300 mt-1">{{ profile.bio }}</p>
          </div>
          <div v-if="!isOwnProfile">
            <NButton
              v-if="userIsFollowing"
              size="small"
              ghost
              @click="handleUnfollow"
            >
              Following
            </NButton>
            <NButton
              v-else
              type="primary"
              size="small"
              @click="handleFollow"
            >
              Follow
            </NButton>
          </div>
        </div>

        <div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ followerCount }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Followers</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ followingCount }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Following</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ feedItems.length }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Activities</p>
          </div>
        </div>
      </NCard>

      <!-- Activity Feed -->
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>

      <NEmpty v-if="feedItems.length === 0" description="No activity yet" />

      <div v-else class="space-y-3">
        <NCard v-for="item in feedItems" :key="item.id">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <NTag :type="item.item_type === 'pr' ? 'warning' : item.item_type === 'achievement' ? 'success' : 'info'" size="small">
                {{ item.item_type }}
              </NTag>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ getItemDescription(item) }}</span>
            </div>
            <span class="text-xs text-gray-400">{{ formatTimeAgo(item.created_at) }}</span>
          </div>
        </NCard>
      </div>
    </template>
  </div>
</template>
