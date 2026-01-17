<script setup lang="ts">
// Initialize auth on app start
const auth = useAuth()

onMounted(async () => {
  await auth.initialize()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
