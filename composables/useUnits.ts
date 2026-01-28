export function useUnits() {
  const auth = useAuth()

  const KG_TO_LBS = 2.20462
  const CM_TO_INCHES = 0.393701
  const KM_TO_MILES = 0.621371

  const unitSystem = computed(() => auth.profile.value?.unit_system || 'metric')
  const isImperial = computed(() => unitSystem.value === 'imperial')

  const weightUnit = computed(() => isImperial.value ? 'lbs' : 'kg')
  const lengthUnit = computed(() => isImperial.value ? 'in' : 'cm')
  const distanceUnit = computed(() => isImperial.value ? 'mi' : 'km')

  // Display conversion (metric -> display)
  function convertWeight(kg: number | null): number | null {
    if (kg === null) return null
    return isImperial.value ? +(kg * KG_TO_LBS).toFixed(1) : kg
  }

  function convertLength(cm: number | null): number | null {
    if (cm === null) return null
    return isImperial.value ? +(cm * CM_TO_INCHES).toFixed(1) : cm
  }

  function convertDistance(km: number | null): number | null {
    if (km === null) return null
    return isImperial.value ? +(km * KM_TO_MILES).toFixed(2) : km
  }

  // Input conversion (display -> metric for storage)
  function toMetricWeight(value: number | null): number | null {
    if (value === null) return null
    return isImperial.value ? +(value / KG_TO_LBS).toFixed(2) : value
  }

  function toMetricLength(value: number | null): number | null {
    if (value === null) return null
    return isImperial.value ? +(value / CM_TO_INCHES).toFixed(2) : value
  }

  function toMetricDistance(value: number | null): number | null {
    if (value === null) return null
    return isImperial.value ? +(value / KM_TO_MILES).toFixed(2) : value
  }

  // Format helpers with unit suffix
  function formatWeight(kg: number | null): string {
    if (kg === null || kg === 0) return '—'
    return `${convertWeight(kg)}${weightUnit.value}`
  }

  function formatLength(cm: number | null): string {
    if (cm === null || cm === 0) return '—'
    return `${convertLength(cm)}${lengthUnit.value}`
  }

  function formatDistance(km: number | null): string {
    if (km === null || km === 0) return '—'
    return `${convertDistance(km)}${distanceUnit.value}`
  }

  // Format helpers for volume (weight * reps aggregated)
  function formatVolume(kg: number): string {
    const converted = convertWeight(kg) ?? 0
    const unit = weightUnit.value
    if (converted >= 1000) {
      return `${(converted / 1000).toFixed(1)}k ${unit}`
    }
    return `${converted} ${unit}`
  }

  return {
    unitSystem,
    isImperial,
    weightUnit,
    lengthUnit,
    distanceUnit,
    convertWeight,
    convertLength,
    convertDistance,
    toMetricWeight,
    toMetricLength,
    toMetricDistance,
    formatWeight,
    formatLength,
    formatDistance,
    formatVolume,
  }
}
