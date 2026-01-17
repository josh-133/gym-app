<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { $supabase } = useNuxtApp()
const auth = useAuth()
const route = useRoute()

onMounted(async () => {
  if (!$supabase) {
    await navigateTo('/login?error=supabase_not_configured')
    return
  }

  try {
    // Check for error in URL (from OAuth provider)
    const errorParam = route.query.error as string
    const errorDescription = route.query.error_description as string

    if (errorParam) {
      console.error('OAuth error:', errorParam, errorDescription)
      await navigateTo(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
      return
    }

    // Check for authorization code in URL (PKCE flow)
    const code = route.query.code as string

    if (code) {
      // Exchange the code for a session
      const { data, error } = await $supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Code exchange error:', error)
        await navigateTo('/login?error=auth_failed')
        return
      }

      if (data.session) {
        await auth.initialize()
        await navigateTo('/dashboard')
        return
      }
    }

    // Fallback: check if session already exists (hash fragment flow)
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
