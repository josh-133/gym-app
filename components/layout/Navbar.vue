<script setup lang="ts">
import { NButton, NDropdown, NAvatar } from 'naive-ui'

const uiStore = useUIStore()
const auth = useAuth()
const route = useRoute()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/workout': 'Workouts',
    '/workout/new': 'New Workout',
    '/exercises': 'Exercises',
    '/progress': 'Progress',
    '/records': 'Records',
    '/achievements': 'Achievements',
    '/insights': 'Insights',
    '/profile': 'Profile',
  }
  return titles[route.path] || 'GymTracker'
})

const userMenuOptions = [
  { label: 'Profile', key: 'profile' },
  { label: 'Settings', key: 'settings' },
  { type: 'divider', key: 'd1' },
  { label: 'Sign Out', key: 'signout' },
]

async function handleUserMenuSelect(key: string) {
  switch (key) {
    case 'profile':
      await navigateTo('/profile')
      break
    case 'settings':
      await navigateTo('/profile?tab=settings')
      break
    case 'signout':
      try {
        await auth.signOut()
      } catch (error) {
        console.error('Sign out error:', error)
      }
      await navigateTo('/login')
      break
  }
}
</script>

<template>
  <header class="h-16 bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-gray-800 px-4 flex items-center justify-between">
    <!-- Left side -->
    <div class="flex items-center gap-4">
      <!-- Mobile menu button -->
      <button
        class="lg:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="uiStore.toggleMobileMenu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Desktop sidebar toggle -->
      <button
        class="hidden lg:flex p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="uiStore.toggleSidebar"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Page title -->
      <h1 class="text-lg font-semibold text-primary-900 dark:text-white">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-3">
      <!-- Quick start workout button -->
      <NuxtLink to="/workout/new">
        <NButton type="primary" class="hidden sm:flex !rounded-full !px-5">
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Start Workout
        </NButton>
      </NuxtLink>

      <!-- Theme toggle -->
      <button
        class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="uiStore.toggleTheme"
        :title="`Theme: ${uiStore.theme}`"
      >
        <svg v-if="uiStore.theme === 'light'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else-if="uiStore.theme === 'dark'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>

      <!-- Notifications -->
      <button class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 relative">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full"></span>
      </button>

      <!-- User menu -->
      <NDropdown
        :options="userMenuOptions"
        @select="handleUserMenuSelect"
        trigger="click"
        placement="bottom-end"
      >
        <button class="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
          <NAvatar
            round
            :size="36"
            :src="auth.profile.value?.avatar_url || undefined"
            class="bg-gray-200 dark:bg-gray-700"
          >
            {{ auth.profile.value?.display_name?.[0] || auth.profile.value?.username?.[0] || 'U' }}
          </NAvatar>
        </button>
      </NDropdown>
    </div>
  </header>
</template>
