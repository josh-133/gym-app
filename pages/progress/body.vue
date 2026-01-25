<script setup lang="ts">
import { NCard, NButton, NSelect, NModal, NInputNumber, NDatePicker, NTag } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const { measurements, loading, fetchMeasurements, addMeasurement, latestMeasurement, weightHistory, measurementsHistory } = useBodyMeasurements()
const notification = useNotification()

// Fetch measurements on mount
onMounted(() => {
  fetchMeasurements()
})

// Time range filter
const timeRange = ref('3months')
const timeRangeOptions = [
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'Last 6 Months', value: '6months' },
  { label: 'Last Year', value: '1year' },
  { label: 'All Time', value: 'all' },
]

// Add measurement modal
const showAddModal = ref(false)
const saving = ref(false)
const measurementType = ref('weight')
const newMeasurement = ref({
  date: Date.now(),
  weight: null as number | null,
  bodyFat: null as number | null,
  chest: null as number | null,
  waist: null as number | null,
  hips: null as number | null,
  leftArm: null as number | null,
  rightArm: null as number | null,
  leftThigh: null as number | null,
  rightThigh: null as number | null,
})

function resetForm() {
  newMeasurement.value = {
    date: Date.now(),
    weight: null,
    bodyFat: null,
    chest: null,
    waist: null,
    hips: null,
    leftArm: null,
    rightArm: null,
    leftThigh: null,
    rightThigh: null,
  }
}

// Current stats from latest measurement
const currentStats = computed(() => {
  const latest = latestMeasurement.value
  return {
    weight: latest?.weight_kg || 0,
    bodyFat: latest?.body_fat_percent || 0,
    chest: latest?.chest_cm || 0,
    waist: latest?.waist_cm || 0,
    hips: latest?.hips_cm || 0,
    leftArm: latest?.bicep_cm || 0,
    rightArm: latest?.bicep_cm || 0,
    leftThigh: latest?.thigh_cm || 0,
    rightThigh: latest?.thigh_cm || 0,
  }
})

const progressPhotos = ref<{ id: string; date: string; url: string | null; type: string }[]>([])

// Goals (default values)
const goals = ref({
  targetWeight: 0,
  targetBodyFat: 0,
})

// Computed
const weightChange = computed(() => {
  if (weightHistory.value.length < 2) return 0
  const first = weightHistory.value[0].weight
  const last = weightHistory.value[weightHistory.value.length - 1].weight
  return +(last - first).toFixed(1)
})

const bodyFatChange = computed(() => {
  if (weightHistory.value.length < 2) return 0
  const first = weightHistory.value[0].bodyFat
  const last = weightHistory.value[weightHistory.value.length - 1].bodyFat
  return +(last - first).toFixed(1)
})

// Calculate measurement changes from history
const measurementChanges = computed(() => {
  if (measurementsHistory.value.length < 2) {
    return { chest: null, waist: null, hips: null, arms: null }
  }
  const first = measurementsHistory.value[0]
  const last = measurementsHistory.value[measurementsHistory.value.length - 1]
  return {
    chest: first.chest && last.chest ? +(last.chest - first.chest).toFixed(1) : null,
    waist: first.waist && last.waist ? +(last.waist - first.waist).toFixed(1) : null,
    hips: first.hips && last.hips ? +(last.hips - first.hips).toFixed(1) : null,
    arms: first.arms && last.arms ? +(last.arms - first.arms).toFixed(1) : null,
  }
})

const progressToGoalWeight = computed(() => {
  const start = weightHistory.value[0]?.weight || currentStats.value.weight
  const current = currentStats.value.weight
  const target = goals.value.targetWeight
  const totalLoss = start - target
  const currentLoss = start - current
  return totalLoss > 0 ? Math.min(100, Math.round((currentLoss / totalLoss) * 100)) : 0
})

const maxWeight = computed(() => weightHistory.value.length > 0 ? Math.max(...weightHistory.value.map(h => h.weight)) + 2 : 100)
const minWeight = computed(() => weightHistory.value.length > 0 ? Math.min(...weightHistory.value.map(h => h.weight)) - 2 : 60)
const hasData = computed(() => measurements.value.length > 0)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getWeightPosition(weight: number) {
  return 100 - ((weight - minWeight.value) / (maxWeight.value - minWeight.value)) * 100
}

function openAddModal(type: string) {
  measurementType.value = type
  resetForm()
  showAddModal.value = true
}

async function saveMeasurement() {
  saving.value = true
  try {
    await addMeasurement({
      measured_at: new Date(newMeasurement.value.date).toISOString(),
      weight_kg: newMeasurement.value.weight,
      body_fat_percent: newMeasurement.value.bodyFat,
      chest_cm: newMeasurement.value.chest,
      waist_cm: newMeasurement.value.waist,
      hips_cm: newMeasurement.value.hips,
      bicep_cm: newMeasurement.value.leftArm || newMeasurement.value.rightArm,
      thigh_cm: newMeasurement.value.leftThigh || newMeasurement.value.rightThigh,
    })
    showAddModal.value = false
    resetForm()
    notification.success('Measurement saved!')
  } catch (err) {
    console.error('Error saving measurement:', err)
    notification.error('Failed to save measurement. Please try again.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <NuxtLink to="/progress" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block">
          ← Back to Progress
        </NuxtLink>
        <h1 class="text-2xl font-bold gradient-text">Body Stats</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Track your body composition and measurements</p>
      </div>
      <div class="flex gap-2">
        <NSelect
          v-model:value="timeRange"
          :options="timeRangeOptions"
          style="width: 140px"
        />
        <NButton type="primary" @click="openAddModal('all')">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Add Entry
        </NButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasData" class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Body Stats Yet</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Track your weight, body fat, and measurements to monitor your progress!</p>
      <NButton type="primary" @click="openAddModal('all')">
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </template>
        Add Your First Entry
      </NButton>
    </div>

    <template v-else-if="hasData">
    <!-- Current Stats Overview -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <NCard class="!bg-gradient-to-br from-primary-500 to-accent-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-sm">Current Weight</p>
          <p class="text-3xl font-bold mt-1">{{ currentStats.weight }}kg</p>
          <p class="text-sm mt-2" :class="weightChange < 0 ? 'text-green-200' : 'text-red-200'">
            {{ weightChange > 0 ? '+' : '' }}{{ weightChange }}kg
          </p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-secondary-500 to-success-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-sm">Body Fat</p>
          <p class="text-3xl font-bold mt-1">{{ currentStats.bodyFat }}%</p>
          <p class="text-sm mt-2" :class="bodyFatChange < 0 ? 'text-green-200' : 'text-red-200'">
            {{ bodyFatChange > 0 ? '+' : '' }}{{ bodyFatChange }}%
          </p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-energy-500 to-warning-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-sm">Muscle Mass</p>
          <p class="text-3xl font-bold mt-1">{{ currentStats.bodyFat > 0 ? (currentStats.weight * (1 - currentStats.bodyFat / 100)).toFixed(1) : '—' }}kg</p>
          <p class="text-sm mt-2 text-white/60">estimated</p>
        </div>
      </NCard>
      <NCard class="!bg-gradient-to-br from-accent-500 to-primary-500 shadow-xl">
        <div class="text-white text-center">
          <p class="text-white/80 text-sm">BMI</p>
          <p class="text-3xl font-bold mt-1">{{ (currentStats.weight / (1.78 * 1.78)).toFixed(1) }}</p>
          <p class="text-sm mt-2 text-white/60">Normal range</p>
        </div>
      </NCard>
    </div>

    <!-- Weight & Body Fat Chart -->
    <NCard title="Weight & Body Fat Trend">
      <div class="relative">
        <!-- Legend -->
        <div class="flex gap-4 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-primary-500"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Weight (kg)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-accent-500"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Body Fat (%)</span>
          </div>
        </div>

        <!-- Chart -->
        <div class="relative h-64">
          <!-- Y-axis -->
          <div class="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{{ maxWeight.toFixed(0) }}</span>
            <span>{{ ((maxWeight + minWeight) / 2).toFixed(0) }}</span>
            <span>{{ minWeight.toFixed(0) }}</span>
          </div>

          <!-- Chart area -->
          <div class="ml-12 h-full relative">
            <!-- Grid -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div class="border-b border-gray-100 dark:border-gray-800"></div>
              <div class="border-b border-gray-100 dark:border-gray-800"></div>
              <div class="border-b border-gray-200 dark:border-gray-700"></div>
            </div>

            <!-- Weight Line -->
            <svg class="absolute inset-0 w-full h-full overflow-visible">
              <defs>
                <linearGradient id="weightFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color: rgb(168, 85, 247); stop-opacity: 0.2" />
                  <stop offset="100%" style="stop-color: rgb(168, 85, 247); stop-opacity: 0" />
                </linearGradient>
              </defs>

              <!-- Area -->
              <path
                :d="`M ${weightHistory.map((h, i) => `${(i / (weightHistory.length - 1)) * 100}%,${getWeightPosition(h.weight)}%`).join(' L ')} L 100%,100% L 0%,100% Z`"
                fill="url(#weightFill)"
              />

              <!-- Line -->
              <polyline
                :points="weightHistory.map((h, i) => `${(i / (weightHistory.length - 1)) * 100}%,${getWeightPosition(h.weight)}%`).join(' ')"
                fill="none"
                stroke="#a855f7"
                stroke-width="3"
                stroke-linecap="round"
              />

              <!-- Points -->
              <g v-for="(h, i) in weightHistory" :key="i">
                <circle
                  :cx="`${(i / (weightHistory.length - 1)) * 100}%`"
                  :cy="`${getWeightPosition(h.weight)}%`"
                  r="5"
                  fill="white"
                  stroke="#a855f7"
                  stroke-width="2"
                />
              </g>
            </svg>
          </div>
        </div>

        <!-- X-axis -->
        <div class="ml-12 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span v-for="h in weightHistory" :key="h.date">{{ formatDate(h.date) }}</span>
        </div>
      </div>

      <!-- Goal Progress -->
      <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium text-gray-900 dark:text-white">Progress to Goal</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ currentStats.weight }}kg → {{ goals.targetWeight }}kg</span>
        </div>
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-primary-500 to-success-500 transition-all"
            :style="{ width: `${progressToGoalWeight}%` }"
          ></div>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">{{ progressToGoalWeight }}% complete · {{ (currentStats.weight - goals.targetWeight).toFixed(1) }}kg to go</p>
      </div>
    </NCard>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Body Measurements -->
      <NCard title="Body Measurements">
        <div class="space-y-4">
          <!-- Body silhouette with measurements -->
          <div class="flex items-center justify-center py-4">
            <div class="relative">
              <!-- Simple body outline -->
              <svg width="120" height="200" viewBox="0 0 120 200" class="text-gray-300 dark:text-gray-700">
                <!-- Head -->
                <circle cx="60" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="2" />
                <!-- Neck -->
                <line x1="60" y1="45" x2="60" y2="55" stroke="currentColor" stroke-width="2" />
                <!-- Shoulders -->
                <line x1="25" y1="65" x2="95" y2="65" stroke="currentColor" stroke-width="2" />
                <!-- Arms -->
                <line x1="25" y1="65" x2="15" y2="110" stroke="currentColor" stroke-width="2" />
                <line x1="95" y1="65" x2="105" y2="110" stroke="currentColor" stroke-width="2" />
                <!-- Torso -->
                <path d="M 35 65 L 35 130 L 45 130 L 45 195 M 85 65 L 85 130 L 75 130 L 75 195" fill="none" stroke="currentColor" stroke-width="2" />
                <!-- Connect torso -->
                <line x1="35" y1="95" x2="85" y2="95" stroke="currentColor" stroke-width="2" />
                <line x1="35" y1="130" x2="85" y2="130" stroke="currentColor" stroke-width="2" />
              </svg>

              <!-- Measurement labels -->
              <div class="absolute top-16 -left-8 text-xs">
                <span class="font-bold text-primary-600 dark:text-primary-400">{{ currentStats.chest }}cm</span>
                <span class="text-gray-500 dark:text-gray-400 ml-1">Chest</span>
              </div>
              <div class="absolute top-24 -right-8 text-xs text-right">
                <span class="font-bold text-accent-600 dark:text-accent-400">{{ currentStats.waist }}cm</span>
                <span class="text-gray-500 dark:text-gray-400 ml-1">Waist</span>
              </div>
              <div class="absolute top-32 -left-8 text-xs">
                <span class="font-bold text-secondary-600 dark:text-secondary-400">{{ currentStats.hips }}cm</span>
                <span class="text-gray-500 dark:text-gray-400 ml-1">Hips</span>
              </div>
              <div class="absolute top-20 -right-16 text-xs text-right">
                <span class="font-bold text-success-600 dark:text-success-400">{{ currentStats.rightArm }}cm</span>
                <span class="text-gray-500 dark:text-gray-400 ml-1">Arms</span>
              </div>
              <div class="absolute bottom-4 -left-10 text-xs">
                <span class="font-bold text-energy-600 dark:text-energy-400">{{ currentStats.leftThigh }}cm</span>
                <span class="text-gray-500 dark:text-gray-400 ml-1">Thighs</span>
              </div>
            </div>
          </div>

          <!-- Measurement list -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <p class="text-sm text-gray-500 dark:text-gray-400">Chest</p>
              <p class="text-xl font-bold text-primary-600 dark:text-primary-400">{{ currentStats.chest || '—' }}cm</p>
              <p v-if="measurementChanges.chest !== null" class="text-xs" :class="measurementChanges.chest >= 0 ? 'text-success-600' : 'text-red-500'">
                {{ measurementChanges.chest > 0 ? '+' : '' }}{{ measurementChanges.chest }}cm
              </p>
            </div>
            <div class="p-3 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
              <p class="text-sm text-gray-500 dark:text-gray-400">Waist</p>
              <p class="text-xl font-bold text-accent-600 dark:text-accent-400">{{ currentStats.waist || '—' }}cm</p>
              <p v-if="measurementChanges.waist !== null" class="text-xs" :class="measurementChanges.waist <= 0 ? 'text-success-600' : 'text-red-500'">
                {{ measurementChanges.waist > 0 ? '+' : '' }}{{ measurementChanges.waist }}cm
              </p>
            </div>
            <div class="p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-xl">
              <p class="text-sm text-gray-500 dark:text-gray-400">Hips</p>
              <p class="text-xl font-bold text-secondary-600 dark:text-secondary-400">{{ currentStats.hips || '—' }}cm</p>
              <p v-if="measurementChanges.hips !== null" class="text-xs" :class="measurementChanges.hips <= 0 ? 'text-success-600' : 'text-red-500'">
                {{ measurementChanges.hips > 0 ? '+' : '' }}{{ measurementChanges.hips }}cm
              </p>
            </div>
            <div class="p-3 bg-success-50 dark:bg-success-900/20 rounded-xl">
              <p class="text-sm text-gray-500 dark:text-gray-400">Arms (avg)</p>
              <p class="text-xl font-bold text-success-600 dark:text-success-400">{{ currentStats.leftArm || currentStats.rightArm ? ((currentStats.leftArm + currentStats.rightArm) / 2).toFixed(1) : '—' }}cm</p>
              <p v-if="measurementChanges.arms !== null" class="text-xs" :class="measurementChanges.arms >= 0 ? 'text-success-600' : 'text-red-500'">
                {{ measurementChanges.arms > 0 ? '+' : '' }}{{ measurementChanges.arms }}cm
              </p>
            </div>
          </div>
        </div>
      </NCard>

      <!-- Progress Photos -->
      <NCard title="Progress Photos">
        <div class="space-y-4">
          <!-- Upload button -->
          <div class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-primary-400 dark:hover:border-primary-600 transition-colors cursor-pointer">
            <div class="w-12 h-12 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="font-medium text-gray-900 dark:text-white">Upload Progress Photo</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Take a new photo or upload from gallery</p>
          </div>

          <!-- Photo grid -->
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="photo in progressPhotos"
              :key="photo.id"
              class="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative group"
            >
              <!-- Placeholder for actual images -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <svg class="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">{{ formatDate(photo.date) }}</p>
                </div>
              </div>
              <!-- Date badge -->
              <div class="absolute bottom-2 left-2 right-2">
                <div class="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white text-center">
                  {{ formatDate(photo.date) }}
                </div>
              </div>
            </div>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
            Photos are stored privately and only visible to you
          </p>
        </div>
      </NCard>
    </div>

    <!-- Measurement History -->
    <NCard title="Measurement History">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th class="pb-3 font-medium">Date</th>
              <th class="pb-3 font-medium">Chest</th>
              <th class="pb-3 font-medium">Waist</th>
              <th class="pb-3 font-medium">Hips</th>
              <th class="pb-3 font-medium">Arms</th>
              <th class="pb-3 font-medium">Thighs</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(m, index) in measurementsHistory"
              :key="m.date"
              class="border-b border-gray-50 dark:border-gray-800/50"
              :class="index === measurementsHistory.length - 1 ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''"
            >
              <td class="py-3 font-medium text-gray-900 dark:text-white">
                {{ formatDate(m.date) }}
                <NTag v-if="index === measurementsHistory.length - 1" type="info" size="small" class="ml-2">Latest</NTag>
              </td>
              <td class="py-3 text-gray-600 dark:text-gray-300">{{ m.chest }}cm</td>
              <td class="py-3 text-gray-600 dark:text-gray-300">{{ m.waist }}cm</td>
              <td class="py-3 text-gray-600 dark:text-gray-300">{{ m.hips }}cm</td>
              <td class="py-3 text-gray-600 dark:text-gray-300">{{ m.arms }}cm</td>
              <td class="py-3 text-gray-600 dark:text-gray-300">{{ m.thighs }}cm</td>
            </tr>
          </tbody>
        </table>
      </div>
    </NCard>
    </template>

    <!-- Add Measurement Modal (outside conditional templates so it always renders) -->
    <NModal
      v-model:show="showAddModal"
      preset="card"
      title="Add Body Stats"
      :style="{ width: '90%', maxWidth: '500px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
          <NDatePicker v-model:value="newMeasurement.date" type="date" class="w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight (kg)</label>
            <NInputNumber v-model:value="newMeasurement.weight" :precision="1" placeholder="82.5" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body Fat (%)</label>
            <NInputNumber v-model:value="newMeasurement.bodyFat" :precision="1" placeholder="15.0" class="w-full" />
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800 pt-4">
          <p class="font-medium text-gray-900 dark:text-white mb-3">Measurements (cm)</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Chest</label>
              <NInputNumber v-model:value="newMeasurement.chest" :precision="1" placeholder="102" class="w-full" />
            </div>
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Waist</label>
              <NInputNumber v-model:value="newMeasurement.waist" :precision="1" placeholder="84" class="w-full" />
            </div>
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Hips</label>
              <NInputNumber v-model:value="newMeasurement.hips" :precision="1" placeholder="98" class="w-full" />
            </div>
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Left Arm</label>
              <NInputNumber v-model:value="newMeasurement.leftArm" :precision="1" placeholder="38" class="w-full" />
            </div>
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Right Arm</label>
              <NInputNumber v-model:value="newMeasurement.rightArm" :precision="1" placeholder="38.5" class="w-full" />
            </div>
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Left Thigh</label>
              <NInputNumber v-model:value="newMeasurement.leftThigh" :precision="1" placeholder="58" class="w-full" />
            </div>
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1">Right Thigh</label>
              <NInputNumber v-model:value="newMeasurement.rightThigh" :precision="1" placeholder="58.5" class="w-full" />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton :disabled="saving" @click="showAddModal = false; resetForm()">Cancel</NButton>
          <NButton type="primary" :loading="saving" @click="saveMeasurement">Save Measurement</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
