/**
 * Time formatting utilities
 */

/**
 * Format seconds into mm:ss format
 * @param seconds - Total seconds
 * @returns Formatted time string (e.g., "2:30")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Human-readable duration (e.g., "45 min", "1h 30min")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}

/**
 * Get the start of a date (midnight)
 * @param date - Date to get start of
 * @returns New Date set to midnight
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}
