import { describe, it, expect } from 'vitest'
import {
  calculate1RM,
  calculatePercentageWeight,
  roundToNearestPlate,
  calculatePlatesNeeded,
  calculateActualWeight,
  kgToLbs,
  lbsToKg,
  formatWeight,
  METRIC_PLATES,
  IMPERIAL_PLATES_IN_KG,
} from '~/utils/fitness'

describe('calculate1RM', () => {
  it('returns 0 for zero or negative weight', () => {
    expect(calculate1RM(0, 5)).toBe(0)
    expect(calculate1RM(-100, 5)).toBe(0)
  })

  it('returns 0 for zero or negative reps', () => {
    expect(calculate1RM(100, 0)).toBe(0)
    expect(calculate1RM(100, -1)).toBe(0)
  })

  it('returns the weight itself for 1 rep', () => {
    expect(calculate1RM(100, 1)).toBe(100)
    expect(calculate1RM(150, 1)).toBe(150)
  })

  it('calculates 1RM correctly using Epley formula', () => {
    // 100kg × (1 + 5/30) = 100 × 1.1667 = 116.67 ≈ 117
    expect(calculate1RM(100, 5)).toBe(117)

    // 80kg × (1 + 10/30) = 80 × 1.333 = 106.67 ≈ 107
    expect(calculate1RM(80, 10)).toBe(107)

    // 60kg × (1 + 15/30) = 60 × 1.5 = 90
    expect(calculate1RM(60, 15)).toBe(90)
  })
})

describe('calculatePercentageWeight', () => {
  it('calculates percentage weights correctly', () => {
    expect(calculatePercentageWeight(100, 100)).toBe(100)
    expect(calculatePercentageWeight(100, 90)).toBe(90)
    expect(calculatePercentageWeight(100, 85)).toBe(85)
    expect(calculatePercentageWeight(100, 75)).toBe(75)
  })

  it('rounds to nearest integer', () => {
    expect(calculatePercentageWeight(117, 85)).toBe(99) // 117 × 0.85 = 99.45
    expect(calculatePercentageWeight(117, 75)).toBe(88) // 117 × 0.75 = 87.75
  })
})

describe('roundToNearestPlate', () => {
  it('rounds to nearest 2.5 by default', () => {
    expect(roundToNearestPlate(101)).toBe(100)
    expect(roundToNearestPlate(102)).toBe(102.5)
    expect(roundToNearestPlate(103.5)).toBe(102.5)
  })

  it('rounds to custom increments', () => {
    expect(roundToNearestPlate(103, 5)).toBe(105)
    expect(roundToNearestPlate(101, 5)).toBe(100)
  })
})

describe('calculatePlatesNeeded', () => {
  it('returns empty array when target is less than or equal to bar weight', () => {
    expect(calculatePlatesNeeded(20, 20)).toEqual([])
    expect(calculatePlatesNeeded(15, 20)).toEqual([])
  })

  it('calculates plates for simple weights', () => {
    // 60kg total with 20kg bar = 40kg on plates = 20kg per side = 1x20kg
    const result = calculatePlatesNeeded(60, 20)
    expect(result).toHaveLength(1)
    expect(result[0].weight).toBe(20)
    expect(result[0].count).toBe(1)
  })

  it('calculates multiple plate sizes', () => {
    // 100kg total with 20kg bar = 80kg on plates = 40kg per side = 25kg + 15kg (uses largest first)
    const result = calculatePlatesNeeded(100, 20)
    expect(result.some(p => p.weight === 25 && p.count === 1)).toBe(true)
    expect(result.some(p => p.weight === 15 && p.count === 1)).toBe(true)
  })

  it('uses multiple of the same plate when needed', () => {
    // 140kg total with 20kg bar = 120kg on plates = 60kg per side = 25kg + 25kg + 10kg
    const result = calculatePlatesNeeded(140, 20)
    expect(result.find(p => p.weight === 25)?.count).toBe(2)
    expect(result.find(p => p.weight === 10)?.count).toBe(1)
  })

  it('works with imperial plates', () => {
    const result = calculatePlatesNeeded(100, 20, IMPERIAL_PLATES_IN_KG)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('calculateActualWeight', () => {
  it('calculates total weight correctly', () => {
    const plates = [
      { weight: 20, count: 1, color: 'bg-blue-500' },
      { weight: 10, count: 1, color: 'bg-green-500' },
    ]
    // 20kg bar + (20 + 10) × 2 = 20 + 60 = 80kg
    expect(calculateActualWeight(plates, 20)).toBe(80)
  })

  it('returns bar weight for empty plates', () => {
    expect(calculateActualWeight([], 20)).toBe(20)
  })
})

describe('weight conversions', () => {
  it('converts kg to lbs correctly', () => {
    expect(kgToLbs(100)).toBeCloseTo(220.5, 1)
    expect(kgToLbs(20)).toBeCloseTo(44.1, 1)
  })

  it('converts lbs to kg correctly', () => {
    expect(lbsToKg(220)).toBeCloseTo(99.77, 1)
    expect(lbsToKg(45)).toBeCloseTo(20.41, 1)
  })
})

describe('formatWeight', () => {
  it('formats metric weights correctly', () => {
    expect(formatWeight(100, true)).toBe('100kg')
    expect(formatWeight(20.5, true)).toBe('20.5kg')
  })

  it('formats imperial weights correctly', () => {
    expect(formatWeight(100, false)).toBe('220.5lb')
  })

  it('defaults to metric', () => {
    expect(formatWeight(100)).toBe('100kg')
  })
})

describe('plate constants', () => {
  it('metric plates are in descending order', () => {
    for (let i = 0; i < METRIC_PLATES.length - 1; i++) {
      expect(METRIC_PLATES[i]).toBeGreaterThan(METRIC_PLATES[i + 1])
    }
  })

  it('imperial plates are in descending order', () => {
    for (let i = 0; i < IMPERIAL_PLATES_IN_KG.length - 1; i++) {
      expect(IMPERIAL_PLATES_IN_KG[i]).toBeGreaterThan(IMPERIAL_PLATES_IN_KG[i + 1])
    }
  })
})
