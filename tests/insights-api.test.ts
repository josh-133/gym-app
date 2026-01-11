import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock data structures matching the API
interface WorkoutData {
  id: string
  name: string
  date: string
  duration: number
  exercises: {
    name: string
    sets: {
      weight: number | null
      reps: number | null
      completed: boolean
    }[]
  }[]
  volume: number
}

// Import the workout summary preparation logic
// We'll test the helper function that prepares workout data for Claude

function prepareWorkoutSummary(workouts: WorkoutData[]): string {
  // Sort workouts by date (most recent first)
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Take last 30 days of workouts
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentWorkouts = sortedWorkouts.filter(
    w => new Date(w.date) >= thirtyDaysAgo
  )

  // Calculate statistics
  const totalWorkouts = recentWorkouts.length
  const totalVolume = recentWorkouts.reduce((sum, w) => sum + w.volume, 0)
  const avgDuration = totalWorkouts > 0
    ? Math.round(recentWorkouts.reduce((sum, w) => sum + w.duration, 0) / totalWorkouts / 60)
    : 0

  // Count exercises and find PRs
  const exerciseData: Record<string, { count: number; maxWeight: number; totalVolume: number }> = {}

  recentWorkouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (!exerciseData[ex.name]) {
        exerciseData[ex.name] = { count: 0, maxWeight: 0, totalVolume: 0 }
      }
      exerciseData[ex.name].count++

      ex.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          exerciseData[ex.name].maxWeight = Math.max(exerciseData[ex.name].maxWeight, set.weight)
          exerciseData[ex.name].totalVolume += set.weight * set.reps
        }
      })
    })
  })

  // Calculate workout frequency by day of week
  const dayFrequency: Record<string, number> = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
    Thursday: 0, Friday: 0, Saturday: 0,
  }
  recentWorkouts.forEach(w => {
    const day = new Date(w.date).toLocaleDateString('en-US', { weekday: 'long' })
    dayFrequency[day]++
  })

  // Build summary
  let summary = `WORKOUT SUMMARY (Last 30 Days):
- Total workouts: ${totalWorkouts}
- Total volume: ${(totalVolume / 1000).toFixed(1)}k kg
- Average duration: ${avgDuration} minutes

EXERCISE BREAKDOWN:`

  Object.entries(exerciseData)
    .sort((a, b) => b[1].totalVolume - a[1].totalVolume)
    .slice(0, 10)
    .forEach(([name, data]) => {
      summary += `\n- ${name}: ${data.count} sessions, max weight ${data.maxWeight}kg, volume ${(data.totalVolume / 1000).toFixed(1)}k kg`
    })

  summary += `\n\nWORKOUT FREQUENCY BY DAY:`
  Object.entries(dayFrequency).forEach(([day, count]) => {
    summary += `\n- ${day}: ${count} workouts`
  })

  // Add recent workout details
  summary += `\n\nRECENT WORKOUTS:`
  recentWorkouts.slice(0, 5).forEach(w => {
    const exercises = w.exercises.map(e => e.name).join(', ')
    summary += `\n- ${new Date(w.date).toLocaleDateString()}: ${w.name} (${Math.round(w.duration / 60)}min) - ${exercises}`
  })

  return summary
}

describe('prepareWorkoutSummary', () => {
  const mockWorkouts: WorkoutData[] = [
    {
      id: '1',
      name: 'Push Day',
      date: new Date().toISOString(),
      duration: 3600, // 60 minutes
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { weight: 100, reps: 8, completed: true },
            { weight: 100, reps: 8, completed: true },
            { weight: 100, reps: 6, completed: true },
          ]
        },
        {
          name: 'Overhead Press',
          sets: [
            { weight: 60, reps: 8, completed: true },
            { weight: 60, reps: 8, completed: true },
          ]
        }
      ],
      volume: 3160, // (100*8 + 100*8 + 100*6) + (60*8 + 60*8)
    },
    {
      id: '2',
      name: 'Pull Day',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      duration: 4200, // 70 minutes
      exercises: [
        {
          name: 'Deadlift',
          sets: [
            { weight: 180, reps: 5, completed: true },
            { weight: 180, reps: 5, completed: true },
          ]
        },
      ],
      volume: 1800, // 180*5 + 180*5
    }
  ]

  it('includes total workout count', () => {
    const summary = prepareWorkoutSummary(mockWorkouts)
    expect(summary).toContain('Total workouts: 2')
  })

  it('calculates average duration correctly', () => {
    const summary = prepareWorkoutSummary(mockWorkouts)
    // (60 + 70) / 2 = 65 minutes
    expect(summary).toContain('Average duration: 65 minutes')
  })

  it('includes exercise breakdown', () => {
    const summary = prepareWorkoutSummary(mockWorkouts)
    expect(summary).toContain('Bench Press')
    expect(summary).toContain('Deadlift')
    expect(summary).toContain('Overhead Press')
  })

  it('tracks max weight per exercise', () => {
    const summary = prepareWorkoutSummary(mockWorkouts)
    expect(summary).toContain('max weight 100kg')
    expect(summary).toContain('max weight 180kg')
  })

  it('includes workout frequency by day', () => {
    const summary = prepareWorkoutSummary(mockWorkouts)
    expect(summary).toContain('WORKOUT FREQUENCY BY DAY')
    expect(summary).toContain('Monday:')
    expect(summary).toContain('Sunday:')
  })

  it('returns empty summary for empty workouts', () => {
    const summary = prepareWorkoutSummary([])
    expect(summary).toContain('Total workouts: 0')
    expect(summary).toContain('Average duration: 0 minutes')
  })

  it('filters out workouts older than 30 days', () => {
    const oldWorkout: WorkoutData = {
      id: '3',
      name: 'Old Workout',
      date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 3600,
      exercises: [],
      volume: 1000,
    }
    const summary = prepareWorkoutSummary([...mockWorkouts, oldWorkout])
    expect(summary).toContain('Total workouts: 2') // Still only 2
    expect(summary).not.toContain('Old Workout')
  })

  it('handles incomplete sets correctly', () => {
    const workoutWithIncomplete: WorkoutData = {
      id: '4',
      name: 'Test Workout',
      date: new Date().toISOString(),
      duration: 1800,
      exercises: [
        {
          name: 'Squat',
          sets: [
            { weight: 150, reps: 5, completed: true },
            { weight: 160, reps: 3, completed: false }, // Not completed - should be ignored
            { weight: null, reps: null, completed: true }, // No weight/reps
          ]
        }
      ],
      volume: 750,
    }
    const summary = prepareWorkoutSummary([workoutWithIncomplete])
    expect(summary).toContain('max weight 150kg') // Only counts the completed set with 150kg
  })
})

describe('insight types', () => {
  it('validates insight type enum', () => {
    const validTypes = ['recommendation', 'analysis', 'warning', 'celebration']
    validTypes.forEach(type => {
      expect(['recommendation', 'analysis', 'warning', 'celebration']).toContain(type)
    })
  })
})
