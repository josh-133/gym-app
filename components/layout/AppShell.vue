<script setup lang="ts">
const uiStore = useUIStore()
const route = useRoute()

// Track if component is mounted (for SSR-safe Teleport)
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

// Close mobile menu on route change
watch(() => route.path, () => {
  uiStore.closeMobileMenu()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Desktop Sidebar -->
    <LayoutSidebar
      class="hidden lg:flex"
      :collapsed="!uiStore.sidebarOpen"
    />

    <!-- Mobile Sidebar Overlay - only render on client -->
    <Teleport to="body" :disabled="!isMounted">
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isMounted && uiStore.mobileMenuOpen"
          class="fixed inset-0 bg-black/50 z-40 lg:hidden"
          @click="uiStore.closeMobileMenu"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-300"
        leave-active-class="transition-transform duration-300"
        enter-from-class="-translate-x-full"
        leave-to-class="-translate-x-full"
      >
        <LayoutSidebar
          v-if="isMounted && uiStore.mobileMenuOpen"
          class="fixed inset-y-0 left-0 z-50 lg:hidden"
          :collapsed="false"
        />
      </Transition>
    </Teleport>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Navbar -->
      <LayoutNavbar />

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <slot />
      </main>

      <!-- Mobile Bottom Navigation -->
      <LayoutMobileNav class="lg:hidden" />
    </div>
  </div>
</template>
