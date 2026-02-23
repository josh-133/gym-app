<script setup lang="ts">
/**
 * SVG anatomical body diagram colored by training volume per muscle group
 * Front + Back views with hover tooltips
 */

const { workouts } = useWorkoutHistory()
import { EXERCISE_LIBRARY } from '~/utils/exercises'
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()

// Calculate weekly volume (sets) per muscle group
const muscleVolume = computed(() => {
  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000

  const volume = new Map<string, number>()

  workouts.value.forEach(w => {
    if (new Date(w.date).getTime() < weekAgo) return

    w.exercises.forEach(ex => {
      const libraryEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
      if (!libraryEx) return

      const completedSets = ex.sets.filter(s => s.completed).length

      libraryEx.muscleGroups.forEach(muscle => {
        volume.set(muscle, (volume.get(muscle) || 0) + completedSets)
      })
    })
  })

  return volume
})

function getFillColor(muscle: string): string {
  const sets = muscleVolume.value.get(muscle) || 0
  const dark = uiStore.isDarkMode
  if (sets === 0) return dark ? '#4b5563' : '#d1d5db'
  if (sets < 5) return dark ? '#d97706' : '#f59e0b'
  if (sets < 10) return dark ? '#16a34a' : '#22c55e'
  if (sets < 15) return dark ? '#15803d' : '#16a34a'
  return dark ? '#166534' : '#15803d'
}

function getSets(muscle: string): number {
  return muscleVolume.value.get(muscle) || 0
}

// Tooltip state
const tooltip = ref<{ show: boolean; x: number; y: number; muscle: string; label: string; sets: number }>({
  show: false,
  x: 0,
  y: 0,
  muscle: '',
  label: '',
  sets: 0,
})

const muscleLabels: Record<string, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  back: 'Upper Back',
  lats: 'Lats',
  traps: 'Traps',
  lower_back: 'Lower Back',
}

function showTooltip(event: MouseEvent | TouchEvent, muscle: string) {
  const e = 'touches' in event ? event.touches[0] : event
  const container = (event.currentTarget as HTMLElement).closest('.heat-map-container')
  if (!container) return
  const rect = container.getBoundingClientRect()
  tooltip.value = {
    show: true,
    x: e.clientX - rect.left,
    y: e.clientY - rect.top - 40,
    muscle,
    label: muscleLabels[muscle] || muscle,
    sets: getSets(muscle),
  }
}

function hideTooltip() {
  tooltip.value.show = false
}

// Stroke color for body outline
const outlineStroke = computed(() => uiStore.isDarkMode ? '#6b7280' : '#9ca3af')
const outlineStrokeLight = computed(() => uiStore.isDarkMode ? '#4b5563' : '#d1d5db')
</script>

<template>
  <div class="card p-6">
    <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
      Muscle Heat Map
      <span class="text-xs font-normal lowercase ml-1">(last 7 days)</span>
    </h2>

    <div class="heat-map-container relative">
      <!-- Tooltip -->
      <div
        v-if="tooltip.show"
        class="absolute z-10 pointer-events-none bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', transform: 'translateX(-50%)' }"
      >
        {{ tooltip.label }}: {{ tooltip.sets }} sets
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        <!-- Front View -->
        <div class="text-center flex-shrink-0">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Front</p>
          <svg viewBox="0 0 200 420" class="w-36 sm:w-44 h-auto" xmlns="http://www.w3.org/2000/svg">
            <!-- Head -->
            <ellipse cx="100" cy="30" rx="18" ry="22" fill="none" :stroke="outlineStroke" stroke-width="1.5" />
            <!-- Neck -->
            <rect x="93" y="52" width="14" height="12" fill="none" :stroke="outlineStroke" stroke-width="1.5" rx="3" />

            <!-- Shoulders (front delts) -->
            <path
              d="M68,68 Q58,65 52,78 Q50,84 52,92 L68,88 L68,68Z"
              :fill="getFillColor('shoulders')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'shoulders')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'shoulders')"
              @touchend="hideTooltip"
            />
            <path
              d="M132,68 Q142,65 148,78 Q150,84 148,92 L132,88 L132,68Z"
              :fill="getFillColor('shoulders')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'shoulders')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'shoulders')"
              @touchend="hideTooltip"
            />

            <!-- Chest -->
            <path
              d="M68,68 L68,88 Q68,108 78,112 L92,114 Q100,115 108,114 L122,112 Q132,108 132,88 L132,68 Q120,64 100,64 Q80,64 68,68Z"
              :fill="getFillColor('chest')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'chest')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'chest')"
              @touchend="hideTooltip"
            />

            <!-- Biceps -->
            <path
              d="M52,92 Q48,100 44,116 Q42,128 44,140 L52,142 Q56,130 56,116 Q56,102 56,94 L52,92Z"
              :fill="getFillColor('biceps')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'biceps')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'biceps')"
              @touchend="hideTooltip"
            />
            <path
              d="M148,92 Q152,100 156,116 Q158,128 156,140 L148,142 Q144,130 144,116 Q144,102 144,94 L148,92Z"
              :fill="getFillColor('biceps')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'biceps')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'biceps')"
              @touchend="hideTooltip"
            />

            <!-- Forearms -->
            <path
              d="M44,140 Q40,158 38,176 Q37,186 40,194 L48,194 Q50,180 50,168 Q50,154 52,142 L44,140Z"
              :fill="getFillColor('forearms')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'forearms')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'forearms')"
              @touchend="hideTooltip"
            />
            <path
              d="M156,140 Q160,158 162,176 Q163,186 160,194 L152,194 Q150,180 150,168 Q150,154 148,142 L156,140Z"
              :fill="getFillColor('forearms')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'forearms')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'forearms')"
              @touchend="hideTooltip"
            />

            <!-- Abs -->
            <path
              d="M86,114 L86,184 Q86,192 92,194 L108,194 Q114,192 114,184 L114,114 Q108,116 100,116 Q92,116 86,114Z"
              :fill="getFillColor('abs')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'abs')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'abs')"
              @touchend="hideTooltip"
            />
            <!-- Abs detail lines -->
            <line x1="86" y1="132" x2="114" y2="132" :stroke="outlineStrokeLight" stroke-width="0.5" />
            <line x1="86" y1="150" x2="114" y2="150" :stroke="outlineStrokeLight" stroke-width="0.5" />
            <line x1="86" y1="168" x2="114" y2="168" :stroke="outlineStrokeLight" stroke-width="0.5" />
            <line x1="100" y1="114" x2="100" y2="184" :stroke="outlineStrokeLight" stroke-width="0.5" />

            <!-- Obliques -->
            <path
              d="M68,108 Q66,112 66,120 L66,180 Q68,190 78,194 L86,194 L86,184 L86,114 L78,112 Q72,110 68,108Z"
              :fill="getFillColor('obliques')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'obliques')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'obliques')"
              @touchend="hideTooltip"
            />
            <path
              d="M132,108 Q134,112 134,120 L134,180 Q132,190 122,194 L114,194 L114,184 L114,114 L122,112 Q128,110 132,108Z"
              :fill="getFillColor('obliques')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'obliques')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'obliques')"
              @touchend="hideTooltip"
            />

            <!-- Quads -->
            <path
              d="M70,200 Q66,220 64,250 Q62,280 66,310 L84,310 Q88,280 88,250 Q88,225 86,200 L70,200Z"
              :fill="getFillColor('quads')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'quads')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'quads')"
              @touchend="hideTooltip"
            />
            <path
              d="M130,200 Q134,220 136,250 Q138,280 134,310 L116,310 Q112,280 112,250 Q112,225 114,200 L130,200Z"
              :fill="getFillColor('quads')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'quads')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'quads')"
              @touchend="hideTooltip"
            />

            <!-- Calves (front - inner portion visible) -->
            <path
              d="M68,318 Q66,340 66,355 Q66,375 70,395 L82,395 Q84,375 84,355 Q84,340 82,318 L68,318Z"
              :fill="getFillColor('calves')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'calves')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'calves')"
              @touchend="hideTooltip"
            />
            <path
              d="M118,318 Q116,340 116,355 Q116,375 118,395 L132,395 Q134,375 134,355 Q134,340 132,318 L118,318Z"
              :fill="getFillColor('calves')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'calves')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'calves')"
              @touchend="hideTooltip"
            />

            <!-- Knee joint lines -->
            <line x1="64" y1="312" x2="88" y2="312" :stroke="outlineStroke" stroke-width="0.8" />
            <line x1="112" y1="312" x2="138" y2="312" :stroke="outlineStroke" stroke-width="0.8" />

            <!-- Hip area connector -->
            <path
              d="M66,194 L70,200 L86,200 L92,194"
              fill="none" :stroke="outlineStroke" stroke-width="1"
            />
            <path
              d="M108,194 L114,200 L130,200 L134,194"
              fill="none" :stroke="outlineStroke" stroke-width="1"
            />

            <!-- Hands (simple) -->
            <ellipse cx="40" cy="202" rx="6" ry="10" fill="none" :stroke="outlineStroke" stroke-width="1" />
            <ellipse cx="160" cy="202" rx="6" ry="10" fill="none" :stroke="outlineStroke" stroke-width="1" />

            <!-- Feet -->
            <path d="M66,395 L66,410 Q66,415 76,415 Q82,415 82,410 L82,395" fill="none" :stroke="outlineStroke" stroke-width="1" />
            <path d="M118,395 L118,410 Q118,415 126,415 Q134,415 134,410 L134,395" fill="none" :stroke="outlineStroke" stroke-width="1" />
          </svg>
        </div>

        <!-- Back View -->
        <div class="text-center flex-shrink-0">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Back</p>
          <svg viewBox="0 0 200 420" class="w-36 sm:w-44 h-auto" xmlns="http://www.w3.org/2000/svg">
            <!-- Head -->
            <ellipse cx="100" cy="30" rx="18" ry="22" fill="none" :stroke="outlineStroke" stroke-width="1.5" />
            <!-- Neck -->
            <rect x="93" y="52" width="14" height="12" fill="none" :stroke="outlineStroke" stroke-width="1.5" rx="3" />

            <!-- Traps -->
            <path
              d="M80,62 Q72,60 60,66 Q52,70 52,78 L60,82 Q68,72 80,68 L80,62Z"
              :fill="getFillColor('traps')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'traps')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'traps')"
              @touchend="hideTooltip"
            />
            <path
              d="M120,62 Q128,60 140,66 Q148,70 148,78 L140,82 Q132,72 120,68 L120,62Z"
              :fill="getFillColor('traps')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'traps')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'traps')"
              @touchend="hideTooltip"
            />

            <!-- Rear Delts / Shoulders -->
            <path
              d="M60,82 L52,78 Q48,84 48,92 L56,96 Q58,88 60,82Z"
              :fill="getFillColor('shoulders')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'shoulders')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'shoulders')"
              @touchend="hideTooltip"
            />
            <path
              d="M140,82 L148,78 Q152,84 152,92 L144,96 Q142,88 140,82Z"
              :fill="getFillColor('shoulders')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'shoulders')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'shoulders')"
              @touchend="hideTooltip"
            />

            <!-- Upper Back -->
            <path
              d="M80,68 Q90,72 100,72 Q110,72 120,68 L120,108 Q110,114 100,114 Q90,114 80,108 L80,68Z"
              :fill="getFillColor('back')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'back')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'back')"
              @touchend="hideTooltip"
            />
            <!-- Spine line -->
            <line x1="100" y1="68" x2="100" y2="190" :stroke="outlineStrokeLight" stroke-width="0.7" />

            <!-- Lats -->
            <path
              d="M60,82 Q58,88 56,96 L56,110 Q56,134 64,148 L72,150 Q74,142 74,130 L74,108 L80,108 L80,68 L60,82Z"
              :fill="getFillColor('lats')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'lats')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'lats')"
              @touchend="hideTooltip"
            />
            <path
              d="M140,82 Q142,88 144,96 L144,110 Q144,134 136,148 L128,150 Q126,142 126,130 L126,108 L120,108 L120,68 L140,82Z"
              :fill="getFillColor('lats')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'lats')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'lats')"
              @touchend="hideTooltip"
            />

            <!-- Lower Back -->
            <path
              d="M80,108 Q90,114 100,114 Q110,114 120,108 L120,160 Q118,172 114,180 L110,190 Q104,194 100,194 Q96,194 90,190 L86,180 Q82,172 80,160 L80,108Z"
              :fill="getFillColor('lower_back')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'lower_back')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'lower_back')"
              @touchend="hideTooltip"
            />

            <!-- Triceps -->
            <path
              d="M48,92 Q44,102 42,118 Q40,132 42,142 L52,144 Q52,130 52,118 Q52,104 56,96 L48,92Z"
              :fill="getFillColor('triceps')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'triceps')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'triceps')"
              @touchend="hideTooltip"
            />
            <path
              d="M152,92 Q156,102 158,118 Q160,132 158,142 L148,144 Q148,130 148,118 Q148,104 144,96 L152,92Z"
              :fill="getFillColor('triceps')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'triceps')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'triceps')"
              @touchend="hideTooltip"
            />

            <!-- Forearms (back view) -->
            <path
              d="M42,142 Q38,160 36,178 Q35,188 38,196 L46,196 Q48,182 48,170 Q48,156 52,144 L42,142Z"
              :fill="getFillColor('forearms')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'forearms')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'forearms')"
              @touchend="hideTooltip"
            />
            <path
              d="M158,142 Q162,160 164,178 Q165,188 162,196 L154,196 Q152,182 152,170 Q152,156 148,144 L158,142Z"
              :fill="getFillColor('forearms')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'forearms')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'forearms')"
              @touchend="hideTooltip"
            />

            <!-- Glutes -->
            <path
              d="M72,190 Q68,194 66,200 Q64,210 68,218 L86,218 Q92,212 92,204 Q92,196 90,190 L72,190Z"
              :fill="getFillColor('glutes')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'glutes')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'glutes')"
              @touchend="hideTooltip"
            />
            <path
              d="M128,190 Q132,194 134,200 Q136,210 132,218 L114,218 Q108,212 108,204 Q108,196 110,190 L128,190Z"
              :fill="getFillColor('glutes')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'glutes')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'glutes')"
              @touchend="hideTooltip"
            />

            <!-- Hamstrings -->
            <path
              d="M68,222 Q64,244 64,270 Q64,295 66,310 L84,310 Q86,290 86,270 Q86,244 86,222 L68,222Z"
              :fill="getFillColor('hamstrings')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'hamstrings')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'hamstrings')"
              @touchend="hideTooltip"
            />
            <path
              d="M114,222 Q112,244 112,270 Q112,295 114,310 L134,310 Q136,290 136,270 Q136,244 132,222 L114,222Z"
              :fill="getFillColor('hamstrings')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'hamstrings')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'hamstrings')"
              @touchend="hideTooltip"
            />

            <!-- Calves -->
            <path
              d="M66,318 Q64,336 64,352 Q64,372 68,395 L82,395 Q84,372 84,352 Q84,336 82,318 L66,318Z"
              :fill="getFillColor('calves')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'calves')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'calves')"
              @touchend="hideTooltip"
            />
            <path
              d="M118,318 Q116,336 116,352 Q116,372 118,395 L132,395 Q134,372 134,352 Q134,336 132,318 L118,318Z"
              :fill="getFillColor('calves')"
              :stroke="outlineStroke"
              stroke-width="1"
              class="muscle-region"
              @mouseenter="showTooltip($event, 'calves')"
              @mouseleave="hideTooltip"
              @touchstart.passive="showTooltip($event, 'calves')"
              @touchend="hideTooltip"
            />

            <!-- Knee joint lines -->
            <line x1="64" y1="312" x2="86" y2="312" :stroke="outlineStroke" stroke-width="0.8" />
            <line x1="112" y1="312" x2="136" y2="312" :stroke="outlineStroke" stroke-width="0.8" />

            <!-- Glute crease line -->
            <path d="M86,218 Q100,224 114,218" fill="none" :stroke="outlineStroke" stroke-width="0.7" />

            <!-- Hands -->
            <ellipse cx="38" cy="204" rx="6" ry="10" fill="none" :stroke="outlineStroke" stroke-width="1" />
            <ellipse cx="162" cy="204" rx="6" ry="10" fill="none" :stroke="outlineStroke" stroke-width="1" />

            <!-- Feet -->
            <path d="M66,395 L66,410 Q66,415 76,415 Q82,415 82,410 L82,395" fill="none" :stroke="outlineStroke" stroke-width="1" />
            <path d="M118,395 L118,410 Q118,415 126,415 Q134,415 134,410 L134,395" fill="none" :stroke="outlineStroke" stroke-width="1" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600"></div>
        <span>0</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-amber-500 dark:bg-amber-600"></div>
        <span>1-4</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-500 dark:bg-green-600"></div>
        <span>5-9</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-600 dark:bg-green-700"></div>
        <span>10-14</span>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-3 h-3 rounded bg-green-700 dark:bg-green-800"></div>
        <span>15+</span>
      </div>
      <span class="text-gray-400 dark:text-gray-500 ml-1">sets/week</span>
    </div>
  </div>
</template>

<style scoped>
.muscle-region {
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.muscle-region:hover {
  opacity: 0.8;
  filter: brightness(1.15);
}
</style>
