/**
 * Supabase Storage composable
 * Handles file uploads with client-side image compression
 */

export function useStorage() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  // Compress image using canvas before upload
  async function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)

        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to compress image'))
          },
          'image/jpeg',
          quality,
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  // Generate a thumbnail
  async function generateThumbnail(file: File): Promise<Blob> {
    return compressImage(file, 300, 0.6)
  }

  async function uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: { contentType?: string },
  ): Promise<string | null> {
    if (!$supabase || !auth.user.value) return null

    const { error } = await $supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType || 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data } = $supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  async function uploadImage(
    bucket: string,
    file: File,
  ): Promise<{ url: string; thumbnailUrl: string } | null> {
    if (!auth.user.value) return null

    const userId = auth.user.value.id
    const timestamp = Date.now()
    const ext = 'jpg'

    // Compress main image
    const compressed = await compressImage(file)
    const mainPath = `${userId}/${timestamp}.${ext}`
    const url = await uploadFile(bucket, mainPath, compressed)
    if (!url) return null

    // Generate and upload thumbnail
    const thumbnail = await generateThumbnail(file)
    const thumbPath = `${userId}/${timestamp}_thumb.${ext}`
    const thumbnailUrl = await uploadFile(bucket, thumbPath, thumbnail)

    return { url, thumbnailUrl: thumbnailUrl || url }
  }

  async function deleteFile(bucket: string, path: string): Promise<boolean> {
    if (!$supabase) return false

    const { error } = await $supabase.storage.from(bucket).remove([path])
    if (error) {
      console.error('Delete error:', error)
      return false
    }
    return true
  }

  return {
    uploadFile,
    uploadImage,
    deleteFile,
    compressImage,
    generateThumbnail,
  }
}
