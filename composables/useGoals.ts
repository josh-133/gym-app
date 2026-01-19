export type GoalType = 'weight' | 'strength' | 'cardio' | 'workout_frequency' | 'custom'

export interface UserGoal {
  id: string
  user_id: string
  goal_type: GoalType
  title: string
  description?: string
  target_value: number
  current_value: number
  unit: string
  exercise_id?: string
  deadline?: string
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface CreateGoalInput {
  goal_type: GoalType
  title: string
  description?: string
  target_value: number
  current_value?: number
  unit: string
  exercise_id?: string
  deadline?: string
}

export function useGoals() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  const goals = useState<UserGoal[]>('userGoals', () => [])
  const loading = useState('goalsLoading', () => false)

  async function fetchGoals() {
    if (!$supabase || !user.value) return

    loading.value = true
    try {
      const { data, error } = await $supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (error) {
        // Handle case where table doesn't exist yet (404)
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.code === '42P01') {
          console.warn('Goals table not found - migration may not have been run yet')
          goals.value = []
          return
        }
        throw error
      }
      goals.value = data || []
    } catch (err: any) {
      // Gracefully handle table not existing
      if (err?.status === 404 || err?.code === '42P01') {
        console.warn('Goals table not found - migration may not have been run yet')
        goals.value = []
        return
      }
      console.error('Error fetching goals:', err)
    } finally {
      loading.value = false
    }
  }

  async function createGoal(input: CreateGoalInput) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('user_goals')
      .insert({
        user_id: user.value.id,
        ...input,
        current_value: input.current_value || 0,
      })
      .select()
      .single()

    if (error) throw error

    goals.value = [data, ...goals.value]
    return data
  }

  async function updateGoal(id: string, updates: Partial<UserGoal>) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('user_goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.value.id)
      .select()
      .single()

    if (error) throw error

    const index = goals.value.findIndex((g) => g.id === id)
    if (index !== -1) {
      goals.value[index] = data
    }
    return data
  }

  async function updateGoalProgress(id: string, currentValue: number) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const goal = goals.value.find((g) => g.id === id)
    if (!goal) return

    const isCompleted = currentValue >= goal.target_value

    const { data, error } = await $supabase
      .from('user_goals')
      .update({
        current_value: currentValue,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.value.id)
      .select()
      .single()

    if (error) throw error

    const index = goals.value.findIndex((g) => g.id === id)
    if (index !== -1) {
      goals.value[index] = data
    }
    return data
  }

  async function deleteGoal(id: string) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { error } = await $supabase
      .from('user_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id)

    if (error) throw error

    goals.value = goals.value.filter((g) => g.id !== id)
  }

  // Computed helpers
  const activeGoals = computed(() => goals.value.filter((g) => !g.is_completed))
  const completedGoals = computed(() => goals.value.filter((g) => g.is_completed))

  // Calculate progress percentage
  function getProgressPercentage(goal: UserGoal): number {
    if (goal.target_value === 0) return 0
    const progress = (goal.current_value / goal.target_value) * 100
    return Math.min(Math.round(progress), 100)
  }

  // Get goal type display info
  function getGoalTypeInfo(type: GoalType) {
    switch (type) {
      case 'weight':
        return { label: 'Body Weight', icon: '⚖️', color: 'info' }
      case 'strength':
        return { label: 'Strength', icon: '💪', color: 'error' }
      case 'cardio':
        return { label: 'Cardio', icon: '🏃', color: 'success' }
      case 'workout_frequency':
        return { label: 'Workout Frequency', icon: '📅', color: 'warning' }
      case 'custom':
        return { label: 'Custom', icon: '🎯', color: 'default' }
      default:
        return { label: 'Goal', icon: '🎯', color: 'default' }
    }
  }

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
    activeGoals,
    completedGoals,
    getProgressPercentage,
    getGoalTypeInfo,
  }
}
