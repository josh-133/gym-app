<script setup lang="ts">
const route = useRoute()

interface NavItem {
  label: string
  icon: string
  to: string
}

const navItems: NavItem[] = [
  { label: 'Home', icon: 'home', to: '/dashboard' },
  { label: 'Workout', icon: 'dumbbell', to: '/workout' },
  { label: 'New', icon: 'plus', to: '/workout/new' },
  { label: 'Progress', icon: 'chart', to: '/progress' },
  { label: 'Profile', icon: 'user', to: '/profile' },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <nav class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 pb-safe">
    <ul class="flex justify-around py-2">
      <li v-for="item in navItems" :key="item.to">
        <NuxtLink
          :to="item.to"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]"
          :class="[
            isActive(item.to)
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-gray-400'
          ]"
        >
          <!-- Special styling for "New" button -->
          <template v-if="item.icon === 'plus'">
            <div class="w-12 h-12 -mt-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </template>
          <template v-else>
            <component :is="getIcon(item.icon)" class="w-6 h-6" />
            <span class="text-xs font-medium">{{ item.label }}</span>
          </template>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
const icons: Record<string, any> = {
  home: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
  },
  dumbbell: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2"/></svg>`,
  },
  chart: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  },
  user: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  },
  plus: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>`,
  },
}

function getIcon(name: string) {
  return {
    template: icons[name]?.template || icons.home.template,
  }
}
</script>

<style scoped>
.pb-safe {
  padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
}
</style>
