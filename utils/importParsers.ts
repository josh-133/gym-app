/**
 * Import parsers for Strong, Hevy, and FitNotes CSV formats
 */

interface ImportedSet {
  weight: number | null
  reps: number | null
  rpe: number | null
  distance_km: number | null
  duration_sec: number | null
}

interface ImportedExercise {
  name: string
  sets: ImportedSet[]
}

interface ImportedWorkout {
  name: string
  date: string
  notes: string | null
  exercises: ImportedExercise[]
}

export type ImportFormat = 'strong' | 'hevy' | 'fitnotes'

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

/**
 * Parse Strong app CSV export
 * Format: Date, Workout Name, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, Notes, Workout Notes, RPE
 */
export function parseStrongCSV(text: string): ImportedWorkout[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.toLowerCase())
  const dateIdx = headers.indexOf('date')
  const nameIdx = headers.indexOf('workout name')
  const exerciseIdx = headers.indexOf('exercise name')
  const weightIdx = headers.indexOf('weight')
  const repsIdx = headers.indexOf('reps')
  const distanceIdx = headers.indexOf('distance')
  const secondsIdx = headers.indexOf('seconds')
  const notesIdx = headers.indexOf('workout notes')
  const rpeIdx = headers.indexOf('rpe')

  const workoutMap = new Map<string, ImportedWorkout>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 4) continue

    const dateStr = row[dateIdx] || ''
    const workoutName = row[nameIdx] || ''
    const key = `${dateStr}-${workoutName}`

    if (!workoutMap.has(key)) {
      workoutMap.set(key, {
        name: workoutName,
        date: parseDate(dateStr),
        notes: row[notesIdx] || null,
        exercises: [],
      })
    }

    const workout = workoutMap.get(key)!
    const exerciseName = row[exerciseIdx] || ''

    let exercise = workout.exercises.find(e => e.name === exerciseName)
    if (!exercise) {
      exercise = { name: exerciseName, sets: [] }
      workout.exercises.push(exercise)
    }

    exercise.sets.push({
      weight: parseFloat(row[weightIdx]) || null,
      reps: parseInt(row[repsIdx]) || null,
      rpe: rpeIdx >= 0 ? (parseFloat(row[rpeIdx]) || null) : null,
      distance_km: distanceIdx >= 0 ? (parseFloat(row[distanceIdx]) || null) : null,
      duration_sec: secondsIdx >= 0 ? (parseInt(row[secondsIdx]) || null) : null,
    })
  }

  return Array.from(workoutMap.values()).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

/**
 * Parse Hevy CSV export (similar to Strong format)
 */
export function parseHevyCSV(text: string): ImportedWorkout[] {
  // Hevy uses the same general format as Strong
  return parseStrongCSV(text)
}

/**
 * Parse FitNotes CSV export
 * Format: Date, Exercise, Category, Weight, Reps, Distance, Time
 */
export function parseFitNotesCSV(text: string): ImportedWorkout[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.toLowerCase())
  const dateIdx = headers.indexOf('date')
  const exerciseIdx = headers.indexOf('exercise')
  const weightIdx = headers.indexOf('weight')
  const repsIdx = headers.indexOf('reps')
  const distanceIdx = headers.indexOf('distance')
  const timeIdx = headers.indexOf('time')

  const workoutMap = new Map<string, ImportedWorkout>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 3) continue

    const dateStr = row[dateIdx] || ''
    const key = dateStr

    if (!workoutMap.has(key)) {
      workoutMap.set(key, {
        name: `Workout ${dateStr}`,
        date: parseDate(dateStr),
        notes: null,
        exercises: [],
      })
    }

    const workout = workoutMap.get(key)!
    const exerciseName = row[exerciseIdx] || ''

    let exercise = workout.exercises.find(e => e.name === exerciseName)
    if (!exercise) {
      exercise = { name: exerciseName, sets: [] }
      workout.exercises.push(exercise)
    }

    exercise.sets.push({
      weight: parseFloat(row[weightIdx]) || null,
      reps: parseInt(row[repsIdx]) || null,
      rpe: null,
      distance_km: distanceIdx >= 0 ? (parseFloat(row[distanceIdx]) || null) : null,
      duration_sec: timeIdx >= 0 ? parseTimeToSeconds(row[timeIdx]) : null,
    })
  }

  return Array.from(workoutMap.values()).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function parseImport(text: string, format: ImportFormat): ImportedWorkout[] {
  switch (format) {
    case 'strong': return parseStrongCSV(text)
    case 'hevy': return parseHevyCSV(text)
    case 'fitnotes': return parseFitNotesCSV(text)
    default: return []
  }
}

// Parse various date formats to ISO string
function parseDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toISOString()
  } catch { /* ignore */ }

  // Try common formats
  const parts = dateStr.split(/[-/]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number)
    // Try YYYY-MM-DD
    if (a > 1900) return new Date(a, b - 1, c).toISOString()
    // Try MM/DD/YYYY
    if (c > 1900) return new Date(c, a - 1, b).toISOString()
    // Try DD/MM/YYYY
    if (c > 1900 && a > 12) return new Date(c, b - 1, a).toISOString()
  }

  return new Date().toISOString()
}

// Parse time strings like "1:30:00" or "45:00" to seconds
function parseTimeToSeconds(timeStr: string): number | null {
  if (!timeStr) return null
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}
