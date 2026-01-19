export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'consistency' | 'strength' | 'endurance' | 'milestone' | 'social'
  criteria: Record<string, unknown>
  points: number
}

export interface UserAchievement {
  id: string
  achievement_id: string
  unlocked_at: string | null
  progress: number
  achievement?: Achievement
}

export interface AchievementWithProgress extends Achievement {
  unlocked: boolean
  progress: number
  unlockedAt?: string
}

export function useAchievements() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  const achievements = useState<AchievementWithProgress[]>('achievements', () => [])
  const loading = useState('achievementsLoading', () => false)

  async function fetchAchievements() {
    if (!$supabase) return

    loading.value = true
    try {
      // Fetch all available achievements
      const { data: allAchievements, error: achievementsError } = await $supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true })

      if (achievementsError) throw achievementsError

      // Fetch user's achievement progress if logged in
      let userProgress: Record<string, UserAchievement> = {}

      if (user.value) {
        const { data: userAchievements, error: userError } = await $supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.value.id)

        if (userError) throw userError

        // Create a map of achievement_id -> user progress
        userProgress = (userAchievements || []).reduce((acc, ua) => {
          acc[ua.achievement_id] = ua
          return acc
        }, {} as Record<string, UserAchievement>)
      }

      // Combine achievements with user progress
      achievements.value = (allAchievements || []).map((a) => {
        const userAchievement = userProgress[a.id]
        return {
          ...a,
          unlocked: userAchievement?.unlocked_at != null,
          progress: userAchievement?.progress || 0,
          unlockedAt: userAchievement?.unlocked_at || undefined,
        }
      })
    } catch (err) {
      console.error('Error fetching achievements:', err)
    } finally {
      loading.value = false
    }
  }

  const unlockedAchievements = computed(() => achievements.value.filter((a) => a.unlocked))
  const lockedAchievements = computed(() => achievements.value.filter((a) => !a.unlocked))
  const totalPoints = computed(() =>
    unlockedAchievements.value.reduce((sum, a) => sum + a.points, 0)
  )

  return {
    achievements,
    loading,
    fetchAchievements,
    unlockedAchievements,
    lockedAchievements,
    totalPoints,
  }
}
