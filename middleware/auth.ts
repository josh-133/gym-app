export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side - server doesn't have access to localStorage session
  if (import.meta.server) {
    return
  }

  const auth = useAuth()

  // Always call initialize - it handles the "already initialized" case
  await auth.initialize()

  // Small delay to allow auth state to settle from localStorage
  if (!auth.isAuthenticated.value) {
    // Wait a bit for potential session hydration
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Redirect to login if still not authenticated
  if (!auth.isAuthenticated.value) {
    return navigateTo('/login', { replace: true })
  }
})
