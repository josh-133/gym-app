<script setup lang="ts">
import { NIcon } from 'naive-ui'

defineProps<{
  collapsed?: boolean
}>()

const route = useRoute()

interface NavItem {
  label: string
  icon: string
  to: string
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'home', to: '/dashboard' },
  { label: 'Workout', icon: 'dumbbell', to: '/workout' },
  { label: 'Exercises', icon: 'list', to: '/exercises' },
  { label: 'Progress', icon: 'chart', to: '/progress' },
  { label: 'Records', icon: 'trophy', to: '/records' },
  { label: 'Achievements', icon: 'medal', to: '/achievements' },
  { label: 'Insights', icon: 'sparkles', to: '/insights' },
]

const bottomNavItems: NavItem[] = [
  { label: 'Profile', icon: 'user', to: '/profile' },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside
    class="flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center px-4 border-b border-gray-200/50 dark:border-gray-700/50">
      <NuxtLink to="/dashboard" class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex items-center justify-center shadow-lg glow-primary">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
          </svg>
        </div>
        <span v-if="!collapsed" class="font-bold text-xl gradient-text">
          GymApp
        </span>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-4 overflow-y-auto">
      <ul class="space-y-1 px-2">
        <li v-for="item in navItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            :class="[
              isActive(item.to)
                ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400'
            ]"
          >
            <component :is="getIcon(item.icon)" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!collapsed" class="font-medium">{{ item.label }}</span>
            <span
              v-if="!collapsed && item.badge"
              class="ml-auto bg-gradient-to-r from-accent-500 to-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full"
            >
              {{ item.badge }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Bottom Navigation -->
    <div class="border-t border-gray-200/50 dark:border-gray-700/50 py-4">
      <ul class="space-y-1 px-2">
        <li v-for="item in bottomNavItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            :class="[
              isActive(item.to)
                ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400'
            ]"
          >
            <component :is="getIcon(item.icon)" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!collapsed" class="font-medium">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script lang="ts">
// Icon components
const icons: Record<string, any> = {
  home: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
  },
  dumbbell: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2"/></svg>`,
  },
  list: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>`,
  },
  chart: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  },
  trophy: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>`,
  },
  medal: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>`,
  },
  sparkles: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>`,
  },
  user: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  },
}

function getIcon(name: string) {
  return {
    template: icons[name]?.template || icons.home.template,
  }
}
</script>
