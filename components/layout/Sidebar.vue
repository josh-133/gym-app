<script setup lang="ts">
import PremiumBadge from '~/components/subscription/PremiumBadge.vue'

defineProps<{
  collapsed?: boolean
}>()

const route = useRoute()
const { isPremium } = useSubscription()

interface NavItem {
  label: string
  icon: string
  to: string
  badge?: number
  premium?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'home', to: '/dashboard' },
  { label: 'Workout', icon: 'dumbbell', to: '/workout' },
  { label: 'Calendar', icon: 'calendar', to: '/calendar' },
  { label: 'Exercises', icon: 'list', to: '/exercises' },
  { label: 'Progress', icon: 'chart', to: '/progress' },
  { label: 'Records', icon: 'trophy', to: '/records' },
  { label: 'Achievements', icon: 'medal', to: '/achievements' },
  { label: 'Tools', icon: 'tools', to: '/tools' },
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
    class="flex flex-col bg-white dark:bg-[#111111] border-r border-gray-100 dark:border-gray-800 transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center px-4 border-b border-gray-100 dark:border-gray-800">
      <NuxtLink to="/dashboard" class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-900 dark:bg-white flex items-center justify-center">
          <svg class="w-6 h-6 text-white dark:text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
          </svg>
        </div>
        <span v-if="!collapsed" class="font-bold text-xl text-primary-900 dark:text-white">
          GymTracker
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
                ? 'bg-gray-100 dark:bg-gray-800 text-primary-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary-900 dark:hover:text-white'
            ]"
          >
            <component :is="getIcon(item.icon)" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!collapsed" class="font-medium">{{ item.label }}</span>
            <span
              v-if="!collapsed && item.badge"
              class="ml-auto bg-accent-500 text-white text-xs font-medium px-2 py-0.5 rounded-full"
            >
              {{ item.badge }}
            </span>
            <PremiumBadge
              v-if="!collapsed && item.premium && !isPremium"
              size="small"
              class="ml-auto"
            />
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Bottom Navigation -->
    <div class="border-t border-gray-100 dark:border-gray-800 py-4">
      <ul class="space-y-1 px-2">
        <li v-for="item in bottomNavItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            :class="[
              isActive(item.to)
                ? 'bg-gray-100 dark:bg-gray-800 text-primary-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary-900 dark:hover:text-white'
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
const icons: Record<string, any> = {
  home: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
  },
  dumbbell: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2"/></svg>`,
  },
  bolt: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  },
  calendar: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
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
  tools: {
    template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
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
