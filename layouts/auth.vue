<script setup lang="ts">
import { NConfigProvider, darkTheme, type GlobalThemeOverrides } from 'naive-ui'

const uiStore = useUIStore()

onMounted(() => {
  uiStore.applyTheme()
})

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1a1a1a',
    primaryColorHover: '#2a2a2a',
    primaryColorPressed: '#0d0d0d',
    borderRadius: '12px',
  },
}

const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#ffffff',
    primaryColorHover: '#f3f4f6',
    primaryColorPressed: '#e5e7eb',
    borderRadius: '12px',
  },
}

const naiveTheme = computed(() => uiStore.isDarkMode ? darkTheme : null)
const currentOverrides = computed(() => uiStore.isDarkMode ? darkThemeOverrides : themeOverrides)
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="currentOverrides">
    <div class="min-h-screen bg-gray-50 dark:bg-[#111111]">
      <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          <!-- Logo -->
          <div class="text-center mb-8">
            <NuxtLink to="/" class="inline-flex items-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-primary-900 dark:bg-white flex items-center justify-center">
                <svg class="w-6 h-6 text-white dark:text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
                </svg>
              </div>
              <span class="font-semibold text-xl text-primary-900 dark:text-white">GymTracker</span>
            </NuxtLink>
          </div>
          <slot />
        </div>
      </div>
    </div>
  </NConfigProvider>
</template>
