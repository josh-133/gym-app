<script setup lang="ts">
import { NButton, NCard, NInput, NInputNumber, NSelect, NSwitch, NDatePicker } from 'naive-ui'

definePageMeta({ middleware: ['auth'] })

const router = useRouter()
const notification = useNotification()
const { createChallenge } = useChallenges()

const creating = ref(false)
const form = ref({
  name: '',
  description: '',
  challenge_type: null as string | null,
  target_value: 100,
  unit: '',
  start_date: Date.now(),
  end_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
  is_public: true,
})

const typeOptions = [
  { label: 'Total Volume (kg)', value: 'volume' },
  { label: 'Workout Frequency', value: 'frequency' },
  { label: 'Workout Streak (days)', value: 'streak' },
  { label: 'Total Distance (km)', value: 'distance' },
]

const unitSuggestions: Record<string, string> = {
  volume: 'kg',
  frequency: 'workouts',
  streak: 'days',
  distance: 'km',
}

watch(() => form.value.challenge_type, (type) => {
  if (type && unitSuggestions[type]) {
    form.value.unit = unitSuggestions[type]
  }
})

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0]
}

async function handleCreate() {
  if (!form.value.name.trim() || !form.value.challenge_type || !form.value.unit) return
  creating.value = true

  try {
    const challenge = await createChallenge({
      name: form.value.name.trim(),
      description: form.value.description || undefined,
      challenge_type: form.value.challenge_type as any,
      target_value: form.value.target_value,
      unit: form.value.unit,
      start_date: formatDate(form.value.start_date),
      end_date: formatDate(form.value.end_date),
      is_public: form.value.is_public,
    })

    if (challenge) {
      notification.success('Challenge created!')
      router.push(`/challenges/${challenge.id}`)
    }
  } finally {
    creating.value = false
  }
}

const canSubmit = computed(() =>
  form.value.name.trim() &&
  form.value.challenge_type &&
  form.value.unit &&
  form.value.target_value > 0 &&
  form.value.end_date > form.value.start_date
)
</script>

<template>
  <div class="max-w-lg mx-auto space-y-6 animate-fade-in">
    <NuxtLink to="/challenges" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
      ← Back to challenges
    </NuxtLink>

    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Create Challenge</h1>

    <NCard>
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Challenge Name</label>
          <NInput v-model:value="form.name" placeholder="e.g., 100K Volume Challenge" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (optional)</label>
          <NInput v-model:value="form.description" type="textarea" :rows="2" placeholder="What's this challenge about?" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Challenge Type</label>
          <NSelect v-model:value="form.challenge_type" :options="typeOptions" placeholder="Select type" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target</label>
            <NInputNumber v-model:value="form.target_value" :min="1" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit</label>
            <NInput v-model:value="form.unit" placeholder="e.g., kg, workouts" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <NDatePicker v-model:value="form.start_date" type="date" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <NDatePicker v-model:value="form.end_date" type="date" class="w-full" />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Public Challenge</label>
            <p class="text-xs text-gray-400">Anyone can find and join this challenge</p>
          </div>
          <NSwitch v-model:value="form.is_public" />
        </div>
      </div>
    </NCard>

    <div class="flex gap-3">
      <NuxtLink to="/challenges" class="flex-1">
        <NButton block>Cancel</NButton>
      </NuxtLink>
      <NButton
        type="primary"
        class="flex-1"
        :loading="creating"
        :disabled="!canSubmit"
        @click="handleCreate"
      >
        Create Challenge
      </NButton>
    </div>
  </div>
</template>
