/**
 * Workout media composable
 * Attach photos/videos to completed workouts
 */

import type { WorkoutMedia } from '~/types/database'

export function useWorkoutMedia() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()
  const storage = useStorage()

  async function getMediaForSession(sessionId: string): Promise<WorkoutMedia[]> {
    if (!$supabase || !auth.user.value) return []

    const { data, error } = await $supabase
      .from('workout_media')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching workout media:', error)
      return []
    }

    return data || []
  }

  async function addMedia(
    sessionId: string,
    file: File,
    caption?: string,
  ): Promise<WorkoutMedia | null> {
    if (!$supabase || !auth.user.value) return null

    const isVideo = file.type.startsWith('video/')
    const mediaType = isVideo ? 'video' : 'image'

    let url: string
    let thumbnailUrl: string | null = null

    if (isVideo) {
      // Upload video directly (no compression)
      const userId = auth.user.value.id
      const path = `${userId}/${Date.now()}.${file.name.split('.').pop()}`
      const uploadedUrl = await storage.uploadFile('workout-photos', path, file, {
        contentType: file.type,
      })
      if (!uploadedUrl) return null
      url = uploadedUrl
    } else {
      const result = await storage.uploadImage('workout-photos', file)
      if (!result) return null
      url = result.url
      thumbnailUrl = result.thumbnailUrl
    }

    const { data, error } = await $supabase
      .from('workout_media')
      .insert({
        user_id: auth.user.value.id,
        session_id: sessionId,
        url,
        thumbnail_url: thumbnailUrl,
        media_type: mediaType,
        caption: caption || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding workout media:', error)
      return null
    }

    return data
  }

  async function deleteMedia(id: string) {
    if (!$supabase) return

    const { error } = await $supabase
      .from('workout_media')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting workout media:', error)
    }
  }

  return {
    getMediaForSession,
    addMedia,
    deleteMedia,
  }
}
