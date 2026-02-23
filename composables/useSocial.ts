/**
 * Social features composable
 * Follow/unfollow, activity feed, likes, comments
 */

import type { Follow, FeedItem, Like, Comment } from '~/types/database'

interface FeedItemWithDetails extends FeedItem {
  user?: { username: string; display_name: string | null; avatar_url: string | null }
  likes_count: number
  comments_count: number
  user_liked: boolean
}

export function useSocial() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  const feed = useState<FeedItemWithDetails[]>('socialFeed', () => [])
  const followers = useState<Follow[]>('followers', () => [])
  const following = useState<Follow[]>('following', () => [])
  const loading = ref(false)

  // Follow / Unfollow
  async function follow(userId: string) {
    if (!$supabase || !auth.user.value) return

    const { error } = await $supabase
      .from('follows')
      .insert({
        follower_id: auth.user.value.id,
        following_id: userId,
      })

    if (!error) {
      await fetchFollowing()
    }
  }

  async function unfollow(userId: string) {
    if (!$supabase || !auth.user.value) return

    const { error } = await $supabase
      .from('follows')
      .delete()
      .eq('follower_id', auth.user.value.id)
      .eq('following_id', userId)

    if (!error) {
      following.value = following.value.filter(f => f.following_id !== userId)
    }
  }

  function isFollowing(userId: string): boolean {
    return following.value.some(f => f.following_id === userId)
  }

  async function fetchFollowers() {
    if (!$supabase || !auth.user.value) return

    const { data } = await $supabase
      .from('follows')
      .select('*')
      .eq('following_id', auth.user.value.id)

    if (data) followers.value = data
  }

  async function fetchFollowing() {
    if (!$supabase || !auth.user.value) return

    const { data } = await $supabase
      .from('follows')
      .select('*')
      .eq('follower_id', auth.user.value.id)

    if (data) following.value = data
  }

  // Feed
  async function fetchFeed(limit: number = 20) {
    if (!$supabase || !auth.user.value) return
    loading.value = true

    try {
      const { data, error } = await $supabase
        .from('feed_items')
        .select(`
          *,
          profiles:user_id ( username, display_name, avatar_url ),
          likes ( id ),
          comments ( id )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error || !data) return

      feed.value = data.map((item: any) => ({
        ...item,
        user: item.profiles,
        likes_count: item.likes?.length || 0,
        comments_count: item.comments?.length || 0,
        user_liked: item.likes?.some((l: any) => l.user_id === auth.user.value?.id) || false,
      }))
    } finally {
      loading.value = false
    }
  }

  // Create feed item (called after workout completion, PR, etc.)
  async function createFeedItem(itemType: 'workout' | 'pr' | 'achievement' | 'photo', referenceId: string) {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('feed_items')
      .insert({
        user_id: auth.user.value.id,
        item_type: itemType,
        reference_id: referenceId,
      })
  }

  // Like / Unlike
  async function toggleLike(feedItemId: string) {
    if (!$supabase || !auth.user.value) return

    const item = feed.value.find(f => f.id === feedItemId)
    if (!item) return

    if (item.user_liked) {
      await $supabase
        .from('likes')
        .delete()
        .eq('user_id', auth.user.value.id)
        .eq('feed_item_id', feedItemId)

      item.user_liked = false
      item.likes_count--
    } else {
      await $supabase
        .from('likes')
        .insert({
          user_id: auth.user.value.id,
          feed_item_id: feedItemId,
        })

      item.user_liked = true
      item.likes_count++
    }
  }

  // Comments
  async function addComment(feedItemId: string, content: string): Promise<Comment | null> {
    if (!$supabase || !auth.user.value) return null

    const { data, error } = await $supabase
      .from('comments')
      .insert({
        user_id: auth.user.value.id,
        feed_item_id: feedItemId,
        content,
      })
      .select()
      .single()

    if (error) return null

    const item = feed.value.find(f => f.id === feedItemId)
    if (item) item.comments_count++

    return data
  }

  async function getComments(feedItemId: string): Promise<(Comment & { user?: { username: string; display_name: string | null } })[]> {
    if (!$supabase) return []

    const { data } = await $supabase
      .from('comments')
      .select('*, profiles:user_id ( username, display_name )')
      .eq('feed_item_id', feedItemId)
      .order('created_at', { ascending: true })

    return (data || []).map((c: any) => ({ ...c, user: c.profiles }))
  }

  // Search users
  async function searchUsers(query: string): Promise<{ id: string; username: string; display_name: string | null; avatar_url: string | null }[]> {
    if (!$supabase || !query) return []

    const { data } = await $supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('id', auth.user.value?.id || '')
      .limit(20)

    return data || []
  }

  return {
    feed: readonly(feed),
    followers: readonly(followers),
    following: readonly(following),
    loading: readonly(loading),
    follow,
    unfollow,
    isFollowing,
    fetchFollowers,
    fetchFollowing,
    fetchFeed,
    createFeedItem,
    toggleLike,
    addComment,
    getComments,
    searchUsers,
  }
}
