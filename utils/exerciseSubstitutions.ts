/**
 * Exercise substitution engine
 * Finds alternative exercises matching the same primary muscle groups
 * but using different equipment
 */

import { EXERCISE_LIBRARY, type ExerciseDefinition } from '~/utils/exercises'
import type { MuscleGroup, Equipment } from '~/types/database'

export interface SubstitutionResult {
  exercise: ExerciseDefinition
  matchScore: number // 0-1, how well it matches the original
  matchedMuscles: string[]
  differentEquipment: boolean
}

export function findSubstitutions(
  exerciseName: string,
  availableEquipment?: Equipment[],
  limit: number = 5,
): SubstitutionResult[] {
  const original = EXERCISE_LIBRARY.find(e => e.name === exerciseName)
  if (!original) return []

  const results: SubstitutionResult[] = []

  for (const candidate of EXERCISE_LIBRARY) {
    // Skip the original exercise
    if (candidate.name === exerciseName) continue
    // Skip warmup/flexibility
    if (candidate.category !== original.category) continue

    // Calculate muscle group overlap
    const matchedMuscles = candidate.muscleGroups.filter(m =>
      original.muscleGroups.includes(m)
    )

    if (matchedMuscles.length === 0) continue

    // Score: ratio of matched muscles to total unique muscles
    const allMuscles = new Set([...original.muscleGroups, ...candidate.muscleGroups])
    const matchScore = matchedMuscles.length / allMuscles.size

    // Check if equipment differs
    const differentEquipment = !candidate.equipment.some(e =>
      original.equipment.includes(e)
    )

    // Filter by available equipment if specified
    if (availableEquipment && availableEquipment.length > 0) {
      const hasEquipment = candidate.equipment.some(e =>
        availableEquipment.includes(e)
      )
      if (!hasEquipment) continue
    }

    // Prefer similar compound/isolation status
    const compoundBonus = candidate.isCompound === original.isCompound ? 0.1 : 0

    results.push({
      exercise: candidate,
      matchScore: Math.min(matchScore + compoundBonus, 1),
      matchedMuscles,
      differentEquipment,
    })
  }

  // Sort by match score (highest first), then prefer different equipment
  return results
    .sort((a, b) => {
      const scoreDiff = b.matchScore - a.matchScore
      if (Math.abs(scoreDiff) > 0.01) return scoreDiff
      // Prefer different equipment as tie-breaker (for variety)
      return (b.differentEquipment ? 1 : 0) - (a.differentEquipment ? 1 : 0)
    })
    .slice(0, limit)
}
