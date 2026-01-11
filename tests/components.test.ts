import { describe, it, expect } from 'vitest'
import {
  calculate1RM,
  calculatePlatesNeeded,
  METRIC_PLATES,
  TRAINING_PERCENTAGES,
} from '~/utils/fitness'
import { formatTime } from '~/utils/time'

/**
 * Component logic tests
 *
 * These tests verify the business logic used by Vue components
 * without requiring a full component mount (which would need additional setup).
 * The actual utilities are extracted to ~/utils/ for testability.
 */

describe('OneRMCalculator component logic', () => {
  it('calculates 1RM for typical bench press', () => {
    // User lifts 100kg for 5 reps
    const oneRM = calculate1RM(100, 5)
    expect(oneRM).toBe(117) // 100 × (1 + 5/30) = 116.67 ≈ 117
  })

  it('provides correct training percentages', () => {
    expect(TRAINING_PERCENTAGES).toHaveLength(9)
    expect(TRAINING_PERCENTAGES[0]).toEqual({
      percent: 100,
      description: '1RM (max single)',
    })
    expect(TRAINING_PERCENTAGES[4]).toEqual({
      percent: 80,
      description: '~7-8 reps',
    })
  })

  it('handles edge case of very high reps', () => {
    // High rep sets (20 reps)
    const oneRM = calculate1RM(50, 20)
    expect(oneRM).toBe(83) // 50 × (1 + 20/30) = 83.33 ≈ 83
  })
})

describe('PlateCalculator component logic', () => {
  it('calculates standard bench press setup', () => {
    // 60kg with 20kg bar = 40kg plates = 20kg per side
    const plates = calculatePlatesNeeded(60, 20, METRIC_PLATES)
    expect(plates).toHaveLength(1)
    expect(plates[0].weight).toBe(20)
    expect(plates[0].count).toBe(1)
  })

  it('handles Olympic weightlifting weights', () => {
    // 140kg snatch with 20kg bar = 60kg per side = 25+25+10
    const plates = calculatePlatesNeeded(140, 20, METRIC_PLATES)
    const plate25 = plates.find(p => p.weight === 25)
    const plate10 = plates.find(p => p.weight === 10)

    expect(plate25?.count).toBe(2)
    expect(plate10?.count).toBe(1)
  })

  it('handles smaller plates for precise weights', () => {
    // 45kg with 20kg bar = 25kg plates = 12.5kg per side = 10 + 2.5
    const plates = calculatePlatesNeeded(45, 20, METRIC_PLATES)
    expect(plates.some(p => p.weight === 10 && p.count === 1)).toBe(true)
    expect(plates.some(p => p.weight === 2.5 && p.count === 1)).toBe(true)
  })

  it('returns empty for bar-only lifts', () => {
    const plates = calculatePlatesNeeded(20, 20, METRIC_PLATES)
    expect(plates).toHaveLength(0)
  })
})

describe('RestTimer component logic', () => {
  it('formats short rest times correctly', () => {
    expect(formatTime(30)).toBe('0:30')
    expect(formatTime(45)).toBe('0:45')
  })

  it('formats standard rest times correctly', () => {
    expect(formatTime(60)).toBe('1:00')
    expect(formatTime(90)).toBe('1:30')
    expect(formatTime(120)).toBe('2:00')
    expect(formatTime(180)).toBe('3:00')
  })

  it('formats long rest times correctly', () => {
    expect(formatTime(300)).toBe('5:00') // 5 minutes
    expect(formatTime(600)).toBe('10:00') // 10 minutes
  })

  it('handles edge cases', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(599)).toBe('9:59')
  })
})

describe('Strength Progress component logic', () => {
  it('calculates estimated 1RM from workout data', () => {
    // Simulating the progress calculation logic
    const workoutSets = [
      { weight: 100, reps: 5, completed: true },
      { weight: 95, reps: 8, completed: true },
      { weight: 90, reps: 10, completed: true },
    ]

    // Find best set (highest weight with most reps at that weight)
    const bestSet = workoutSets.reduce((best, set) => {
      if (!set.completed) return best
      if (set.weight > best.weight) return set
      if (set.weight === best.weight && set.reps > best.reps) return set
      return best
    }, { weight: 0, reps: 0, completed: false })

    expect(bestSet.weight).toBe(100)
    expect(bestSet.reps).toBe(5)

    const estimated1RM = calculate1RM(bestSet.weight, bestSet.reps)
    expect(estimated1RM).toBe(117)
  })
})
