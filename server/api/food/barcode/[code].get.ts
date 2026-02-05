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

interface OpenFoodFactsBarcodeResponse {
  code: string
  status: number
  status_verbose: string
  product?: OpenFoodFactsProduct
}

export default defineEventHandler(async (event) => {
  const barcode = getRouterParam(event, 'code')

  if (!barcode) {
    throw createError({
      statusCode: 400,
      message: 'Barcode is required',
    })
  }

  // Validate barcode format (UPC-A: 12, UPC-E: 8, EAN-13: 13, EAN-8: 8)
  // Allow 8-14 digits to cover most formats including ISBN
  if (!/^\d{8,14}$/.test(barcode)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid barcode format. Expected 8-14 digits.',
    })
  }

  try {
    const response = await $fetch<OpenFoodFactsBarcodeResponse>(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}`,
      {
        params: {
          fields: 'code,product_name,brands,nutriments,image_url,serving_size',
        },
        headers: {
          'User-Agent': 'GymApp/1.0 (https://github.com/gym-app)',
        },
      }
    )

    if (response.status !== 1 || !response.product) {
      throw createError({
        statusCode: 404,
        message: 'Product not found',
      })
    }

    const p = response.product

    if (!p.product_name || !p.nutriments) {
      throw createError({
        statusCode: 404,
        message: 'Product data incomplete',
      })
    }

    return {
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
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Open Food Facts barcode lookup error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to lookup barcode',
    })
  }
})

// Parse serving size string to grams
function parseServingSize(servingSize?: string): number | null {
  if (!servingSize) return null

  const gramsMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?/i)
  if (gramsMatch) {
    return parseFloat(gramsMatch[1])
  }

  const mlMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*ml/i)
  if (mlMatch) {
    return parseFloat(mlMatch[1])
  }

  return null
}
