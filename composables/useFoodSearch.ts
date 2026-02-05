export interface FoodSearchResult {
  id: string
  name: string
  brand: string | null
  barcode: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number | null
  sugar_per_100g: number | null
  serving_size_g: number
  image_url: string | null
}

export interface CustomFood {
  id: string
  user_id: string
  food_name: string
  brand: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number | null
  sugar_per_100g: number | null
  default_serving_size_g: number
  default_serving_description: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface CreateCustomFoodInput {
  food_name: string
  brand?: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number | null
  sugar_per_100g?: number | null
  default_serving_size_g?: number
  default_serving_description?: string | null
  is_favorite?: boolean
}

export function useFoodSearch() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  // State
  const searchResults = useState<FoodSearchResult[]>('foodSearchResults', () => [])
  const customFoods = useState<CustomFood[]>('customFoods', () => [])
  const recentFoods = useState<FoodSearchResult[]>('recentFoods', () => [])
  const searching = useState('foodSearching', () => false)
  const searchError = useState<string | null>('foodSearchError', () => null)

  // Debounce timer
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  // Search Open Food Facts API via server route
  async function searchFoods(query: string) {
    if (!query || query.length < 2) {
      searchResults.value = []
      return
    }

    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    searchTimeout = setTimeout(async () => {
      searching.value = true
      searchError.value = null

      try {
        const data = await $fetch<FoodSearchResult[]>('/api/food/search', {
          params: { q: query },
        })

        searchResults.value = data || []
      } catch (err: any) {
        console.error('Error searching foods:', err)
        searchError.value = err?.message || 'Failed to search foods'
        searchResults.value = []
      } finally {
        searching.value = false
      }
    }, 300)
  }

  // Search by barcode
  async function searchByBarcode(barcode: string) {
    if (!barcode) return null

    searching.value = true
    searchError.value = null

    try {
      const data = await $fetch<FoodSearchResult>(`/api/food/barcode/${barcode}`)
      return data
    } catch (err: any) {
      console.error('Error searching by barcode:', err)
      searchError.value = err?.message || 'Food not found'
      return null
    } finally {
      searching.value = false
    }
  }

  // Clear search results
  function clearSearch() {
    searchResults.value = []
    searchError.value = null
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  }

  // Fetch user's custom foods
  async function fetchCustomFoods() {
    if (!$supabase || !user.value) return

    try {
      const { data, error } = await $supabase
        .from('custom_foods')
        .select('*')
        .eq('user_id', user.value.id)
        .order('is_favorite', { ascending: false })
        .order('food_name', { ascending: true })

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('Custom foods table not found')
          customFoods.value = []
          return
        }
        throw error
      }
      customFoods.value = data || []
    } catch (err: any) {
      if (err?.status === 404 || err?.code === '42P01') {
        console.warn('Custom foods table not found')
        customFoods.value = []
        return
      }
      console.error('Error fetching custom foods:', err)
    }
  }

  // Create a custom food
  async function createCustomFood(input: CreateCustomFoodInput) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('custom_foods')
      .insert({
        user_id: user.value.id,
        food_name: input.food_name,
        brand: input.brand || null,
        calories_per_100g: input.calories_per_100g,
        protein_per_100g: input.protein_per_100g,
        carbs_per_100g: input.carbs_per_100g,
        fat_per_100g: input.fat_per_100g,
        fiber_per_100g: input.fiber_per_100g || null,
        sugar_per_100g: input.sugar_per_100g || null,
        default_serving_size_g: input.default_serving_size_g || 100,
        default_serving_description: input.default_serving_description || null,
        is_favorite: input.is_favorite || false,
      })
      .select()
      .single()

    if (error) throw error

    customFoods.value = [data, ...customFoods.value]
    return data
  }

  // Update a custom food
  async function updateCustomFood(id: string, updates: Partial<CreateCustomFoodInput>) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('custom_foods')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.value.id)
      .select()
      .single()

    if (error) throw error

    const index = customFoods.value.findIndex((f) => f.id === id)
    if (index !== -1) {
      customFoods.value[index] = data
    }
    return data
  }

  // Delete a custom food
  async function deleteCustomFood(id: string) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { error } = await $supabase
      .from('custom_foods')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id)

    if (error) throw error

    customFoods.value = customFoods.value.filter((f) => f.id !== id)
  }

  // Toggle favorite status
  async function toggleFavorite(id: string) {
    const food = customFoods.value.find((f) => f.id === id)
    if (!food) return

    return updateCustomFood(id, { is_favorite: !food.is_favorite })
  }

  // Get recent foods from food entries
  async function fetchRecentFoods() {
    if (!$supabase || !user.value) return

    try {
      const { data, error } = await $supabase
        .from('food_entries')
        .select('food_name, brand, barcode, serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          recentFoods.value = []
          return
        }
        throw error
      }

      // Deduplicate by food name and brand
      const seen = new Set<string>()
      const unique: FoodSearchResult[] = []

      for (const entry of data || []) {
        const key = `${entry.food_name}|${entry.brand || ''}`
        if (!seen.has(key)) {
          seen.add(key)
          unique.push({
            id: key,
            name: entry.food_name,
            brand: entry.brand,
            barcode: entry.barcode,
            // Calculate per 100g from entry values
            calories_per_100g: (Number(entry.calories) / Number(entry.serving_size_g)) * 100,
            protein_per_100g: (Number(entry.protein_g) / Number(entry.serving_size_g)) * 100,
            carbs_per_100g: (Number(entry.carbs_g) / Number(entry.serving_size_g)) * 100,
            fat_per_100g: (Number(entry.fat_g) / Number(entry.serving_size_g)) * 100,
            fiber_per_100g: entry.fiber_g ? (Number(entry.fiber_g) / Number(entry.serving_size_g)) * 100 : null,
            sugar_per_100g: entry.sugar_g ? (Number(entry.sugar_g) / Number(entry.serving_size_g)) * 100 : null,
            serving_size_g: Number(entry.serving_size_g),
            image_url: null,
          })
        }
        if (unique.length >= 20) break
      }

      recentFoods.value = unique
    } catch (err: any) {
      if (err?.status === 404 || err?.code === '42P01') {
        recentFoods.value = []
        return
      }
      console.error('Error fetching recent foods:', err)
    }
  }

  // Convert custom food to search result format
  function customFoodToSearchResult(food: CustomFood): FoodSearchResult {
    return {
      id: food.id,
      name: food.food_name,
      brand: food.brand,
      barcode: null,
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fat_per_100g: food.fat_per_100g,
      fiber_per_100g: food.fiber_per_100g,
      sugar_per_100g: food.sugar_per_100g,
      serving_size_g: food.default_serving_size_g,
      image_url: null,
    }
  }

  // Computed: Favorite custom foods
  const favoriteFoods = computed(() => {
    return customFoods.value.filter((f) => f.is_favorite)
  })

  // Calculate nutrition for a serving
  function calculateNutrition(food: FoodSearchResult, servingSizeG: number, servings: number = 1) {
    const multiplier = (servingSizeG * servings) / 100
    return {
      calories: Math.round(food.calories_per_100g * multiplier),
      protein_g: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs_g: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fat_g: Math.round(food.fat_per_100g * multiplier * 10) / 10,
      fiber_g: food.fiber_per_100g ? Math.round(food.fiber_per_100g * multiplier * 10) / 10 : null,
      sugar_g: food.sugar_per_100g ? Math.round(food.sugar_per_100g * multiplier * 10) / 10 : null,
    }
  }

  return {
    // State
    searchResults,
    customFoods,
    recentFoods,
    searching,
    searchError,

    // Search actions
    searchFoods,
    searchByBarcode,
    clearSearch,

    // Custom foods actions
    fetchCustomFoods,
    createCustomFood,
    updateCustomFood,
    deleteCustomFood,
    toggleFavorite,

    // Recent foods
    fetchRecentFoods,

    // Helpers
    customFoodToSearchResult,
    favoriteFoods,
    calculateNutrition,
  }
}
