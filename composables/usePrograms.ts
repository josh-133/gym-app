/**
 * Training programs composable
 * CRUD for multi-week periodized training programs
 */

import type { TrainingProgram, ProgramWeek, ProgramWorkout, UserActiveProgram } from '~/types/database'

export function usePrograms() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()

  const programs = useState<TrainingProgram[]>('trainingPrograms', () => [])
  const activeProgram = useState<UserActiveProgram | null>('activeProgram', () => null)
  const loading = ref(false)

  async function fetchPrograms() {
    if (!$supabase || !auth.user.value) return
    loading.value = true

    try {
      const { data, error } = await $supabase
        .from('training_programs')
        .select('*')
        .eq('user_id', auth.user.value.id)
        .order('created_at', { ascending: false })

      if (!error && data) programs.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchActiveProgram() {
    if (!$supabase || !auth.user.value) return

    const { data, error } = await $supabase
      .from('user_active_program')
      .select('*')
      .eq('user_id', auth.user.value.id)
      .single()

    if (!error && data) activeProgram.value = data
    else activeProgram.value = null
  }

  async function createProgram(input: {
    name: string
    description?: string
    duration_weeks: number
    difficulty?: string
    goal?: string
  }): Promise<TrainingProgram | null> {
    if (!$supabase || !auth.user.value) return null

    const { data, error } = await $supabase
      .from('training_programs')
      .insert({
        user_id: auth.user.value.id,
        name: input.name,
        description: input.description || null,
        duration_weeks: input.duration_weeks,
        difficulty: input.difficulty || null,
        goal: input.goal || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating program:', error)
      return null
    }

    programs.value.unshift(data)
    return data
  }

  async function deleteProgram(id: string) {
    if (!$supabase) return

    const { error } = await $supabase
      .from('training_programs')
      .delete()
      .eq('id', id)

    if (!error) {
      programs.value = programs.value.filter(p => p.id !== id)
      if (activeProgram.value?.program_id === id) {
        activeProgram.value = null
      }
    }
  }

  async function getProgramWeeks(programId: string): Promise<ProgramWeek[]> {
    if (!$supabase) return []

    const { data, error } = await $supabase
      .from('program_weeks')
      .select('*')
      .eq('program_id', programId)
      .order('week_number', { ascending: true })

    return error ? [] : (data || [])
  }

  async function addWeek(programId: string, weekNumber: number, options?: { name?: string; isDeload?: boolean }): Promise<ProgramWeek | null> {
    if (!$supabase) return null

    const { data, error } = await $supabase
      .from('program_weeks')
      .insert({
        program_id: programId,
        week_number: weekNumber,
        name: options?.name || `Week ${weekNumber}`,
        is_deload: options?.isDeload || false,
      })
      .select()
      .single()

    return error ? null : data
  }

  async function getWeekWorkouts(weekId: string): Promise<ProgramWorkout[]> {
    if (!$supabase) return []

    const { data, error } = await $supabase
      .from('program_workouts')
      .select('*')
      .eq('week_id', weekId)
      .order('order_index', { ascending: true })

    return error ? [] : (data || [])
  }

  async function addWorkoutToWeek(weekId: string, templateId: string, dayOfWeek: number, orderIndex: number): Promise<ProgramWorkout | null> {
    if (!$supabase) return null

    const { data, error } = await $supabase
      .from('program_workouts')
      .insert({
        week_id: weekId,
        template_id: templateId,
        day_of_week: dayOfWeek,
        order_index: orderIndex,
      })
      .select()
      .single()

    return error ? null : data
  }

  async function startProgram(programId: string) {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('user_active_program')
      .upsert({
        user_id: auth.user.value.id,
        program_id: programId,
        current_week: 1,
        current_workout_index: 0,
        started_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    await fetchActiveProgram()
  }

  async function advanceProgram() {
    if (!$supabase || !activeProgram.value) return

    const program = programs.value.find(p => p.id === activeProgram.value!.program_id)
    if (!program) return

    let nextWeek = activeProgram.value.current_week
    let nextIndex = activeProgram.value.current_workout_index + 1

    // Get workouts for current week to check if we need to advance week
    const weeks = await getProgramWeeks(program.id)
    const currentWeek = weeks.find(w => w.week_number === nextWeek)
    if (currentWeek) {
      const workouts = await getWeekWorkouts(currentWeek.id)
      if (nextIndex >= workouts.length) {
        nextWeek++
        nextIndex = 0
      }
    }

    // Check if program is complete
    if (nextWeek > program.duration_weeks) {
      await $supabase
        .from('user_active_program')
        .delete()
        .eq('user_id', auth.user.value!.id)
      activeProgram.value = null
      return
    }

    await $supabase
      .from('user_active_program')
      .update({
        current_week: nextWeek,
        current_workout_index: nextIndex,
      })
      .eq('user_id', auth.user.value!.id)

    await fetchActiveProgram()
  }

  async function stopProgram() {
    if (!$supabase || !auth.user.value) return

    await $supabase
      .from('user_active_program')
      .delete()
      .eq('user_id', auth.user.value.id)

    activeProgram.value = null
  }

  return {
    programs: readonly(programs),
    activeProgram: readonly(activeProgram),
    loading: readonly(loading),
    fetchPrograms,
    fetchActiveProgram,
    createProgram,
    deleteProgram,
    getProgramWeeks,
    addWeek,
    getWeekWorkouts,
    addWorkoutToWeek,
    startProgram,
    advanceProgram,
    stopProgram,
  }
}
