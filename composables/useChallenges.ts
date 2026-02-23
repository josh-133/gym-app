/**
 * Challenges composable
 * Time-bound group challenges with leaderboard
 */

import type { Challenge, ChallengeParticipant } from '~/types/database'

interface ChallengeWithDetails extends Challenge {
  participants_count: number
  user_participant?: ChallengeParticipant
}

export function useChallenges() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  const challenges = useState<ChallengeWithDetails[]>('challenges', () => [])
  const loading = ref(false)

  async function fetchChallenges() {
    if (!$supabase || !auth.user.value) return
    loading.value = true

    try {
      const { data, error } = await $supabase
        .from('challenges')
        .select(`
          *,
          challenge_participants ( id, user_id, current_value, completed_at )
        `)
        .or(`is_public.eq.true,creator_id.eq.${auth.user.value.id}`)
        .order('created_at', { ascending: false })

      if (error || !data) return

      challenges.value = data.map((c: any) => ({
        ...c,
        participants_count: c.challenge_participants?.length || 0,
        user_participant: c.challenge_participants?.find(
          (p: any) => p.user_id === auth.user.value?.id
        ) || undefined,
      }))
    } finally {
      loading.value = false
    }
  }

  async function createChallenge(input: {
    name: string
    description?: string
    challenge_type: 'volume' | 'frequency' | 'streak' | 'distance'
    target_value: number
    unit: string
    start_date: string
    end_date: string
    is_public?: boolean
  }): Promise<Challenge | null> {
    if (!$supabase || !auth.user.value) return null

    const { data, error } = await $supabase
      .from('challenges')
      .insert({
        creator_id: auth.user.value.id,
        ...input,
        is_public: input.is_public ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating challenge:', error)
      return null
    }

    // Auto-join the creator
    await joinChallenge(data.id)
    await fetchChallenges()
    return data
  }

  async function joinChallenge(challengeId: string) {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: auth.user.value.id,
        current_value: 0,
      })
  }

  async function leaveChallenge(challengeId: string) {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('challenge_participants')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', auth.user.value.id)

    await fetchChallenges()
  }

  async function updateProgress(challengeId: string, value: number) {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('challenge_participants')
      .update({
        current_value: value,
        completed_at: undefined, // Will be set by check below
      })
      .eq('challenge_id', challengeId)
      .eq('user_id', auth.user.value.id)

    // Check if target met
    const challenge = challenges.value.find(c => c.id === challengeId)
    if (challenge && value >= challenge.target_value) {
      await $supabase
        .from('challenge_participants')
        .update({ completed_at: new Date().toISOString() })
        .eq('challenge_id', challengeId)
        .eq('user_id', auth.user.value.id)
    }
  }

  async function getLeaderboard(challengeId: string): Promise<(ChallengeParticipant & { user?: { username: string; display_name: string | null } })[]> {
    if (!$supabase) return []

    const { data } = await $supabase
      .from('challenge_participants')
      .select('*, profiles:user_id ( username, display_name )')
      .eq('challenge_id', challengeId)
      .order('current_value', { ascending: false })

    return (data || []).map((p: any) => ({ ...p, user: p.profiles }))
  }

  // Active challenges the user has joined
  const activeChallenges = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return challenges.value.filter(c =>
      c.user_participant &&
      c.end_date >= today &&
      !c.user_participant.completed_at
    )
  })

  return {
    challenges: readonly(challenges),
    loading: readonly(loading),
    activeChallenges,
    fetchChallenges,
    createChallenge,
    joinChallenge,
    leaveChallenge,
    updateProgress,
    getLeaderboard,
  }
}
