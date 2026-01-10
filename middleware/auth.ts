export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuth()

  // Initialize auth if not already done
  if (auth.loading.value) {
    await auth.initialize()
  }

  // Redirect to login if not authenticated
  if (!auth.isAuthenticated.value) {
    return navigateTo('/login', { replace: true })
  }
})
