import { describe, it, expect } from 'vitest'
import {
  formatTime,
  formatDuration,
  startOfDay,
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
