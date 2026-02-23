/**
 * Calorie estimator for strength training
 * Uses MET-based formula: calories = MET × weight_kg × duration_hours
 *
 * MET values for weight training:
 * - Light effort (warm-up, easy sets): 3.5
 * - Moderate effort (standard training): 5.0
 * - Vigorous effort (heavy compounds, circuits): 6.0
 * - Very vigorous (intense supersets, CrossFit-style): 8.0
 */

interface CalorieEstimateInput {
  durationSec: number
  bodyWeightKg: number
  totalVolume: number
  totalSets: number
  avgRPE?: number | null
}

export function estimateStrengthCalories(input: CalorieEstimateInput): number {
  const { durationSec, bodyWeightKg, totalVolume, totalSets, avgRPE } = input

  if (durationSec <= 0 || bodyWeightKg <= 0) return 0

  const durationHours = durationSec / 3600

  // Estimate intensity using RPE if available, otherwise use volume/set ratio
  let met: number
  if (avgRPE != null && avgRPE > 0) {
    // RPE-based MET estimation
    if (avgRPE >= 9) met = 7.0
    else if (avgRPE >= 7) met = 5.5
    else if (avgRPE >= 5) met = 4.5
    else met = 3.5
  } else {
    // Volume-based estimation: volume per set as intensity proxy
    const volumePerSet = totalSets > 0 ? totalVolume / totalSets : 0
    if (volumePerSet > 500) met = 6.0        // Heavy compounds
    else if (volumePerSet > 200) met = 5.0    // Moderate training
    else if (volumePerSet > 50) met = 4.0     // Light accessories
    else met = 3.5                             // Very light / warmup
  }

  // Formula: calories = MET × body_weight_kg × duration_hours
  const calories = met * bodyWeightKg * durationHours

  return Math.round(calories)
}
