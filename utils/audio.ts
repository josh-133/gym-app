/**
 * Audio utilities for notifications and alerts
 */

let audioContext: AudioContext | null = null

/**
 * Get or create the shared AudioContext
 * @returns AudioContext instance
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch (e) {
      console.warn('AudioContext not supported:', e)
      return null
    }
  }
  return audioContext
}

/**
 * Play a beep sound
 * @param frequency - Frequency in Hz (default 800)
 * @param duration - Duration in ms (default 200)
 */
export function playBeep(frequency: number = 800, duration: number = 200): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)
  } catch (e) {
    console.warn('Could not play audio:', e)
  }
}

/**
 * Play a completion sound (three ascending beeps)
 */
export function playCompletionSound(): void {
  playBeep(600, 150)
  setTimeout(() => playBeep(800, 150), 200)
  setTimeout(() => playBeep(1000, 300), 400)
}

/**
 * Vibrate the device if supported
 * @param pattern - Vibration pattern (array of durations in ms)
 */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

/**
 * Play completion sound with vibration
 */
export function playCompletionAlert(): void {
  playCompletionSound()
  vibrate([200, 100, 200, 100, 300])
}
