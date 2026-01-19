import type { MuscleGroup, Equipment, ExerciseCategory, ExerciseDefinition } from '~/utils/exercises'

export interface CustomExercise {
  id: string
  user_id: string
  name: string
  category: ExerciseCategory
  muscle_groups: MuscleGroup[]
  equipment: Equipment[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_compound: boolean
  created_at: string
}

export function useCustomExercises() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  const customExercises = useState<CustomExercise[]>('customExercises', () => [])
  const loading = useState('customExercisesLoading', () => false)

  async function fetchCustomExercises() {
    if (!$supabase || !user.value) return

    loading.value = true
    try {
      const { data, error } = await $supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.value.id)
        .eq('is_system', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      customExercises.value = data || []
    } catch (err) {
      console.error('Error fetching custom exercises:', err)
    } finally {
      loading.value = false
    }
  }

  async function addCustomExercise(exercise: {
    name: string
    category: ExerciseCategory
    muscleGroups: MuscleGroup[]
    equipment: Equipment[]
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    isCompound: boolean
  }) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('exercises')
      .insert({
        user_id: user.value.id,
        name: exercise.name,
        category: exercise.category,
        muscle_groups: exercise.muscleGroups,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        is_compound: exercise.isCompound,
        is_system: false,
      })
      .select()
      .single()

    if (error) throw error

    customExercises.value = [data, ...customExercises.value]
    return data
  }

  async function deleteCustomExercise(id: string) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { error } = await $supabase
      .from('exercises')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id)

    if (error) throw error

    customExercises.value = customExercises.value.filter((e) => e.id !== id)
  }

  // Convert custom exercises to ExerciseDefinition format for compatibility
  function toExerciseDefinition(custom: CustomExercise): ExerciseDefinition {
    return {
      id: custom.id,
      name: custom.name,
      category: custom.category,
      muscleGroups: custom.muscle_groups,
      equipment: custom.equipment,
      difficulty: custom.difficulty,
      isCompound: custom.is_compound,
    }
  }

  const customExercisesAsDefinitions = computed(() => customExercises.value.map(toExerciseDefinition))

  return {
    customExercises,
    customExercisesAsDefinitions,
    loading,
    fetchCustomExercises,
    addCustomExercise,
    deleteCustomExercise,
  }
}
