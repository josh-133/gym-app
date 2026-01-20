import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '~/types/database'

export function useAuth() {
  const { $supabase } = useNuxtApp()
  const user = useState<User | null>('user', () => null)
  const session = useState<Session | null>('session', () => null)
  const profile = useState<Profile | null>('profile', () => null)
  const loading = useState('authLoading', () => true)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize() {
    if (!$supabase) {
      loading.value = false
      return
    }

    // If already initialized and we have a user, just ensure profile is loaded
    if (!loading.value && user.value) {
      if (!profile.value) {
        await fetchProfile()
      }
      return
    }

    try {
      // First, set up the auth state change listener
      // This is important because it helps catch the session from storage
      const { data: { subscription } } = $supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null

        if (event === 'SIGNED_IN' && newSession) {
          await fetchProfile()
        } else if (event === 'SIGNED_OUT') {
          profile.value = null
        }
      })

      // Then get the current session
      const { data: { session: currentSession } } = await $supabase.auth.getSession()
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
        await fetchProfile()
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!$supabase || !user.value) return

    try {
      const { data, error } = await $supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      profile.value = data
    } catch (err) {
      console.error('Exception fetching profile:', err)
    }
  }

  async function signUp(email: string, password: string, username: string) {
    if (!$supabase) throw new Error('Supabase not configured')

    const { data, error } = await $supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })

    if (error) throw error
    return data
  }

  async function signIn(email: string, password: string) {
    if (!$supabase) throw new Error('Supabase not configured')

    const { data, error } = await $supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  async function signInWithGoogle() {
    if (!$supabase) throw new Error('Supabase not configured')

    const { data, error } = await $supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  }

  async function signOut() {
    if (!$supabase) return

    const { error } = await $supabase.auth.signOut()
    if (error) throw error

    user.value = null
    session.value = null
    profile.value = null
  }

  async function resetPassword(email: string) {
    if (!$supabase) throw new Error('Supabase not configured')

    const { error } = await $supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.value.id)
      .select()
      .single()

    if (error) throw error
    profile.value = data
    return data
  }

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated,
    initialize,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    fetchProfile,
  }
}
