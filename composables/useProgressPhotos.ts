/**
 * Progress photos composable
 * CRUD for body transformation timeline photos
 */

import type { ProgressPhoto } from '~/types/database'

export function useProgressPhotos() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()
  const storage = useStorage()
  const photos = useState<ProgressPhoto[]>('progressPhotos', () => [])
  const loading = ref(false)

  async function fetchPhotos() {
    if (!$supabase || !auth.user.value) return

    loading.value = true
    try {
      const { data, error } = await $supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', auth.user.value.id)
        .order('taken_at', { ascending: false })

      if (error) {
        console.error('Error fetching progress photos:', error)
        return
      }

      photos.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function addPhoto(
    file: File,
    category: 'front' | 'side' | 'back' = 'front',
    notes?: string,
    takenAt?: string,
  ): Promise<ProgressPhoto | null> {
    if (!$supabase || !auth.user.value) return null

    const result = await storage.uploadImage('progress-photos', file)
    if (!result) return null

    const { data, error } = await $supabase
      .from('progress_photos')
      .insert({
        user_id: auth.user.value.id,
        photo_url: result.url,
        thumbnail_url: result.thumbnailUrl,
        category,
        notes: notes || null,
        taken_at: takenAt || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding progress photo:', error)
      return null
    }

    photos.value.unshift(data)
    return data
  }

  async function deletePhoto(id: string) {
    if (!$supabase) return

    const { error } = await $supabase
      .from('progress_photos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting progress photo:', error)
      return
    }

    photos.value = photos.value.filter(p => p.id !== id)
  }

  // Group photos by month
  const photosByMonth = computed(() => {
    const grouped: Record<string, ProgressPhoto[]> = {}
    photos.value.forEach(photo => {
      const date = new Date(photo.taken_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(photo)
    })
    return grouped
  })

  // Get photos by category
  function getByCategory(category: 'front' | 'side' | 'back') {
    return photos.value.filter(p => p.category === category)
  }

  return {
    photos: readonly(photos),
    loading: readonly(loading),
    fetchPhotos,
    addPhoto,
    deletePhoto,
    photosByMonth,
    getByCategory,
  }
}
