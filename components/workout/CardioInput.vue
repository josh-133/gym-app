<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NInputNumber, NButton, NText } from 'naive-ui'
import type { CardioTrackingType } from '~/utils/exercises'
import { useUnits } from '~/composables/useUnits'

const props = defineProps<{
  exerciseIndex: number
  trackingType: CardioTrackingType
  cardioLog: {
    duration_sec: number | null
    distance_km: number | null
    calories: number | null
  }
}>()

const emit = defineEmits<{
  update: [data: { duration_sec: number | null; distance_km: number | null; calories: number | null }]
  complete: []
  remove: []
}>()

const { unitSystem, convertDistance, formatDistance } = useUnits()

// Local state
const hours = ref<number | null>(null)
const minutes = ref<number | null>(null)
const seconds = ref<number | null>(null)
const distance = ref<number | null>(null)
const calories = ref<number | null>(null)
const reps = ref<number | null>(null)

// Initialize from props
watch(() => props.cardioLog, (log) => {
  if (log.duration_sec !== null) {
    const totalSec = log.duration_sec
    hours.value = Math.floor(totalSec / 3600)
    minutes.value = Math.floor((totalSec % 3600) / 60)
    seconds.value = totalSec % 60
  }
  if (log.distance_km !== null) {
    // Convert from km to display units
    distance.value = unitSystem.value === 'imperial'
      ? Math.round(log.distance_km * 0.621371 * 100) / 100
      : log.distance_km
  }
  calories.value = log.calories
}, { immediate: true })

// Computed total duration in seconds
const totalDurationSec = computed(() => {
  const h = hours.value || 0
  const m = minutes.value || 0
  const s = seconds.value || 0
  return h * 3600 + m * 60 + s
})

// Distance in km for storage
const distanceKm = computed(() => {
  if (distance.value === null) return null
  return unitSystem.value === 'imperial'
    ? distance.value / 0.621371
    : distance.value
})

// Calculate pace
const pace = computed(() => {
  if (!totalDurationSec.value || !distanceKm.value) return null
  const paceSecPerKm = totalDurationSec.value / distanceKm.value
  const paceMin = Math.floor(paceSecPerKm / 60)
  const paceSec = Math.round(paceSecPerKm % 60)
  const unit = unitSystem.value === 'imperial' ? 'mi' : 'km'
  // For imperial, convert pace
  if (unitSystem.value === 'imperial') {
    const paceSecPerMile = paceSecPerKm * 1.60934
    const paceMinMile = Math.floor(paceSecPerMile / 60)
    const paceSecMile = Math.round(paceSecPerMile % 60)
    return `${paceMinMile}:${paceSecMile.toString().padStart(2, '0')} /mi`
  }
  return `${paceMin}:${paceSec.toString().padStart(2, '0')} /km`
})

// Is the entry valid for completion
const isValid = computed(() => {
  if (props.trackingType === 'reps') {
    return reps.value !== null && reps.value > 0
  }
  return totalDurationSec.value > 0
})

// Update parent on changes
function emitUpdate() {
  if (props.trackingType === 'reps') {
    // For reps-based cardio, store reps as duration (hack for now)
    emit('update', {
      duration_sec: reps.value,
      distance_km: null,
      calories: calories.value,
    })
  } else {
    emit('update', {
      duration_sec: totalDurationSec.value || null,
      distance_km: distanceKm.value,
      calories: calories.value,
    })
  }
}

function handleComplete() {
  emitUpdate()
  emit('complete')
}

// Watch for changes and emit updates
watch([hours, minutes, seconds, distance, calories, reps], emitUpdate)

const distanceLabel = computed(() => unitSystem.value === 'imperial' ? 'Distance (mi)' : 'Distance (km)')
</script>

<template>
  <div class="cardio-input">
    <!-- Reps-based tracking (box jumps, burpees, etc.) -->
    <div v-if="trackingType === 'reps'" class="reps-input">
      <div class="input-row">
        <div class="input-group">
          <label>Reps</label>
          <NInputNumber
            v-model:value="reps"
            :min="0"
            :max="999"
            placeholder="0"
            size="large"
          />
        </div>
        <div class="input-group">
          <label>Calories</label>
          <NInputNumber
            v-model:value="calories"
            :min="0"
            :max="9999"
            placeholder="—"
            size="large"
          />
        </div>
      </div>
    </div>

    <!-- Duration-based tracking -->
    <div v-else class="duration-input">
      <div class="input-row">
        <div class="time-inputs">
          <div class="input-group time">
            <label>Hours</label>
            <NInputNumber
              v-model:value="hours"
              :min="0"
              :max="23"
              placeholder="0"
              size="large"
            />
          </div>
          <span class="time-separator">:</span>
          <div class="input-group time">
            <label>Min</label>
            <NInputNumber
              v-model:value="minutes"
              :min="0"
              :max="59"
              placeholder="0"
              size="large"
            />
          </div>
          <span class="time-separator">:</span>
          <div class="input-group time">
            <label>Sec</label>
            <NInputNumber
              v-model:value="seconds"
              :min="0"
              :max="59"
              placeholder="0"
              size="large"
            />
          </div>
        </div>
      </div>

      <!-- Distance input for duration_distance type -->
      <div v-if="trackingType === 'duration_distance'" class="input-row">
        <div class="input-group">
          <label>{{ distanceLabel }}</label>
          <NInputNumber
            v-model:value="distance"
            :min="0"
            :max="999"
            :precision="2"
            placeholder="0.00"
            size="large"
          />
        </div>
        <div class="input-group">
          <label>Calories</label>
          <NInputNumber
            v-model:value="calories"
            :min="0"
            :max="9999"
            placeholder="—"
            size="large"
          />
        </div>
      </div>

      <!-- Calories only for duration type -->
      <div v-else class="input-row single">
        <div class="input-group">
          <label>Calories</label>
          <NInputNumber
            v-model:value="calories"
            :min="0"
            :max="9999"
            placeholder="—"
            size="large"
          />
        </div>
      </div>

      <!-- Pace display -->
      <div v-if="pace" class="pace-display">
        <NText depth="3">Pace: {{ pace }}</NText>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="actions">
      <NButton
        type="error"
        quaternary
        size="small"
        @click="emit('remove')"
      >
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </template>
        Remove
      </NButton>
      <NButton
        type="success"
        :disabled="!isValid"
        size="small"
        @click="handleComplete"
      >
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </template>
        Complete
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.cardio-input {
  padding: 16px;
  background: var(--n-color-embedded);
  border-radius: 8px;
}

.input-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.input-row.single {
  max-width: 150px;
}

.time-inputs {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.time-separator {
  font-size: 24px;
  font-weight: bold;
  color: var(--n-text-color-3);
  padding-bottom: 8px;
}

.input-group {
  flex: 1;
}

.input-group.time {
  flex: 0 0 70px;
}

.input-group label {
  display: block;
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-bottom: 4px;
}

.pace-display {
  margin-bottom: 12px;
  font-size: 14px;
}

.actions {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--n-divider-color);
}
</style>
