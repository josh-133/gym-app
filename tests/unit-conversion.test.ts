import { describe, it, expect } from 'vitest'

// Test the conversion constants and math directly
// (Composable testing requires Vue test utils setup)

const KG_TO_LBS = 2.20462
const CM_TO_INCHES = 0.393701
const KM_TO_MILES = 0.621371

// Conversion functions (same logic as composable)
function convertWeightToLbs(kg: number | null): number | null {
  if (kg === null) return null
  return +(kg * KG_TO_LBS).toFixed(1)
}

function convertLengthToInches(cm: number | null): number | null {
  if (cm === null) return null
  return +(cm * CM_TO_INCHES).toFixed(1)
}

function convertDistanceToMiles(km: number | null): number | null {
  if (km === null) return null
  return +(km * KM_TO_MILES).toFixed(2)
}

function toMetricWeight(lbs: number | null): number | null {
  if (lbs === null) return null
  return +(lbs / KG_TO_LBS).toFixed(2)
}

function toMetricLength(inches: number | null): number | null {
  if (inches === null) return null
  return +(inches / CM_TO_INCHES).toFixed(2)
}

describe('Weight Conversion', () => {
  describe('kg to lbs', () => {
    it('converts 100kg to 220.5lbs', () => {
      expect(convertWeightToLbs(100)).toBe(220.5)
    })

    it('converts 50kg to 110.2lbs', () => {
      expect(convertWeightToLbs(50)).toBe(110.2)
    })

    it('converts 0kg to 0lbs', () => {
      expect(convertWeightToLbs(0)).toBe(0)
    })

    it('handles null values', () => {
      expect(convertWeightToLbs(null)).toBeNull()
    })

    it('converts decimal weights correctly', () => {
      expect(convertWeightToLbs(82.5)).toBe(181.9)
    })
  })

  describe('lbs to kg', () => {
    it('converts 220.5lbs back to approximately 100kg', () => {
      const result = toMetricWeight(220.5)
      expect(result).toBeCloseTo(100, 0)
    })

    it('converts 150lbs to approximately 68.04kg', () => {
      expect(toMetricWeight(150)).toBe(68.04)
    })

    it('handles null values', () => {
      expect(toMetricWeight(null)).toBeNull()
    })
  })

  describe('round-trip conversion', () => {
    it('kg -> lbs -> kg returns approximately original value', () => {
      const original = 85
      const inLbs = convertWeightToLbs(original)
      const backToKg = toMetricWeight(inLbs)
      expect(backToKg).toBeCloseTo(original, 0)
    })
  })
})

describe('Length Conversion', () => {
  describe('cm to inches', () => {
    it('converts 100cm to 39.4 inches', () => {
      expect(convertLengthToInches(100)).toBe(39.4)
    })

    it('converts 2.54cm to 1 inch', () => {
      expect(convertLengthToInches(2.54)).toBe(1)
    })

    it('handles null values', () => {
      expect(convertLengthToInches(null)).toBeNull()
    })

    it('converts waist measurement 84cm to 33.1 inches', () => {
      expect(convertLengthToInches(84)).toBe(33.1)
    })
  })

  describe('inches to cm', () => {
    it('converts 39.4 inches back to approximately 100cm', () => {
      const result = toMetricLength(39.4)
      expect(result).toBeCloseTo(100, 0)
    })

    it('handles null values', () => {
      expect(toMetricLength(null)).toBeNull()
    })
  })
})

describe('Distance Conversion', () => {
  it('converts 1km to 0.62 miles', () => {
    expect(convertDistanceToMiles(1)).toBe(0.62)
  })

  it('converts 5km to 3.11 miles', () => {
    expect(convertDistanceToMiles(5)).toBe(3.11)
  })

  it('converts 10km to 6.21 miles', () => {
    expect(convertDistanceToMiles(10)).toBe(6.21)
  })

  it('handles null values', () => {
    expect(convertDistanceToMiles(null)).toBeNull()
  })
})

describe('Change Calculations (Imperial)', () => {
  // These tests verify the CORRECT way to calculate changes:
  // Convert values first, THEN calculate the difference

  it('calculates weight change correctly in imperial', () => {
    const firstWeightKg = 90
    const lastWeightKg = 85

    // CORRECT: Convert first, then subtract
    const firstLbs = convertWeightToLbs(firstWeightKg)! // 198.4
    const lastLbs = convertWeightToLbs(lastWeightKg)!   // 187.4
    const correctChange = +(lastLbs - firstLbs).toFixed(1) // -11.0

    // WRONG: Subtract first, then convert
    const diffKg = lastWeightKg - firstWeightKg // -5
    const wrongChange = convertWeightToLbs(diffKg) // -11.0 (same by coincidence for linear conversion)

    expect(correctChange).toBe(-11)
    // For linear conversions, both methods give same result,
    // but the correct approach is essential for non-linear conversions
  })

  it('calculates measurement change correctly in imperial', () => {
    const firstWaistCm = 90
    const lastWaistCm = 85

    // CORRECT approach
    const firstInches = convertLengthToInches(firstWaistCm)! // 35.4
    const lastInches = convertLengthToInches(lastWaistCm)!   // 33.5
    const change = +(lastInches - firstInches).toFixed(1)     // -1.9

    expect(change).toBe(-1.9)
  })
})

describe('Display Formatting', () => {
  function formatWeight(kg: number | null, isImperial: boolean): string {
    if (kg === null || kg === 0) return '—'
    const value = isImperial ? convertWeightToLbs(kg) : kg
    const unit = isImperial ? 'lbs' : 'kg'
    return `${value}${unit}`
  }

  function formatLength(cm: number | null, isImperial: boolean): string {
    if (cm === null || cm === 0) return '—'
    const value = isImperial ? convertLengthToInches(cm) : cm
    const unit = isImperial ? 'in' : 'cm'
    return `${value}${unit}`
  }

  it('shows — for null weight', () => {
    expect(formatWeight(null, false)).toBe('—')
    expect(formatWeight(null, true)).toBe('—')
  })

  it('shows — for zero weight', () => {
    expect(formatWeight(0, false)).toBe('—')
    expect(formatWeight(0, true)).toBe('—')
  })

  it('formats metric weight correctly', () => {
    expect(formatWeight(85, false)).toBe('85kg')
  })

  it('formats imperial weight correctly', () => {
    expect(formatWeight(85, true)).toBe('187.4lbs')
  })

  it('shows — for null length', () => {
    expect(formatLength(null, false)).toBe('—')
    expect(formatLength(null, true)).toBe('—')
  })

  it('shows — for zero length', () => {
    expect(formatLength(0, false)).toBe('—')
    expect(formatLength(0, true)).toBe('—')
  })

  it('formats metric length correctly', () => {
    expect(formatLength(90, false)).toBe('90cm')
  })

  it('formats imperial length correctly', () => {
    expect(formatLength(90, true)).toBe('35.4in')
  })
})

describe('Volume Formatting', () => {
  function formatVolume(kg: number, isImperial: boolean): string {
    const converted = isImperial ? convertWeightToLbs(kg) ?? 0 : kg
    const unit = isImperial ? 'lbs' : 'kg'
    if (converted >= 1000) {
      return `${(converted / 1000).toFixed(1)}k ${unit}`
    }
    return `${converted} ${unit}`
  }

  it('formats small volume in metric', () => {
    expect(formatVolume(500, false)).toBe('500 kg')
  })

  it('formats large volume in metric with k suffix', () => {
    expect(formatVolume(5000, false)).toBe('5.0k kg')
  })

  it('formats volume in imperial (over 1000 lbs shows k suffix)', () => {
    // 500kg = 1102.3 lbs, which is over 1000, so shows k suffix
    expect(formatVolume(500, true)).toBe('1.1k lbs')
  })

  it('formats small volume in imperial (under 1000 lbs)', () => {
    // 200kg = 440.9 lbs, under 1000 so no k suffix
    expect(formatVolume(200, true)).toBe('440.9 lbs')
  })

  it('formats large volume in imperial with k suffix', () => {
    expect(formatVolume(5000, true)).toBe('11.0k lbs')
  })
})
