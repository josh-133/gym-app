export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuth()

  // Always call initialize - it handles the "already initialized" case
  await auth.initialize()

  // Redirect to login if not authenticated
  if (!auth.isAuthenticated.value) {
    return navigateTo('/login', { replace: true })
  }
})
