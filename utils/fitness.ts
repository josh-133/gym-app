/**
 * Fitness calculation utilities
 */

/**
 * Calculate estimated 1 Rep Max using the Epley formula
 * Formula: 1RM = weight × (1 + reps/30)
 * @param weight - The weight lifted
 * @param reps - Number of reps performed
 * @returns Estimated 1RM rounded to nearest integer
 */
export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

/**
 * Calculate weight at a given percentage of 1RM
 * @param oneRM - The estimated 1 rep max
 * @param percent - The percentage (0-100)
 * @returns Weight at that percentage
 */
export function calculatePercentageWeight(oneRM: number, percent: number): number {
  return Math.round((oneRM * percent) / 100)
}

/**
 * Round a weight to the nearest plate increment
 * @param value - The weight to round
 * @param nearest - The increment to round to (default 2.5)
 * @returns Rounded weight
 */
export function roundToNearestPlate(value: number, nearest: number = 2.5): number {
  return Math.round(value / nearest) * nearest
}

/**
 * Available plate sizes in kilograms (standard metric plates)
 */
export const METRIC_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const

/**
 * Available plate sizes in approximate kg (converted from imperial lbs)
 * 45lb, 25lb, 15lb, 10lb, 5lb, 2.5lb
 */
export const IMPERIAL_PLATES_IN_KG = [20.41, 11.34, 6.80, 4.54, 2.27, 1.13] as const

/**
 * Standard plate colors based on Olympic weightlifting standards
 */
export const PLATE_COLORS: Record<number, string> = {
  25: 'bg-red-500',
  20: 'bg-blue-500',
  15: 'bg-yellow-400',
  10: 'bg-green-500',
  5: 'bg-white border-2 border-gray-300',
  2.5: 'bg-red-300',
  1.25: 'bg-gray-400',
  // Imperial approximations
  20.41: 'bg-blue-500', // 45lb
  11.34: 'bg-green-500', // 25lb
  6.80: 'bg-yellow-400', // 15lb
  4.54: 'bg-white border-2 border-gray-300', // 10lb
  2.27: 'bg-gray-400', // 5lb
  1.13: 'bg-gray-300', // 2.5lb
}

export interface PlateInfo {
  weight: number
  count: number
  color: string
}

/**
 * Calculate the plates needed per side to reach a target weight
 * @param targetWeight - Total weight to load on the bar
 * @param barWeight - Weight of the bar
 * @param plates - Available plate sizes (largest to smallest)
 * @returns Array of plates needed per side
 */
export function calculatePlatesNeeded(
  targetWeight: number,
  barWeight: number,
  plates: readonly number[] = METRIC_PLATES
): PlateInfo[] {
  if (targetWeight <= barWeight) {
    return []
  }

  const weightPerSide = (targetWeight - barWeight) / 2
  const result: PlateInfo[] = []
  let remaining = weightPerSide

  for (const plate of plates) {
    const count = Math.floor(remaining / plate)
    if (count > 0) {
      result.push({
        weight: plate,
        count,
        color: PLATE_COLORS[plate] || 'bg-gray-500',
      })
      remaining -= count * plate
    }
  }

  return result
}

/**
 * Calculate the actual total weight loaded (may differ from target due to plate availability)
 * @param plates - Array of plates loaded per side
 * @param barWeight - Weight of the bar
 * @returns Total weight on the bar
 */
export function calculateActualWeight(plates: PlateInfo[], barWeight: number): number {
  const platesWeight = plates.reduce((sum, p) => sum + p.weight * p.count * 2, 0)
  return Math.round((barWeight + platesWeight) * 100) / 100
}

/**
 * Convert kilograms to pounds
 * @param kg - Weight in kilograms
 * @returns Weight in pounds (rounded to 1 decimal)
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.205 * 10) / 10
}

/**
 * Convert pounds to kilograms
 * @param lbs - Weight in pounds
 * @returns Weight in kilograms (rounded to 2 decimals)
 */
export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.205) * 100) / 100
}

/**
 * Format a weight with units
 * @param kg - Weight in kilograms
 * @param useMetric - Whether to display in metric (kg) or imperial (lbs)
 * @returns Formatted weight string
 */
export function formatWeight(kg: number, useMetric: boolean = true): string {
  if (useMetric) {
    return `${kg}kg`
  }
  return `${kgToLbs(kg)}lb`
}

/**
 * Standard training percentages with expected rep ranges
 */
export const TRAINING_PERCENTAGES = [
  { percent: 100, description: '1RM (max single)' },
  { percent: 95, description: '~2 reps' },
  { percent: 90, description: '~3-4 reps' },
  { percent: 85, description: '~5-6 reps' },
  { percent: 80, description: '~7-8 reps' },
  { percent: 75, description: '~10 reps' },
  { percent: 70, description: '~12 reps' },
  { percent: 65, description: '~15 reps' },
  { percent: 60, description: '~20 reps' },
] as const
