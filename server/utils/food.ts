/**
 * Parse serving size string to grams
 * Extracts numeric value from strings like "100g", "30 g", "1 serving (50g)", or "250ml"
 */
export function parseServingSize(servingSize?: string): number | null {
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
