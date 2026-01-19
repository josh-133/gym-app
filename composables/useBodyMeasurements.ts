export interface BodyMeasurement {
  id: string
  user_id: string
  measured_at: string
  weight_kg: number | null
  body_fat_percent: number | null
  muscle_mass_kg: number | null
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  bicep_cm: number | null
  thigh_cm: number | null
  notes: string | null
}

export interface CreateMeasurementInput {
  measured_at?: string
  weight_kg?: number | null
  body_fat_percent?: number | null
  muscle_mass_kg?: number | null
  chest_cm?: number | null
  waist_cm?: number | null
  hips_cm?: number | null
  bicep_cm?: number | null
  thigh_cm?: number | null
  notes?: string | null
}

export function useBodyMeasurements() {
  const { $supabase } = useNuxtApp()
  const { user } = useAuth()

  const measurements = useState<BodyMeasurement[]>('bodyMeasurements', () => [])
  const loading = useState('bodyMeasurementsLoading', () => false)

  async function fetchMeasurements() {
    if (!$supabase || !user.value) return

    loading.value = true
    try {
      const { data, error } = await $supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.value.id)
        .order('measured_at', { ascending: false })

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('404') || error.code === '42P01') {
          console.warn('Body measurements table not found')
          measurements.value = []
          return
        }
        throw error
      }
      measurements.value = data || []
    } catch (err: any) {
      if (err?.status === 404 || err?.code === '42P01') {
        console.warn('Body measurements table not found')
        measurements.value = []
        return
      }
      console.error('Error fetching body measurements:', err)
    } finally {
      loading.value = false
    }
  }

  async function addMeasurement(input: CreateMeasurementInput) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { data, error } = await $supabase
      .from('body_measurements')
      .insert({
        user_id: user.value.id,
        measured_at: input.measured_at || new Date().toISOString(),
        weight_kg: input.weight_kg,
        body_fat_percent: input.body_fat_percent,
        muscle_mass_kg: input.muscle_mass_kg,
        chest_cm: input.chest_cm,
        waist_cm: input.waist_cm,
        hips_cm: input.hips_cm,
        bicep_cm: input.bicep_cm,
        thigh_cm: input.thigh_cm,
        notes: input.notes,
      })
      .select()
      .single()

    if (error) throw error

    measurements.value = [data, ...measurements.value]
    return data
  }

  async function deleteMeasurement(id: string) {
    if (!$supabase || !user.value) throw new Error('Not authenticated')

    const { error } = await $supabase
      .from('body_measurements')
      .delete()
      .eq('id', id)
      .eq('user_id', user.value.id)

    if (error) throw error

    measurements.value = measurements.value.filter((m) => m.id !== id)
  }

  // Get most recent measurement
  const latestMeasurement = computed(() => {
    return measurements.value[0] || null
  })

  // Get weight history for charts
  const weightHistory = computed(() => {
    return measurements.value
      .filter((m) => m.weight_kg !== null)
      .map((m) => ({
        date: m.measured_at,
        weight: m.weight_kg!,
        bodyFat: m.body_fat_percent || 0,
      }))
      .reverse()
  })

  // Get measurements history for table
  const measurementsHistory = computed(() => {
    return measurements.value
      .map((m) => ({
        date: m.measured_at,
        chest: m.chest_cm || 0,
        waist: m.waist_cm || 0,
        hips: m.hips_cm || 0,
        arms: m.bicep_cm || 0,
        thighs: m.thigh_cm || 0,
      }))
      .reverse()
  })

  return {
    measurements,
    loading,
    fetchMeasurements,
    addMeasurement,
    deleteMeasurement,
    latestMeasurement,
    weightHistory,
    measurementsHistory,
  }
}
