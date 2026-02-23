<script setup lang="ts">
import { NButton, NCard, NEmpty, NAvatar, NInput, NModal } from 'naive-ui'

definePageMeta({ middleware: ['auth'] })

const { feed, followers, following, loading, fetchFeed, fetchFollowers, fetchFollowing, toggleLike, addComment, getComments, searchUsers } = useSocial()
const auth = useAuth()
const notification = useNotification()

// Comment modal
const showComments = ref(false)
const activeItemId = ref<string | null>(null)
const comments = ref<any[]>([])
const newComment = ref('')
const loadingComments = ref(false)

// Search
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)

async function openComments(feedItemId: string) {
  activeItemId.value = feedItemId
  showComments.value = true
  loadingComments.value = true
  comments.value = await getComments(feedItemId)
  loadingComments.value = false
}

async function submitComment() {
  if (!activeItemId.value || !newComment.value.trim()) return

  const comment = await addComment(activeItemId.value, newComment.value.trim())
  if (comment) {
    comments.value.push({
      ...comment,
      user: { username: auth.profile.value?.username, display_name: auth.profile.value?.display_name },
    })
    newComment.value = ''
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searching.value = true
  searchResults.value = await searchUsers(searchQuery.value)
  searching.value = false
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

function getItemDescription(item: any): string {
  switch (item.item_type) {
    case 'workout': return 'completed a workout'
    case 'pr': return 'set a new personal record'
    case 'achievement': return 'unlocked an achievement'
    case 'photo': return 'added a progress photo'
    default: return 'did something'
  }
}

onMounted(async () => {
  await Promise.all([fetchFeed(), fetchFollowers(), fetchFollowing()])
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Community</h1>
      <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span><strong class="text-gray-900 dark:text-white">{{ followers.length }}</strong> followers</span>
        <span><strong class="text-gray-900 dark:text-white">{{ following.length }}</strong> following</span>
      </div>
    </div>

    <!-- Search Users -->
    <NCard>
      <div class="flex gap-2">
        <NInput
          v-model:value="searchQuery"
          placeholder="Search users..."
          @keyup.enter="handleSearch"
        />
        <NButton :loading="searching" @click="handleSearch">Search</NButton>
      </div>

      <div v-if="searchResults.length > 0" class="mt-3 space-y-2">
        <div
          v-for="user in searchResults"
          :key="user.id"
          class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div class="flex items-center gap-3">
            <NAvatar round :size="36" :src="user.avatar_url">
              {{ (user.display_name || user.username)?.[0] }}
            </NAvatar>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ user.display_name || user.username }}</p>
              <p class="text-xs text-gray-500">@{{ user.username }}</p>
            </div>
          </div>
          <NuxtLink :to="`/social/profile/${user.id}`">
            <NButton size="small">View</NButton>
          </NuxtLink>
        </div>
      </div>
    </NCard>

    <!-- Feed -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <NEmpty v-else-if="feed.length === 0" description="Follow users to see their activity here" />

    <div v-else class="space-y-4">
      <NCard v-for="item in feed" :key="item.id">
        <div class="flex items-start gap-3">
          <NAvatar round :size="40" :src="item.user?.avatar_url || undefined">
            {{ (item.user?.display_name || item.user?.username)?.[0] }}
          </NAvatar>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ item.user?.display_name || item.user?.username }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ getItemDescription(item) }}
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatTimeAgo(item.created_at) }}</p>

            <!-- Actions -->
            <div class="flex items-center gap-4 mt-3">
              <button
                class="flex items-center gap-1 text-sm transition-colors"
                :class="item.user_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'"
                @click="toggleLike(item.id)"
              >
                <svg class="w-4 h-4" :fill="item.user_liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {{ item.likes_count }}
              </button>
              <button
                class="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 transition-colors"
                @click="openComments(item.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {{ item.comments_count }}
              </button>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <!-- Comments Modal -->
    <NModal v-model:show="showComments" preset="card" title="Comments" :style="{ width: '90%', maxWidth: '450px' }">
      <div class="space-y-3 max-h-60 overflow-y-auto">
        <div v-if="loadingComments" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
        <div v-for="comment in comments" :key="comment.id" class="flex gap-2">
          <NAvatar round :size="28">{{ comment.user?.username?.[0] }}</NAvatar>
          <div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ comment.user?.display_name || comment.user?.username }}</span>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ comment.content }}</p>
          </div>
        </div>
        <p v-if="!loadingComments && comments.length === 0" class="text-sm text-gray-500 text-center py-4">
          No comments yet
        </p>
      </div>
      <div class="flex gap-2 mt-4">
        <NInput v-model:value="newComment" placeholder="Add a comment..." @keyup.enter="submitComment" />
        <NButton type="primary" :disabled="!newComment.trim()" @click="submitComment">Post</NButton>
      </div>
    </NModal>
  </div>
</template>
