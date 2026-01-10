<script setup lang="ts">
import { NConfigProvider, darkTheme, type GlobalThemeOverrides } from 'naive-ui'

const uiStore = useUIStore()

onMounted(() => {
  uiStore.applyTheme()
})

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#6366f1',
    primaryColorHover: '#4f46e5',
    primaryColorPressed: '#4338ca',
    borderRadius: '8px',
  },
}

const naiveTheme = computed(() => uiStore.isDarkMode ? darkTheme : null)
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div class="min-h-screen flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          <slot />
        </div>
      </div>
    </div>
  </NConfigProvider>
</template>
