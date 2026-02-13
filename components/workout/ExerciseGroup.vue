<script setup lang="ts">
import { NButton } from 'naive-ui'
import type { ExerciseGroupType } from '~/types/database'

const props = defineProps<{
  groupType: ExerciseGroupType
  exerciseCount: number
  readonly?: boolean
}>()

const emit = defineEmits<{
  dissolve: []
}>()

const label = computed(() => props.groupType === 'circuit' ? 'Circuit' : 'Superset')
const borderColor = computed(() => props.groupType === 'circuit' ? 'border-purple-400 dark:border-purple-500' : 'border-indigo-400 dark:border-indigo-500')
const bgColor = computed(() => props.groupType === 'circuit' ? 'bg-purple-50/50 dark:bg-purple-900/10' : 'bg-indigo-50/50 dark:bg-indigo-900/10')
const badgeColor = computed(() => props.groupType === 'circuit' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300')
</script>

<template>
  <div class="rounded-xl border-l-4 p-3 space-y-3" :class="[borderColor, bgColor]">
    <!-- Group Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 text-xs font-semibold rounded-full" :class="badgeColor">
          {{ label }}
        </span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ exerciseCount }} exercises
        </span>
      </div>
      <NButton v-if="!readonly" size="tiny" quaternary @click="emit('dissolve')">
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </template>
        Unlink
      </NButton>
    </div>

    <!-- Exercises Slot -->
    <div class="space-y-3">
      <slot />
    </div>
  </div>
</template>
