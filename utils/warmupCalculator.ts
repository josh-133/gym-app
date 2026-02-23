/**
 * Warm-up set calculator
 * Generates progressive warm-up sets ramping to working weight
 */

export interface WarmupSet {
  weight: number
  reps: number
  percentage: number
}

export function generateWarmupSets(
  targetWeight: number,
  barWeight: number = 20,
): WarmupSet[] {
  if (targetWeight <= 0) return []

  const warmups: WarmupSet[] = []

  if (targetWeight <= barWeight) {
    // Very light weight — just one light warmup
    warmups.push({
      weight: Math.round((targetWeight * 0.5) / 2.5) * 2.5 || 5,
      reps: 10,
      percentage: 50,
    })
    return warmups
  }

  if (targetWeight <= barWeight * 1.5) {
    // Light weight — bar + one step
    warmups.push({ weight: barWeight, reps: 10, percentage: Math.round((barWeight / targetWeight) * 100) })
    return warmups
  }

  // Standard progression: bar → 50% → 70% → 85%
  const steps = [
    { pct: 0, reps: 10 },    // Empty bar
    { pct: 0.5, reps: 8 },   // 50%
    { pct: 0.7, reps: 5 },   // 70%
    { pct: 0.85, reps: 3 },  // 85%
  ]

  for (const step of steps) {
    const raw = step.pct === 0 ? barWeight : targetWeight * step.pct
    const rounded = Math.round(raw / 2.5) * 2.5 // Round to nearest 2.5kg

    // Skip if weight is less than bar or duplicate of previous
    if (rounded < barWeight) continue
    if (warmups.length > 0 && warmups[warmups.length - 1].weight >= rounded) continue
    // Skip if too close to target
    if (rounded >= targetWeight) continue

    warmups.push({
      weight: rounded,
      reps: step.reps,
      percentage: Math.round((rounded / targetWeight) * 100),
    })
  }

  return warmups
}
