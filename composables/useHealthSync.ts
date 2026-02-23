/**
 * Health data sync composable
 * Integrates with Apple Health / Google Health Connect via Capacitor
 * Falls back gracefully when Capacitor is not available (web)
 */

export function useHealthSync() {
  const enabled = useState('healthSyncEnabled', () => false)
  const isNative = useState('isNativeApp', () => false)

  function checkNative() {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      isNative.value = true
    }
  }

  // Write a completed workout to Health
  async function writeWorkout(data: {
    name: string
    startDate: string
    endDate: string
    durationSec: number
    caloriesBurned?: number
  }) {
    if (!isNative.value || !enabled.value) return

    try {
      // This would use @capacitor/health or capacitor-health-connect plugin
      // For now, just log — actual implementation requires Capacitor plugin
      console.log('Would write workout to Health:', data)
    } catch (err) {
      console.error('Error writing to Health:', err)
    }
  }

  // Write a body weight measurement to Health
  async function writeWeight(weightKg: number, date?: string) {
    if (!isNative.value || !enabled.value) return

    try {
      console.log('Would write weight to Health:', weightKg, date)
    } catch (err) {
      console.error('Error writing weight to Health:', err)
    }
  }

  // Read weight measurements from Health
  async function readWeightHistory(days: number = 30): Promise<{ date: string; weightKg: number }[]> {
    if (!isNative.value || !enabled.value) return []

    try {
      console.log('Would read weight history from Health for last', days, 'days')
      return []
    } catch (err) {
      console.error('Error reading from Health:', err)
      return []
    }
  }

  // Toggle health sync on/off
  async function setEnabled(value: boolean) {
    if (!isNative.value) return

    if (value) {
      // Request permissions
      try {
        console.log('Would request Health permissions')
        enabled.value = true
      } catch (err) {
        console.error('Failed to get Health permissions:', err)
        enabled.value = false
      }
    } else {
      enabled.value = false
    }

    // Persist preference
    if (import.meta.client) {
      localStorage.setItem('gym-app-health-sync', String(enabled.value))
    }
  }

  onMounted(() => {
    checkNative()
    if (import.meta.client) {
      const stored = localStorage.getItem('gym-app-health-sync')
      if (stored === 'true') enabled.value = true
    }
  })

  return {
    enabled: readonly(enabled),
    isNative: readonly(isNative),
    setEnabled,
    writeWorkout,
    writeWeight,
    readWeightHistory,
  }
}
