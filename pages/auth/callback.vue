<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { $supabase } = useNuxtApp()
const auth = useAuth()

onMounted(async () => {
  if (!$supabase) {
    await navigateTo('/login?error=supabase_not_configured')
    return
  }

  try {
    // Handle the OAuth callback - Supabase will exchange the code for a session
    const { data, error } = await $supabase.auth.getSession()

    if (error) {
      console.error('Auth callback error:', error)
      await navigateTo('/login?error=auth_failed')
      return
    }

    if (data.session) {
      // Session exists, initialize auth state and redirect to dashboard
      await auth.initialize()
      await navigateTo('/dashboard')
    } else {
      // No session, redirect to login
      await navigateTo('/login')
    }
  } catch (e) {
    console.error('Callback error:', e)
    await navigateTo('/login?error=callback_failed')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
    <div class="text-center text-white">
      <div class="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      <p class="text-xl font-medium">Signing you in...</p>
      <p class="text-white/70 mt-2">Please wait while we complete authentication</p>
    </div>
  </div>
</template>
