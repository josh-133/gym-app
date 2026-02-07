export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export interface NutritionGoals {
  id: string
  user_id: string
  daily_calories: number
  daily_protein_g: number
  daily_carbs_g: number
  daily_fat_g: number
  created_at: string
  updated_at: string
}

export interface FoodEntry {
  id: string
  user_id: string
  logged_at: string
  meal_type: MealType
  food_name: string
  brand: string | null
  barcode: string | null
  open_food_facts_id: string | null
  serving_size_g: number
  servings: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sugar_g: number | null
  is_custom: boolean
  custom_food_id: string | null
  notes: string | null
  created_at: string
}

export interface CreateFoodEntryInput {
  logged_at?: string
  meal_type: MealType
  food_name: string
  brand?: string | null
  barcode?: string | null
  open_food_facts_id?: string | null
  serving_size_g: number
  servings?: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number | null
  sugar_g?: number | null
  is_custom?: boolean
  custom_food_id?: string | null
  notes?: string | null
}

export interface DailyTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
}

export interface MealTotals {
  meal_type: MealType
  entries: FoodEntry[]
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export function useNutrition() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  // State
  const nutritionGoals = useState<NutritionGoals | null>('nutritionGoals', () => null)
  const foodEntries = useState<FoodEntry[]>('foodEntries', () => [])
  const selectedDate = useState<string>('nutritionSelectedDate', () => {
    return new Date().toISOString().split('T')[0]
  })
  const loading = useState('nutritionLoading', () => false)
  const goalsLoading = useState('nutritionGoalsLoading', () => false)

  // Fetch nutrition goals
  async function fetchNutritionGoals() {
    if (!$supabase || !user.value) {
      goalsLoading.value = false
      return
    }

    goalsLoading.value = true
    try {
      const { data, error } = await $supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.value.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No goals set yet - this is fine
          nutritionGoals.value = null
          return
        }
        if (error.code === '42P01') {
          console.warn('Nutrition goals table not found')
          nutritionGoals.value = null
          return
        }
        throw error
      }
      nutritionGoals.value = data
    } catch (err: any) {
      if (err?.status === 404 || err?.code === '42P01') {
        console.warn('Nutrition goals table not found')
        nutritionGoals.value = null
        return
      }
      console.error('Error fetching nutrition goals:', err)
    } finally {
      goalsLoading.value = false
    }
  }

  // Save or update nutrition goals
  async function saveNutritionGoals(goals: {
    daily_calories: number
    daily_protein_g: number
    daily_carbs_g: number
    daily_fat_g: number
  }) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    // Check if goals already exist
    if (nutritionGoals.value?.id) {
      // Update existing goals
      const { data, error } = await $supabase
        .from('nutrition_goals')
        .update({
          daily_calories: goals.daily_calories,
          daily_protein_g: goals.daily_protein_g,
          daily_carbs_g: goals.daily_carbs_g,
          daily_fat_g: goals.daily_fat_g,
          updated_at: new Date().toISOString(),
        })
        .eq('id', nutritionGoals.value.id)
        .eq('user_id', user.value.id)
        .select()
        .single()

      if (error) throw error

      nutritionGoals.value = data
      return data
    } else {
      // Insert new goals
      const { data, error } = await $supabase
        .from('nutrition_goals')
        .insert({
          user_id: user.value.id,
          daily_calories: goals.daily_calories,
          daily_protein_g: goals.daily_protein_g,
          daily_carbs_g: goals.daily_carbs_g,
          daily_fat_g: goals.daily_fat_g,
        })
        .select()
        .single()

      if (error) throw error

      nutritionGoals.value = data
      return data
    }
  }

  // Fetch food entries for a specific date
  async function fetchFoodEntries(date?: string) {
    if (!$supabase || !user.value) {
      loading.value = false
      return
    }

    const targetDate = date || selectedDate.value
    loading.value = true

    try {
      // Get start and end of day in user's timezone
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error } = await $supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.value.id)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString())
        .order('logged_at', { ascending: true })

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('Food entries table not found')
          foodEntries.value = []
          return
        }
        throw error
      }
      foodEntries.value = data || []
    } catch (err: any) {
      if (err?.status === 404 || err?.code === '42P01') {
        console.warn('Food entries table not found')
        foodEntries.value = []
        return
      }
      console.error('Error fetching food entries:', err)
    } finally {
      loading.value = false
    }
  }

  // Add a food entry
  async function addFoodEntry(input: CreateFoodEntryInput) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('food_entries')
      .insert({
        user_id: user.value.id,
        logged_at: input.logged_at || new Date().toISOString(),
        meal_type: input.meal_type,
        food_name: input.food_name,
        brand: input.brand || null,
        barcode: input.barcode || null,
        open_food_facts_id: input.open_food_facts_id || null,
        serving_size_g: input.serving_size_g,
        servings: input.servings || 1,
        calories: input.calories,
        protein_g: input.protein_g,
        carbs_g: input.carbs_g,
        fat_g: input.fat_g,
        fiber_g: input.fiber_g || null,
        sugar_g: input.sugar_g || null,
        is_custom: input.is_custom || false,
        custom_food_id: input.custom_food_id || null,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) throw error

    // Add to local state if it's for the selected date
    const entryDate = new Date(data.logged_at).toISOString().split('T')[0]
    if (entryDate === selectedDate.value) {
      foodEntries.value = [...foodEntries.value, data].sort(
        (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
      )
    }

    return data
  }

  // Get a single food entry by ID
  async function getFoodEntryById(id: string): Promise<FoodEntry | null> {
    if (!$supabase || !user.value) return null

    const { data, error } = await $supabase
      .from('food_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.value.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw error
    }

    return data
  }

  // Update a food entry
  async function updateFoodEntry(id: string, updates: Partial<CreateFoodEntryInput>) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('food_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.value.id)
      .select()
      .single()

    if (error) throw error

    const index = foodEntries.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      foodEntries.value[index] = data
    }
    return data
  }

  // Delete a food entry
  async function deleteFoodEntry(id: string) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { error } = await $supabase
      .from('food_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id)

    if (error) throw error

    foodEntries.value = foodEntries.value.filter((e) => e.id !== id)
  }

  // Navigate to previous/next day
  function goToPreviousDay() {
    const date = new Date(selectedDate.value)
    date.setDate(date.getDate() - 1)
    selectedDate.value = date.toISOString().split('T')[0]
    fetchFoodEntries()
  }

  function goToNextDay() {
    const date = new Date(selectedDate.value)
    date.setDate(date.getDate() + 1)
    selectedDate.value = date.toISOString().split('T')[0]
    fetchFoodEntries()
  }

  function goToToday() {
    selectedDate.value = new Date().toISOString().split('T')[0]
    fetchFoodEntries()
  }

  function setDate(date: string) {
    selectedDate.value = date
    fetchFoodEntries()
  }

  // Computed: Daily totals
  const dailyTotals = computed<DailyTotals>(() => {
    return foodEntries.value.reduce(
      (totals, entry) => {
        totals.calories += Number(entry.calories) || 0
        totals.protein_g += Number(entry.protein_g) || 0
        totals.carbs_g += Number(entry.carbs_g) || 0
        totals.fat_g += Number(entry.fat_g) || 0
        totals.fiber_g += Number(entry.fiber_g) || 0
        totals.sugar_g += Number(entry.sugar_g) || 0
        return totals
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0 }
    )
  })

  // Computed: Entries grouped by meal
  const mealGroups = computed<MealTotals[]>(() => {
    const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks']

    return meals.map((mealType) => {
      const entries = foodEntries.value.filter((e) => e.meal_type === mealType)
      return {
        meal_type: mealType,
        entries,
        calories: entries.reduce((sum, e) => sum + (Number(e.calories) || 0), 0),
        protein_g: entries.reduce((sum, e) => sum + (Number(e.protein_g) || 0), 0),
        carbs_g: entries.reduce((sum, e) => sum + (Number(e.carbs_g) || 0), 0),
        fat_g: entries.reduce((sum, e) => sum + (Number(e.fat_g) || 0), 0),
      }
    })
  })

  // Computed: Progress percentages
  const calorieProgress = computed(() => {
    if (!nutritionGoals.value || !nutritionGoals.value.daily_calories) return 0
    return Math.min(Math.round((dailyTotals.value.calories / nutritionGoals.value.daily_calories) * 100), 100)
  })

  const proteinProgress = computed(() => {
    if (!nutritionGoals.value || !nutritionGoals.value.daily_protein_g) return 0
    return Math.min(Math.round((dailyTotals.value.protein_g / nutritionGoals.value.daily_protein_g) * 100), 100)
  })

  const carbsProgress = computed(() => {
    if (!nutritionGoals.value || !nutritionGoals.value.daily_carbs_g) return 0
    return Math.min(Math.round((dailyTotals.value.carbs_g / nutritionGoals.value.daily_carbs_g) * 100), 100)
  })

  const fatProgress = computed(() => {
    if (!nutritionGoals.value || !nutritionGoals.value.daily_fat_g) return 0
    return Math.min(Math.round((dailyTotals.value.fat_g / nutritionGoals.value.daily_fat_g) * 100), 100)
  })

  // Computed: Remaining calories/macros
  const remaining = computed(() => {
    if (!nutritionGoals.value) {
      return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    }
    return {
      calories: Math.max(0, nutritionGoals.value.daily_calories - dailyTotals.value.calories),
      protein_g: Math.max(0, nutritionGoals.value.daily_protein_g - dailyTotals.value.protein_g),
      carbs_g: Math.max(0, nutritionGoals.value.daily_carbs_g - dailyTotals.value.carbs_g),
      fat_g: Math.max(0, nutritionGoals.value.daily_fat_g - dailyTotals.value.fat_g),
    }
  })

  // Check if selected date is today
  const isToday = computed(() => {
    return selectedDate.value === new Date().toISOString().split('T')[0]
  })

  // Format selected date for display
  const formattedDate = computed(() => {
    const date = new Date(selectedDate.value)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (selectedDate.value === today.toISOString().split('T')[0]) {
      return 'Today'
    }
    if (selectedDate.value === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  })

  // Get meal display info
  function getMealInfo(mealType: MealType) {
    switch (mealType) {
      case 'breakfast':
        return { label: 'Breakfast', icon: '🌅' }
      case 'lunch':
        return { label: 'Lunch', icon: '🌞' }
      case 'dinner':
        return { label: 'Dinner', icon: '🌙' }
      case 'snacks':
        return { label: 'Snacks', icon: '🍎' }
      default:
        return { label: mealType, icon: '🍽️' }
    }
  }

  return {
    // State
    nutritionGoals,
    foodEntries,
    selectedDate,
    loading,
    goalsLoading,

    // Actions
    fetchNutritionGoals,
    saveNutritionGoals,
    fetchFoodEntries,
    getFoodEntryById,
    addFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    setDate,

    // Computed
    dailyTotals,
    mealGroups,
    calorieProgress,
    proteinProgress,
    carbsProgress,
    fatProgress,
    remaining,
    isToday,
    formattedDate,

    // Helpers
    getMealInfo,
  }
}
