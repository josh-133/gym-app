/**
 * Push notification device tokens
 * Stores tokens in Supabase for server-side notification delivery
 */

export function useDeviceTokens() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  async function registerToken(token: string, platform: 'ios' | 'android' | 'web') {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('device_tokens')
      .upsert({
        user_id: auth.user.value.id,
        token,
        platform,
      }, { onConflict: 'user_id,token' })
  }

  async function removeToken(token: string) {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', auth.user.value.id)
      .eq('token', token)
  }

  async function removeAllTokens() {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', auth.user.value.id)
  }

  return {
    registerToken,
    removeToken,
    removeAllTokens,
  }
}
