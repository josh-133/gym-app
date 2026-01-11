import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  formatTime,
  formatRelativeDate,
  formatDuration,
  isWithinDays,
  startOfDay,
  getDayName,
} from '~/utils/time'

describe('formatTime', () => {
  it('formats seconds under a minute', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(30)).toBe('0:30')
    expect(formatTime(59)).toBe('0:59')
  })

  it('formats full minutes', () => {
    expect(formatTime(60)).toBe('1:00')
    expect(formatTime(120)).toBe('2:00')
    expect(formatTime(300)).toBe('5:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatTime(90)).toBe('1:30')
    expect(formatTime(125)).toBe('2:05')
    expect(formatTime(599)).toBe('9:59')
  })

  it('handles large values', () => {
    expect(formatTime(3600)).toBe('60:00')
    expect(formatTime(3661)).toBe('61:01')
  })
})

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Just now" for recent times', () => {
    expect(formatRelativeDate('2024-01-15T11:30:00Z')).toBe('Just now')
    expect(formatRelativeDate('2024-01-15T11:59:00Z')).toBe('Just now')
  })

  it('returns hours ago for same day', () => {
    expect(formatRelativeDate('2024-01-15T10:00:00Z')).toBe('2h ago')
    expect(formatRelativeDate('2024-01-15T06:00:00Z')).toBe('6h ago')
  })

  it('returns days ago for recent days', () => {
    expect(formatRelativeDate('2024-01-14T12:00:00Z')).toBe('1d ago')
    expect(formatRelativeDate('2024-01-12T12:00:00Z')).toBe('3d ago')
  })

  it('returns formatted date for older dates', () => {
    const result = formatRelativeDate('2024-01-01T12:00:00Z')
    expect(result).toMatch(/Jan/)
  })
})

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(30)).toBe('30s')
    expect(formatDuration(59)).toBe('59s')
  })

  it('formats minutes', () => {
    expect(formatDuration(60)).toBe('1 min')
    expect(formatDuration(300)).toBe('5 min')
    expect(formatDuration(2700)).toBe('45 min')
  })

  it('formats hours', () => {
    expect(formatDuration(3600)).toBe('1h')
    expect(formatDuration(7200)).toBe('2h')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(5400)).toBe('1h 30min')
    expect(formatDuration(8100)).toBe('2h 15min')
  })
})

describe('isWithinDays', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true for dates within range', () => {
    expect(isWithinDays('2024-01-14T12:00:00Z', 7)).toBe(true)
    expect(isWithinDays('2024-01-10T12:00:00Z', 7)).toBe(true)
  })

  it('returns false for dates outside range', () => {
    expect(isWithinDays('2024-01-01T12:00:00Z', 7)).toBe(false)
    expect(isWithinDays('2023-12-01T12:00:00Z', 30)).toBe(false)
  })

  it('handles edge cases', () => {
    // Exactly 7 days ago at the boundary
    expect(isWithinDays('2024-01-08T12:00:00Z', 7)).toBe(true)
  })
})

describe('startOfDay', () => {
  it('sets time to midnight', () => {
    const date = new Date('2024-01-15T15:30:45.123Z')
    const result = startOfDay(date)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
  })

  it('does not modify original date', () => {
    const date = new Date('2024-01-15T15:30:45Z')
    const originalTime = date.getTime()
    startOfDay(date)
    expect(date.getTime()).toBe(originalTime)
  })

  it('preserves the date', () => {
    const date = new Date('2024-01-15T15:30:45Z')
    const result = startOfDay(date)
    expect(result.getDate()).toBe(date.getDate())
    expect(result.getMonth()).toBe(date.getMonth())
    expect(result.getFullYear()).toBe(date.getFullYear())
  })
})

describe('getDayName', () => {
  it('returns correct day names', () => {
    // Monday
    expect(getDayName(new Date('2024-01-15'))).toBe('Monday')
    // Sunday
    expect(getDayName(new Date('2024-01-14'))).toBe('Sunday')
    // Friday
    expect(getDayName(new Date('2024-01-19'))).toBe('Friday')
  })
})
