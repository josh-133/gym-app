<script setup lang="ts">
import { NButton, NCard, NSelect, NEmpty } from 'naive-ui'
import { parseImport, type ImportFormat } from '~/utils/importParsers'

definePageMeta({ middleware: ['auth'] })

const { addWorkout } = useWorkoutHistory()
const notification = useNotification()
const router = useRouter()

const format = ref<ImportFormat>('strong')
const fileContent = ref<string | null>(null)
const fileName = ref<string | null>(null)
const importing = ref(false)
const preview = ref<any[] | null>(null)

const formatOptions = [
  { label: 'Strong App', value: 'strong' },
  { label: 'Hevy', value: 'hevy' },
  { label: 'FitNotes', value: 'fitnotes' },
]

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  fileName.value = file.name

  const reader = new FileReader()
  reader.onload = (e) => {
    fileContent.value = e.target?.result as string
    // Parse preview
    if (fileContent.value) {
      const parsed = parseImport(fileContent.value, format.value)
      preview.value = parsed
    }
  }
  reader.readAsText(file)
}

// Re-parse when format changes
watch(format, () => {
  if (fileContent.value) {
    preview.value = parseImport(fileContent.value, format.value)
  }
})

async function handleImport() {
  if (!preview.value || preview.value.length === 0) return

  importing.value = true
  let imported = 0

  try {
    for (const workout of preview.value) {
      const volume = workout.exercises.reduce((sum: number, ex: any) =>
        sum + ex.sets.reduce((setSum: number, s: any) =>
          setSum + ((s.weight || 0) * (s.reps || 0)), 0), 0)

      await addWorkout({
        id: crypto.randomUUID(),
        name: workout.name,
        date: workout.date,
        duration: 0, // Not available from CSV
        exercises: workout.exercises.map((ex: any) => ({
          name: ex.name,
          category: 'strength' as const,
          sets: ex.sets.map((s: any) => ({
            weight: s.weight,
            reps: s.reps,
            completed: true,
            set_type: 'working' as const,
            rpe: s.rpe,
          })),
        })),
        volume,
        rating: null,
        notes: workout.notes,
      })
      imported++
    }

    notification.success(`Imported ${imported} workouts!`)
    router.push('/workout')
  } catch (err) {
    console.error('Import error:', err)
    notification.error(`Imported ${imported} workouts before error`)
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
    <div class="flex items-center gap-4">
      <NuxtLink to="/profile?tab=settings">
        <NButton quaternary circle>
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </template>
        </NButton>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Import Data</h1>
    </div>

    <NCard>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import Format</label>
          <NSelect v-model:value="format" :options="formatOptions" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CSV File</label>
          <input type="file" accept=".csv,.txt" class="w-full" @change="handleFileSelect" />
          <p v-if="fileName" class="text-xs text-gray-500 mt-1">Selected: {{ fileName }}</p>
        </div>

        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
          <p class="font-medium mb-2">How to export from {{ formatOptions.find(f => f.value === format)?.label }}:</p>
          <ul v-if="format === 'strong'" class="list-disc ml-4 space-y-1">
            <li>Open Strong app &rarr; Settings &rarr; Export Data</li>
            <li>Choose CSV format and save the file</li>
            <li>Upload the CSV file above</li>
          </ul>
          <ul v-else-if="format === 'hevy'" class="list-disc ml-4 space-y-1">
            <li>Open Hevy app &rarr; Settings &rarr; Export Workouts</li>
            <li>Save the CSV file</li>
            <li>Upload the CSV file above</li>
          </ul>
          <ul v-else class="list-disc ml-4 space-y-1">
            <li>Open FitNotes app &rarr; Settings &rarr; Backup/Restore</li>
            <li>Export as CSV</li>
            <li>Upload the CSV file above</li>
          </ul>
        </div>
      </div>
    </NCard>

    <!-- Preview -->
    <NCard v-if="preview && preview.length > 0" title="Preview">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Found <strong>{{ preview.length }}</strong> workouts to import
      </p>

      <div class="space-y-2 max-h-60 overflow-y-auto">
        <div
          v-for="(workout, i) in preview.slice(0, 10)"
          :key="i"
          class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800"
        >
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ workout.name }}</p>
            <p class="text-xs text-gray-500">
              {{ new Date(workout.date).toLocaleDateString() }} · {{ workout.exercises.length }} exercises
            </p>
          </div>
        </div>
        <p v-if="preview.length > 10" class="text-xs text-gray-400 text-center">
          +{{ preview.length - 10 }} more
        </p>
      </div>

      <div class="mt-4">
        <NButton type="primary" block :loading="importing" @click="handleImport">
          Import {{ preview.length }} Workouts
        </NButton>
      </div>
    </NCard>

    <NCard v-else-if="fileContent && (!preview || preview.length === 0)">
      <NEmpty description="No workouts found in this file. Check the format is correct." />
    </NCard>
  </div>
</template>
