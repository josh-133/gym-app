<script setup lang="ts">
import { NButton, NCard, NEmpty, NTag, NModal, NInput, NInputNumber, NSelect } from 'naive-ui'

definePageMeta({ middleware: ['auth'] })

const { programs, activeProgram, loading, fetchPrograms, fetchActiveProgram, createProgram, deleteProgram, startProgram, stopProgram } = usePrograms()
const notification = useNotification()
const router = useRouter()

// Create modal
const showCreateModal = ref(false)
const creating = ref(false)
const form = ref({
  name: '',
  description: '',
  duration_weeks: 4,
  difficulty: null as string | null,
  goal: '',
})

const difficultyOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

async function handleCreate() {
  if (!form.value.name.trim()) return
  creating.value = true

  try {
    const program = await createProgram({
      name: form.value.name.trim(),
      description: form.value.description || undefined,
      duration_weeks: form.value.duration_weeks,
      difficulty: form.value.difficulty || undefined,
      goal: form.value.goal || undefined,
    })

    if (program) {
      notification.success('Program created!')
      showCreateModal.value = false
      form.value = { name: '', description: '', duration_weeks: 4, difficulty: null, goal: '' }
      router.push(`/programs/${program.id}`)
    }
  } finally {
    creating.value = false
  }
}

async function handleDelete(id: string) {
  if (confirm('Delete this program?')) {
    await deleteProgram(id)
    notification.success('Program deleted')
  }
}

async function handleStart(id: string) {
  await startProgram(id)
  notification.success('Program started!')
}

async function handleStop() {
  await stopProgram()
  notification.success('Program stopped')
}

onMounted(async () => {
  await fetchPrograms()
  await fetchActiveProgram()
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Training Programs</h1>
      <NButton type="primary" @click="showCreateModal = true">
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </template>
        New Program
      </NButton>
    </div>

    <!-- Active Program Banner -->
    <NCard v-if="activeProgram" class="border-l-4 border-primary-500">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <NTag type="success" size="small">Active</NTag>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ programs.find(p => p.id === activeProgram.program_id)?.name || 'Program' }}
            </h3>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Week {{ activeProgram.current_week }} · Workout {{ activeProgram.current_workout_index + 1 }}
          </p>
        </div>
        <div class="flex gap-2">
          <NuxtLink :to="`/programs/${activeProgram.program_id}`">
            <NButton size="small">View</NButton>
          </NuxtLink>
          <NButton size="small" type="error" ghost @click="handleStop">Stop</NButton>
        </div>
      </div>
    </NCard>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Programs List -->
    <div v-else-if="programs.length > 0" class="space-y-3">
      <NCard v-for="program in programs" :key="program.id" class="hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <NuxtLink :to="`/programs/${program.id}`" class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ program.name }}</h3>
            <p v-if="program.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ program.description }}
            </p>
            <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{{ program.duration_weeks }} weeks</span>
              <span v-if="program.difficulty" class="capitalize">{{ program.difficulty }}</span>
              <span v-if="program.goal">{{ program.goal }}</span>
            </div>
          </NuxtLink>
          <div class="flex gap-1 ml-4">
            <NButton
              v-if="!activeProgram || activeProgram.program_id !== program.id"
              size="small"
              type="primary"
              ghost
              @click="handleStart(program.id)"
            >
              Start
            </NButton>
            <NButton size="small" quaternary @click="handleDelete(program.id)">
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </template>
            </NButton>
          </div>
        </div>
      </NCard>
    </div>

    <NEmpty v-else description="No programs yet. Create one to get started!" />

    <!-- Create Modal -->
    <NModal v-model:show="showCreateModal" preset="card" title="New Training Program" :style="{ width: '90%', maxWidth: '450px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Program Name</label>
          <NInput v-model:value="form.name" placeholder="e.g., PPL Hypertrophy" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (optional)</label>
          <NInput v-model:value="form.description" type="textarea" :rows="2" placeholder="Brief description..." />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (weeks)</label>
            <NInputNumber v-model:value="form.duration_weeks" :min="1" :max="52" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
            <NSelect v-model:value="form.difficulty" :options="difficultyOptions" placeholder="Select" clearable />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal (optional)</label>
          <NInput v-model:value="form.goal" placeholder="e.g., Build muscle, lose fat" />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showCreateModal = false">Cancel</NButton>
          <NButton type="primary" class="flex-1" :loading="creating" :disabled="!form.name.trim()" @click="handleCreate">
            Create
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
