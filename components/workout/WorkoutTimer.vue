<script setup lang="ts">
const workoutStore = useWorkoutStore()

const elapsed = ref(0)

// Update elapsed time every second
let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  interval = setInterval(() => {
    elapsed.value = workoutStore.elapsedSeconds
  }, 1000)
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 text-2xl font-mono font-bold text-gray-900 dark:text-white">
      <span>{{ formatTime(elapsed) }}</span>
      <span
        v-if="workoutStore.isPaused"
        class="text-sm font-normal text-yellow-600 dark:text-yellow-400"
      >
        (Paused)
      </span>
    </div>

    <div class="flex gap-1">
      <button
        v-if="!workoutStore.isPaused"
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        @click="workoutStore.pauseWorkout"
        title="Pause"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <button
        v-else
        class="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
        @click="workoutStore.resumeWorkout"
        title="Resume"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>
