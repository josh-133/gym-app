/**
 * Persistent per-exercise notes and preferred rest timer
 * Stores in Supabase exercise_notes table with localStorage fallback
 */

interface ExerciseNote {
  id?: string
  exercise_id: string
  note: string
  preferred_rest_sec: number | null
}

const LOCAL_KEY = 'gym-app-exercise-notes'

export function useExerciseNotes() {
  const { $supabase } = useNuxtApp()
  const auth = useAuth()
  const notes = useState<Map<string, ExerciseNote>>('exerciseNotes', () => new Map())
  const loaded = useState('exerciseNotesLoaded', () => false)

  function loadFromLocal() {
    if (!import.meta.client) return
    const stored = localStorage.getItem(LOCAL_KEY)
    if (stored) {
      try {
        const parsed: ExerciseNote[] = JSON.parse(stored)
        parsed.forEach(n => notes.value.set(n.exercise_id, n))
      } catch { /* ignore */ }
    }
  }

  function saveToLocal() {
    if (!import.meta.client) return
    localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(notes.value.values())))
  }

  async function loadFromSupabase() {
    if (!$supabase || !auth.user.value || loaded.value) return

    try {
      const { data, error } = await $supabase
        .from('exercise_notes')
        .select('id, exercise_id, note, preferred_rest_sec')
        .eq('user_id', auth.user.value.id)

      if (error) {
        console.error('Error loading exercise notes:', error)
        return
      }

      if (data) {
        data.forEach((n: ExerciseNote & { id: string }) => {
          notes.value.set(n.exercise_id, n)
        })
        saveToLocal()
      }
      loaded.value = true
    } catch (err) {
      console.error('Error loading exercise notes:', err)
    }
  }

  function getNote(exerciseId: string): ExerciseNote | undefined {
    return notes.value.get(exerciseId)
  }

  function getNoteText(exerciseId: string): string {
    return notes.value.get(exerciseId)?.note || ''
  }

  function getPreferredRest(exerciseId: string): number | null {
    return notes.value.get(exerciseId)?.preferred_rest_sec ?? null
  }

  async function setNote(exerciseId: string, noteText: string) {
    const existing = notes.value.get(exerciseId)
    const updated: ExerciseNote = {
      ...existing,
      exercise_id: exerciseId,
      note: noteText,
      preferred_rest_sec: existing?.preferred_rest_sec ?? null,
    }
    notes.value.set(exerciseId, updated)
    saveToLocal()

    if ($supabase && auth.user.value) {
      await $supabase
        .from('exercise_notes')
        .upsert({
          user_id: auth.user.value.id,
          exercise_id: exerciseId,
          note: noteText,
          preferred_rest_sec: updated.preferred_rest_sec,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,exercise_id' })
    }
  }

  async function setPreferredRest(exerciseId: string, seconds: number | null) {
    const existing = notes.value.get(exerciseId)
    const updated: ExerciseNote = {
      ...existing,
      exercise_id: exerciseId,
      note: existing?.note || '',
      preferred_rest_sec: seconds,
    }
    notes.value.set(exerciseId, updated)
    saveToLocal()

    if ($supabase && auth.user.value) {
      await $supabase
        .from('exercise_notes')
        .upsert({
          user_id: auth.user.value.id,
          exercise_id: exerciseId,
          note: updated.note,
          preferred_rest_sec: seconds,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,exercise_id' })
    }
  }

  async function deleteNote(exerciseId: string) {
    notes.value.delete(exerciseId)
    saveToLocal()

    if ($supabase && auth.user.value) {
      await $supabase
        .from('exercise_notes')
        .delete()
        .eq('user_id', auth.user.value.id)
        .eq('exercise_id', exerciseId)
    }
  }

  onMounted(() => {
    loadFromLocal()
    loadFromSupabase()
  })

  return {
    notes: readonly(notes),
    getNote,
    getNoteText,
    getPreferredRest,
    setNote,
    setPreferredRest,
    deleteNote,
    loadFromSupabase,
  }
}
