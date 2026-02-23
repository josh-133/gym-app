<script setup lang="ts">
import { NButton, NCard, NEmpty, NTag, NModal, NInput, NSelect, NSwitch } from 'naive-ui'
import type { ProgramWeek, ProgramWorkout } from '~/types/database'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const programId = route.params.id as string
const notification = useNotification()

const { programs, activeProgram, fetchPrograms, fetchActiveProgram, getProgramWeeks, addWeek, getWeekWorkouts, addWorkoutToWeek, startProgram, stopProgram } = usePrograms()
const { templates, loadTemplates } = useTemplates()

const loading = ref(true)
const weeks = ref<(ProgramWeek & { workouts: ProgramWorkout[] })[]>([])

const program = computed(() => programs.value.find(p => p.id === programId))
const isActive = computed(() => activeProgram.value?.program_id === programId)
const currentWeekNumber = computed(() => activeProgram.value?.current_week || 0)
const currentWorkoutIndex = computed(() => activeProgram.value?.current_workout_index || 0)

// Add week modal
const showAddWeek = ref(false)
const weekForm = ref({ name: '', isDeload: false })

// Add workout to week modal
const showAddWorkout = ref(false)
const activeWeekId = ref<string | null>(null)
const workoutForm = ref({ templateId: null as string | null, dayOfWeek: 1 })

const dayOptions = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
]

const templateOptions = computed(() =>
  templates.value.map(t => ({ label: t.name, value: t.id }))
)

function getDayName(dayOfWeek: number): string {
  return dayOptions.find(d => d.value === dayOfWeek)?.label || `Day ${dayOfWeek}`
}

function getTemplateName(templateId: string | null): string {
  if (!templateId) return 'Rest Day'
  return templates.value.find(t => t.id === templateId)?.name || 'Unknown Template'
}

async function loadWeeks() {
  const rawWeeks = await getProgramWeeks(programId)
  const result: (ProgramWeek & { workouts: ProgramWorkout[] })[] = []

  for (const week of rawWeeks) {
    const workouts = await getWeekWorkouts(week.id)
    result.push({ ...week, workouts })
  }

  weeks.value = result
}

async function handleAddWeek() {
  const weekNumber = weeks.value.length + 1
  const week = await addWeek(programId, weekNumber, {
    name: weekForm.value.name || undefined,
    isDeload: weekForm.value.isDeload,
  })

  if (week) {
    weeks.value.push({ ...week, workouts: [] })
    showAddWeek.value = false
    weekForm.value = { name: '', isDeload: false }
    notification.success('Week added')
  }
}

function openAddWorkout(weekId: string) {
  activeWeekId.value = weekId
  workoutForm.value = { templateId: null, dayOfWeek: 1 }
  showAddWorkout.value = true
}

async function handleAddWorkout() {
  if (!activeWeekId.value || !workoutForm.value.templateId) return

  const week = weeks.value.find(w => w.id === activeWeekId.value)
  if (!week) return

  const workout = await addWorkoutToWeek(
    activeWeekId.value,
    workoutForm.value.templateId,
    workoutForm.value.dayOfWeek,
    week.workouts.length
  )

  if (workout) {
    week.workouts.push(workout)
    showAddWorkout.value = false
    notification.success('Workout added to week')
  }
}

async function handleStart() {
  await startProgram(programId)
  notification.success('Program started!')
}

async function handleStop() {
  await stopProgram()
  notification.success('Program stopped')
}

onMounted(async () => {
  await Promise.all([fetchPrograms(), fetchActiveProgram(), loadTemplates()])
  await loadWeeks()
  loading.value = false
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
    <!-- Back link -->
    <NuxtLink to="/programs" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
      ← Back to programs
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Not found -->
    <NCard v-else-if="!program" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400 mb-4">Program not found</p>
      <NuxtLink to="/programs">
        <NButton type="primary">Back to Programs</NButton>
      </NuxtLink>
    </NCard>

    <template v-else>
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ program.name }}</h1>
          <p v-if="program.description" class="text-gray-500 dark:text-gray-400 mt-1">{{ program.description }}</p>
          <div class="flex items-center gap-3 mt-2 text-sm text-gray-400">
            <span>{{ program.duration_weeks }} weeks</span>
            <span v-if="program.difficulty" class="capitalize">{{ program.difficulty }}</span>
            <span v-if="program.goal">{{ program.goal }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <NButton v-if="!isActive" type="primary" @click="handleStart">Start Program</NButton>
          <NButton v-else type="error" ghost @click="handleStop">Stop Program</NButton>
        </div>
      </div>

      <!-- Active Progress -->
      <NCard v-if="isActive" class="border-l-4 border-green-500">
        <div class="flex items-center gap-3">
          <NTag type="success" size="small">Active</NTag>
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Week {{ currentWeekNumber }} · Workout {{ currentWorkoutIndex + 1 }}
          </span>
        </div>
        <div class="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-green-500 h-2 rounded-full transition-all"
            :style="{ width: `${Math.min(((currentWeekNumber - 1) / program.duration_weeks) * 100, 100)}%` }"
          ></div>
        </div>
        <p class="text-xs text-gray-400 mt-1">
          {{ Math.round(((currentWeekNumber - 1) / program.duration_weeks) * 100) }}% complete
        </p>
      </NCard>

      <!-- Weeks -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Program Weeks</h2>
          <NButton size="small" @click="showAddWeek = true">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            Add Week
          </NButton>
        </div>

        <NCard
          v-for="week in weeks"
          :key="week.id"
          :class="[
            isActive && week.week_number === currentWeekNumber ? 'ring-2 ring-green-500' : '',
            week.is_deload ? 'border-l-4 border-amber-400' : ''
          ]"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                {{ week.name || `Week ${week.week_number}` }}
              </h3>
              <NTag v-if="week.is_deload" type="warning" size="small">Deload</NTag>
              <NTag v-if="isActive && week.week_number === currentWeekNumber" type="success" size="small">Current</NTag>
            </div>
            <NButton size="small" quaternary @click="openAddWorkout(week.id)">
              <template #icon>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </template>
            </NButton>
          </div>

          <div v-if="week.workouts.length > 0" class="space-y-2">
            <div
              v-for="(workout, wi) in week.workouts"
              :key="workout.id"
              class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              :class="isActive && week.week_number === currentWeekNumber && wi === currentWorkoutIndex ? 'ring-1 ring-green-400' : ''"
            >
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium text-gray-400 w-14">{{ getDayName(workout.day_of_week).slice(0, 3) }}</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ getTemplateName(workout.template_id) }}</span>
              </div>
              <NTag v-if="isActive && week.week_number === currentWeekNumber && wi === currentWorkoutIndex" type="info" size="small">
                Next
              </NTag>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 italic">No workouts added yet</p>
        </NCard>

        <NEmpty v-if="weeks.length === 0" description="No weeks added yet. Add weeks and assign workouts to build your program." />
      </div>
    </template>

    <!-- Add Week Modal -->
    <NModal v-model:show="showAddWeek" preset="card" title="Add Week" :style="{ width: '90%', maxWidth: '400px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Week Name (optional)</label>
          <NInput v-model:value="weekForm.name" :placeholder="`Week ${weeks.length + 1}`" />
        </div>
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Deload Week</label>
          <NSwitch v-model:value="weekForm.isDeload" />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showAddWeek = false">Cancel</NButton>
          <NButton type="primary" class="flex-1" @click="handleAddWeek">Add Week</NButton>
        </div>
      </template>
    </NModal>

    <!-- Add Workout Modal -->
    <NModal v-model:show="showAddWorkout" preset="card" title="Add Workout" :style="{ width: '90%', maxWidth: '400px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template</label>
          <NSelect v-model:value="workoutForm.templateId" :options="templateOptions" placeholder="Select a template" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day</label>
          <NSelect v-model:value="workoutForm.dayOfWeek" :options="dayOptions" />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <NButton class="flex-1" @click="showAddWorkout = false">Cancel</NButton>
          <NButton type="primary" class="flex-1" :disabled="!workoutForm.templateId" @click="handleAddWorkout">Add</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
