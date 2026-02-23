<script setup lang="ts">
import { NButton, NCard, NModal, NSelect, NInput, NDatePicker, NEmpty } from 'naive-ui'

definePageMeta({ middleware: ['auth'] })

const { photos, loading, fetchPhotos, addPhoto, deletePhoto, photosByMonth, getByCategory } = useProgressPhotos()
const notification = useNotification()

const showUploadModal = ref(false)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)
const photoCategory = ref<'front' | 'side' | 'back'>('front')
const photoNotes = ref('')
const photoDate = ref<number>(Date.now())

const categoryOptions = [
  { label: 'Front', value: 'front' },
  { label: 'Side', value: 'side' },
  { label: 'Back', value: 'back' },
]

// Compare mode
const showCompare = ref(false)
const compareCategory = ref<'front' | 'side' | 'back'>('front')

const comparePhotos = computed(() => {
  const filtered = getByCategory(compareCategory.value)
  if (filtered.length < 2) return null
  return {
    before: filtered[filtered.length - 1],
    after: filtered[0],
  }
})

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    selectedFile.value = input.files[0]
  }
}

async function handleUpload() {
  if (!selectedFile.value) return

  uploading.value = true
  try {
    const result = await addPhoto(
      selectedFile.value,
      photoCategory.value,
      photoNotes.value || undefined,
      new Date(photoDate.value).toISOString(),
    )

    if (result) {
      notification.success('Photo added!')
      showUploadModal.value = false
      selectedFile.value = null
      photoNotes.value = ''
    } else {
      notification.error('Failed to upload photo')
    }
  } finally {
    uploading.value = false
  }
}

async function handleDelete(id: string) {
  if (confirm('Delete this photo?')) {
    await deletePhoto(id)
    notification.success('Photo deleted')
  }
}

onMounted(() => fetchPhotos())
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Progress Photos</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Track your body transformation over time</p>
      </div>
      <div class="flex gap-2">
        <NButton @click="showCompare = !showCompare">
          {{ showCompare ? 'Timeline' : 'Compare' }}
        </NButton>
        <NButton type="primary" @click="showUploadModal = true">
          Add Photo
        </NButton>
      </div>
    </div>

    <!-- Compare Mode -->
    <template v-if="showCompare">
      <NCard>
        <div class="flex justify-center gap-4 mb-4">
          <NButton
            v-for="cat in categoryOptions"
            :key="cat.value"
            :type="compareCategory === cat.value ? 'primary' : 'default'"
            size="small"
            @click="compareCategory = cat.value as 'front' | 'side' | 'back'"
          >
            {{ cat.label }}
          </NButton>
        </div>

        <div v-if="comparePhotos" class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Before</p>
            <img :src="comparePhotos.before.photo_url" class="rounded-lg w-full aspect-[3/4] object-cover" />
            <p class="text-xs text-gray-400 mt-1">
              {{ new Date(comparePhotos.before.taken_at).toLocaleDateString() }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">After</p>
            <img :src="comparePhotos.after.photo_url" class="rounded-lg w-full aspect-[3/4] object-cover" />
            <p class="text-xs text-gray-400 mt-1">
              {{ new Date(comparePhotos.after.taken_at).toLocaleDateString() }}
            </p>
          </div>
        </div>
        <NEmpty v-else description="Need at least 2 photos in this category to compare" />
      </NCard>
    </template>

    <!-- Timeline Mode -->
    <template v-else>
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <NEmpty v-else-if="photos.length === 0" description="No progress photos yet. Add your first one!" />

      <div v-else v-for="(monthPhotos, month) in photosByMonth" :key="month" class="space-y-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}
        </h2>
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="photo in monthPhotos"
            :key="photo.id"
            class="relative group rounded-lg overflow-hidden"
          >
            <img
              :src="photo.thumbnail_url || photo.photo_url"
              :alt="photo.category"
              class="w-full aspect-[3/4] object-cover"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
              <span class="text-xs text-white capitalize bg-black/50 px-2 py-0.5 rounded">{{ photo.category }}</span>
              <button class="text-red-400 hover:text-red-300" @click="handleDelete(photo.id)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Upload Modal -->
    <NModal v-model:show="showUploadModal" preset="card" title="Add Progress Photo" :style="{ width: '90%', maxWidth: '400px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</label>
          <input type="file" accept="image/*" class="w-full" @change="handleFileSelect" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
          <NSelect v-model:value="photoCategory" :options="categoryOptions" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
          <NDatePicker v-model:value="photoDate" type="date" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (optional)</label>
          <NInput v-model:value="photoNotes" type="textarea" :rows="2" placeholder="Any notes..." />
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showUploadModal = false">Cancel</NButton>
          <NButton type="primary" class="flex-1" :loading="uploading" :disabled="!selectedFile" @click="handleUpload">
            Upload
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
