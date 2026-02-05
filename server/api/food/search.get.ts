interface OpenFoodFactsProduct {
  code: string
  product_name: string
  brands?: string
  nutriments: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    sugars_100g?: number
  }
  image_url?: string
  serving_size?: string
}

interface OpenFoodFactsResponse {
  count: number
  page: number
  page_size: number
  products: OpenFoodFactsProduct[]
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = query.q as string

  if (!searchQuery || searchQuery.length < 2) {
    return []
  }

  try {
    const response = await $fetch<OpenFoodFactsResponse>(
      'https://world.openfoodfacts.org/cgi/search.pl',
      {
        params: {
          search_terms: searchQuery,
          search_simple: 1,
          action: 'process',
          json: true,
          page_size: 20,
          fields: 'code,product_name,brands,nutriments,image_url,serving_size',
        },
        headers: {
          'User-Agent': 'GymApp/1.0 (https://github.com/gym-app)',
        },
      }
    )

    // Transform to our format and filter out products without required data
    return (response.products || [])
      .filter((p) => {
        // Must have a name and calorie information
        return (
          p.product_name &&
          p.nutriments &&
          (p.nutriments['energy-kcal_100g'] !== undefined || p.nutriments['energy-kcal_100g'] !== null)
        )
      })
      .map((p) => ({
        id: p.code,
        name: p.product_name,
        brand: p.brands || null,
        barcode: p.code,
        calories_per_100g: Math.round(p.nutriments['energy-kcal_100g'] || 0),
        protein_per_100g: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
        carbs_per_100g: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
        fat_per_100g: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
        fiber_per_100g: p.nutriments.fiber_100g
          ? Math.round(p.nutriments.fiber_100g * 10) / 10
          : null,
        sugar_per_100g: p.nutriments.sugars_100g
          ? Math.round(p.nutriments.sugars_100g * 10) / 10
          : null,
        serving_size_g: parseServingSize(p.serving_size) || 100,
        image_url: p.image_url || null,
      }))
  } catch (error: any) {
    console.error('Open Food Facts API error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to search foods',
    })
  }
})

// Parse serving size string to grams
function parseServingSize(servingSize?: string): number | null {
  if (!servingSize) return null

  // Try to extract grams from string like "100g", "30 g", "1 serving (50g)"
  const gramsMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?/i)
  if (gramsMatch) {
    return parseFloat(gramsMatch[1])
  }

  // Try to extract ml (assume 1ml = 1g for liquids)
  const mlMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*ml/i)
  if (mlMatch) {
    return parseFloat(mlMatch[1])
  }

  return null
}
