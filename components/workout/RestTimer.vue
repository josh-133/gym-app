<script setup lang="ts">
import { NButton, NModal, NSlider } from 'naive-ui'
import { playBeep, playCompletionAlert } from '~/utils/audio'
import { formatTime } from '~/utils/time'

const workoutStore = useWorkoutStore()

const showTimerModal = ref(false)
const customSeconds = ref(90)

// Rest timer presets in seconds
const presets = [
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
]

// Current remaining time
const remainingSeconds = ref(0)
let interval: ReturnType<typeof setInterval> | null = null

function startTimer(seconds: number) {
  workoutStore.startRestTimer(seconds)
  remainingSeconds.value = seconds
  showTimerModal.value = false

  // Clear any existing interval
  if (interval) {
    clearInterval(interval)
  }

  // Start countdown
  interval = setInterval(() => {
    remainingSeconds.value = workoutStore.restTimerRemaining

    // Play warning beep at 5 seconds
    if (remainingSeconds.value === 5) {
      playBeep(500, 100)
    }
    // Play warning beep at 3 seconds
    if (remainingSeconds.value === 3) {
      playBeep(600, 100)
    }

    // Timer complete
    if (remainingSeconds.value <= 0) {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      playCompletionAlert()
      workoutStore.cancelRestTimer()
    }
  }, 1000)
}

function cancelTimer() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
  workoutStore.cancelRestTimer()
  remainingSeconds.value = 0
}

function addTime(seconds: number) {
  if (workoutStore.restTimerEndAt) {
    const newEnd = new Date(workoutStore.restTimerEndAt.getTime() + seconds * 1000)
    workoutStore.restTimerEndAt = newEnd
    remainingSeconds.value = workoutStore.restTimerRemaining
  }
}

// Calculate progress percentage
const progressPercent = computed(() => {
  if (!workoutStore.restTimerEndAt || remainingSeconds.value <= 0) return 0
  // We don't know the original duration, so just show remaining time visually
  return 100
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})

// Expose start timer for parent components
defineExpose({ startTimer })
</script>

<template>
  <div>
    <!-- Timer Display (when active) -->
    <div
      v-if="remainingSeconds > 0"
      class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
    >
      <div class="bg-primary-900 dark:bg-white text-white dark:text-primary-900 rounded-full px-6 py-3 shadow-xl flex items-center gap-4">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-2xl font-mono font-bold">{{ formatTime(remainingSeconds) }}</span>
        </div>

        <div class="flex items-center gap-1">
          <button
            @click="addTime(-15)"
            class="p-1.5 rounded-full hover:bg-white/20 dark:hover:bg-black/10 transition-colors"
            title="Remove 15 seconds"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>
          <button
            @click="addTime(15)"
            class="p-1.5 rounded-full hover:bg-white/20 dark:hover:bg-black/10 transition-colors"
            title="Add 15 seconds"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            @click="cancelTimer"
            class="p-1.5 rounded-full hover:bg-white/20 dark:hover:bg-black/10 transition-colors ml-2"
            title="Cancel timer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Start Timer Button (when not active) -->
    <button
      v-else
      @click="showTimerModal = true"
      class="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 w-14 h-14 rounded-full bg-primary-900 dark:bg-white text-white dark:text-primary-900 shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
      title="Start rest timer"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>

    <!-- Timer Selection Modal -->
    <NModal
      v-model:show="showTimerModal"
      preset="card"
      title="Rest Timer"
      class="max-w-sm"
    >
      <div class="space-y-6">
        <!-- Presets -->
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Quick select</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="preset in presets"
              :key="preset.seconds"
              @click="startTimer(preset.seconds)"
              class="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-primary-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-primary-500 dark:hover:border-white transition-all"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Custom Time -->
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Custom time</p>
          <div class="flex items-center gap-4">
            <NSlider
              v-model:value="customSeconds"
              :min="15"
              :max="600"
              :step="15"
              :format-tooltip="(v: number) => formatTime(v)"
              class="flex-1"
            />
            <span class="text-lg font-mono font-medium text-primary-900 dark:text-white w-16 text-right">
              {{ formatTime(customSeconds) }}
            </span>
          </div>
          <NButton
            type="primary"
            block
            class="mt-4 !rounded-full"
            @click="startTimer(customSeconds)"
          >
            Start {{ formatTime(customSeconds) }} Timer
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>
