/**
 * Workout scheduling composable
 * Plan workouts on future calendar dates
 */

import type { ScheduledWorkout } from '~/types/database'

export function useSchedule() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  const scheduledWorkouts = useState<ScheduledWorkout[]>('scheduledWorkouts', () => [])
  const loading = ref(false)

  async function fetchSchedule(startDate?: string, endDate?: string) {
    if (!$supabase || !auth.user.value) return
    loading.value = true

    try {
      let query = $supabase
        .from('scheduled_workouts')
        .select('*')
        .eq('user_id', auth.user.value.id)
        .order('scheduled_date', { ascending: true })

      if (startDate) query = query.gte('scheduled_date', startDate)
      if (endDate) query = query.lte('scheduled_date', endDate)

      const { data, error } = await query

      if (!error && data) scheduledWorkouts.value = data
    } finally {
      loading.value = false
    }
  }

  async function scheduleWorkout(input: {
    templateId?: string
    programWorkoutId?: string
    scheduledDate: string
    reminderAt?: string
    notes?: string
  }): Promise<ScheduledWorkout | null> {
    if (!$supabase || !auth.user.value) return null

    const { data, error } = await $supabase
      .from('scheduled_workouts')
      .insert({
        user_id: auth.user.value.id,
        template_id: input.templateId || null,
        program_workout_id: input.programWorkoutId || null,
        scheduled_date: input.scheduledDate,
        reminder_at: input.reminderAt || null,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error scheduling workout:', error)
      return null
    }

    scheduledWorkouts.value.push(data)
    scheduledWorkouts.value.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    return data
  }

  async function markCompleted(scheduleId: string, sessionId: string) {
    if (!$supabase) return

    const { error } = await $supabase
      .from('scheduled_workouts')
      .update({ completed_session_id: sessionId })
      .eq('id', scheduleId)

    if (!error) {
      const idx = scheduledWorkouts.value.findIndex(s => s.id === scheduleId)
      if (idx !== -1) {
        scheduledWorkouts.value[idx].completed_session_id = sessionId
      }
    }
  }

  async function deleteScheduled(id: string) {
    if (!$supabase) return

    const { error } = await $supabase
      .from('scheduled_workouts')
      .delete()
      .eq('id', id)

    if (!error) {
      scheduledWorkouts.value = scheduledWorkouts.value.filter(s => s.id !== id)
    }
  }

  // Get workouts for a specific date
  function getForDate(date: string): ScheduledWorkout[] {
    return scheduledWorkouts.value.filter(s => s.scheduled_date === date)
  }

  // Get upcoming (not completed) workouts
  const upcoming = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return scheduledWorkouts.value.filter(
      s => s.scheduled_date >= today && !s.completed_session_id
    )
  })

  // Get missed (past, not completed) workouts
  const missed = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return scheduledWorkouts.value.filter(
      s => s.scheduled_date < today && !s.completed_session_id
    )
  })

  return {
    scheduledWorkouts: readonly(scheduledWorkouts),
    loading: readonly(loading),
    upcoming,
    missed,
    fetchSchedule,
    scheduleWorkout,
    markCompleted,
    deleteScheduled,
    getForDate,
  }
}
