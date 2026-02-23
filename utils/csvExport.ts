/**
 * CSV Export utility — exports workout history as CSV
 * Format: one row per set (date, workout_name, exercise, set_number, weight, reps, rpe, set_type)
 */

interface ExportableWorkout {
  name: string
  date: string
  duration: number
  exercises: {
    name: string
    category?: string
    sets: {
      weight: number | null
      reps: number | null
      completed: boolean
      set_type?: string
      rpe?: number | null
    }[]
    cardio?: {
      duration_sec: number
      distance_km?: number
      calories?: number
      completed: boolean
    }
  }[]
  volume: number
  notes: string | null
}

export function workoutsToCSV(workouts: ExportableWorkout[]): string {
  const headers = [
    'Date',
    'Workout Name',
    'Exercise Name',
    'Category',
    'Set Number',
    'Weight (kg)',
    'Reps',
    'RPE',
    'Set Type',
    'Cardio Duration (sec)',
    'Cardio Distance (km)',
    'Cardio Calories',
    'Workout Duration (sec)',
    'Workout Volume',
    'Workout Notes',
  ]

  const rows: string[][] = []

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exercise.category === 'cardio' && exercise.cardio) {
        rows.push([
          formatDate(workout.date),
          escapeCSV(workout.name),
          escapeCSV(exercise.name),
          'cardio',
          '',
          '',
          '',
          '',
          '',
          String(exercise.cardio.duration_sec || ''),
          String(exercise.cardio.distance_km || ''),
          String(exercise.cardio.calories || ''),
          String(workout.duration),
          String(workout.volume),
          escapeCSV(workout.notes || ''),
        ])
      } else {
        for (const [idx, set] of exercise.sets.entries()) {
          if (!set.completed) continue
          rows.push([
            formatDate(workout.date),
            escapeCSV(workout.name),
            escapeCSV(exercise.name),
            exercise.category || 'strength',
            String(idx + 1),
            set.weight != null ? String(set.weight) : '',
            set.reps != null ? String(set.reps) : '',
            set.rpe != null ? String(set.rpe) : '',
            set.set_type || 'working',
            '',
            '',
            '',
            String(workout.duration),
            String(workout.volume),
            escapeCSV(workout.notes || ''),
          ])
        }
      }
    }
  }

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

export function downloadCSV(csvContent: string, filename: string = 'workout-history.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
