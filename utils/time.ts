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
 * Format a date into a relative time string
 * @param dateStr - ISO date string
 * @returns Relative time string (e.g., "Just now", "2h ago", "3d ago")
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
 * Check if a date is within the last N days
 * @param dateStr - ISO date string
 * @param days - Number of days to check
 * @returns True if the date is within the specified days
 */
export function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
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

/**
 * Get the day of week name
 * @param date - Date to get day name from
 * @returns Day name (e.g., "Monday")
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}
