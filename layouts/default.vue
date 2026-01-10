<script setup lang="ts">
import { NConfigProvider, darkTheme, type GlobalThemeOverrides } from 'naive-ui'

const uiStore = useUIStore()

// Apply theme on mount
onMounted(() => {
  uiStore.applyTheme()
})

// Theme overrides for Naive UI to match our vibrant design
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#a855f7',
    primaryColorHover: '#9333ea',
    primaryColorPressed: '#7c3aed',
    primaryColorSuppl: '#c084fc',
    infoColor: '#06b6d4',
    infoColorHover: '#0891b2',
    successColor: '#22c55e',
    successColorHover: '#16a34a',
    warningColor: '#f59e0b',
    warningColorHover: '#d97706',
    errorColor: '#ec4899',
    errorColorHover: '#db2777',
    borderRadius: '12px',
    borderRadiusSmall: '8px',
  },
  Button: {
    colorPrimary: '#a855f7',
    colorHoverPrimary: '#9333ea',
    colorPressedPrimary: '#7c3aed',
    borderRadiusMedium: '10px',
    borderRadiusLarge: '12px',
  },
  Card: {
    borderRadius: '16px',
  },
  Tag: {
    borderRadius: '8px',
  },
}

// Get current theme for Naive UI
const naiveTheme = computed(() => uiStore.isDarkMode ? darkTheme : null)
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <div class="min-h-screen mesh-bg-light dark:mesh-bg">
      <LayoutAppShell>
        <slot />
      </LayoutAppShell>
    </div>
  </NConfigProvider>
</template>
