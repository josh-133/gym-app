import type { SubscriptionStatus } from '~/types/database'

interface SubscriptionState {
  status: SubscriptionStatus
  isPremium: boolean
  endsAt: string | null
  isLoading: boolean
  error: string | null
}

export function useSubscription() {
  const { session } = useAuth()
  const supabase = useSupabaseClient()

  const state = useState<SubscriptionState>('subscription', () => ({
    status: 'free',
    isPremium: false,
    endsAt: null,
    isLoading: false,
    error: null,
  }))

  async function fetchStatus() {
    if (!session.value?.access_token) {
      state.value = {
        status: 'free',
        isPremium: false,
        endsAt: null,
        isLoading: false,
        error: null,
      }
      return
    }

    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await $fetch('/api/subscription/status', {
        headers: {
          Authorization: `Bearer ${session.value.access_token}`,
        },
      })

      state.value.status = response.status as SubscriptionStatus
      state.value.isPremium = response.isPremium
      state.value.endsAt = response.endsAt
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
      state.value.error = 'Failed to load subscription status'
    } finally {
      state.value.isLoading = false
    }
  }

  async function startCheckout() {
    if (!session.value?.access_token) {
      throw new Error('Authentication required')
    }

    try {
      const response = await $fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.value.access_token}`,
        },
      })

      if (response.url) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      throw new Error('Failed to start checkout')
    }
  }

  async function openCustomerPortal() {
    if (!session.value?.access_token) {
      throw new Error('Authentication required')
    }

    try {
      const response = await $fetch('/api/subscription/create-portal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.value.access_token}`,
        },
      })

      if (response.url) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error)
      throw new Error('Failed to open billing portal')
    }
  }

  // Watch for auth changes and refetch subscription status
  watch(
    () => session.value?.user?.id,
    (newUserId, oldUserId) => {
      if (newUserId !== oldUserId) {
        fetchStatus()
      }
    },
    { immediate: true }
  )

  return {
    // State
    status: computed(() => state.value.status),
    isPremium: computed(() => state.value.isPremium),
    endsAt: computed(() => state.value.endsAt),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),

    // Actions
    fetchStatus,
    startCheckout,
    openCustomerPortal,
  }
}
