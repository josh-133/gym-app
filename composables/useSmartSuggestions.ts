/**
 * Smart workout suggestion engine
 * Recommends next workout based on recovery, training history, and muscle group balance
 */

import { EXERCISE_LIBRARY, WORKOUT_TYPE_MUSCLES } from '~/utils/exercises'
import type { MuscleGroup } from '~/types/database'

interface WorkoutSuggestion {
  templateId: string | null
  templateName: string
  reason: string
  score: number
  targetMuscles: string[]
}

// Recovery times in hours per muscle group size
const RECOVERY_HOURS: Record<string, number> = {
  // Small muscles - 48h
  biceps: 48, triceps: 48, forearms: 48, calves: 48, abs: 48, obliques: 48,
  // Large muscles - 72h
  chest: 72, back: 72, shoulders: 72, quads: 72, hamstrings: 72, glutes: 72,
  traps: 72, lats: 72, lower_back: 72, hip_flexors: 48,
}

export function useSmartSuggestions() {
  const { workouts } = useWorkoutHistory()
  const { templates } = useTemplates()

  function getSuggestion(): WorkoutSuggestion | null {
    if (workouts.value.length === 0 || templates.value.length === 0) return null

    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    // Calculate muscle group recovery status
    const lastTrained = new Map<string, number>() // muscle → timestamp

    workouts.value.forEach(w => {
      const workoutTime = new Date(w.date).getTime()
      if (workoutTime < sevenDaysAgo) return

      w.exercises.forEach(ex => {
        const libraryEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
        if (!libraryEx) return

        libraryEx.muscleGroups.forEach(muscle => {
          const current = lastTrained.get(muscle) || 0
          if (workoutTime > current) {
            lastTrained.set(muscle, workoutTime)
          }
        })
      })
    })

    // Calculate recovery percentage per muscle group
    const recovery = new Map<string, number>() // muscle → 0-1 (1 = fully recovered)
    const allMuscles: MuscleGroup[] = [
      'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
      'abs', 'quads', 'hamstrings', 'glutes', 'calves', 'traps', 'lats',
    ]

    allMuscles.forEach(muscle => {
      const lastTime = lastTrained.get(muscle)
      if (!lastTime) {
        recovery.set(muscle, 1) // Never trained = fully recovered
        return
      }

      const hoursSince = (now - lastTime) / (1000 * 60 * 60)
      const requiredHours = RECOVERY_HOURS[muscle] || 72
      recovery.set(muscle, Math.min(hoursSince / requiredHours, 1))
    })

    // Calculate weekly sets per muscle group
    const weeklySets = new Map<string, number>()
    workouts.value.forEach(w => {
      if (new Date(w.date).getTime() < sevenDaysAgo) return

      w.exercises.forEach(ex => {
        const libraryEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
        if (!libraryEx) return

        const completedSets = ex.sets.filter(s => s.completed).length
        libraryEx.muscleGroups.forEach(muscle => {
          weeklySets.set(muscle, (weeklySets.get(muscle) || 0) + completedSets)
        })
      })
    })

    // Score each template
    const scored: WorkoutSuggestion[] = templates.value.map(template => {
      const templateMuscles = new Set<string>()
      template.exercises.forEach(ex => {
        const libraryEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
        if (libraryEx) {
          libraryEx.muscleGroups.forEach(m => templateMuscles.add(m))
        }
      })

      let score = 0
      const reasons: string[] = []
      const targetMuscles = Array.from(templateMuscles)

      // Score based on recovery (prefer fully recovered muscles)
      let avgRecovery = 0
      let recoveredCount = 0
      targetMuscles.forEach(muscle => {
        const rec = recovery.get(muscle) || 1
        avgRecovery += rec
        if (rec >= 0.9) recoveredCount++
      })
      avgRecovery /= Math.max(targetMuscles.length, 1)
      score += avgRecovery * 40

      // Score based on under-trained muscles (volume balance)
      let undertrained = 0
      targetMuscles.forEach(muscle => {
        const sets = weeklySets.get(muscle) || 0
        if (sets < 10) undertrained++ // Less than 10 sets/week
      })
      const undertrainedRatio = undertrained / Math.max(targetMuscles.length, 1)
      score += undertrainedRatio * 30

      // Bonus for variety (prefer templates not used recently)
      const lastUsedTime = template.lastUsed ? new Date(template.lastUsed).getTime() : 0
      const daysSinceUsed = lastUsedTime ? (now - lastUsedTime) / (1000 * 60 * 60 * 24) : 30
      score += Math.min(daysSinceUsed / 7, 1) * 20

      // Build reason
      if (avgRecovery >= 0.9) {
        reasons.push('muscles are fully recovered')
      }
      if (undertrainedRatio > 0.5) {
        reasons.push('targets under-trained muscles')
      }
      if (daysSinceUsed > 3) {
        reasons.push("hasn't been done recently")
      }

      return {
        templateId: template.id,
        templateName: template.name,
        reason: reasons.length > 0 ? reasons.join(', ') : 'good option based on your training pattern',
        score,
        targetMuscles: targetMuscles.slice(0, 4),
      }
    })

    // Return top suggestion
    scored.sort((a, b) => b.score - a.score)
    return scored[0] || null
  }

  // Get recovery status for display
  function getRecoveryStatus(): { muscle: string; recoveryPercent: number; lastTrained: string | null }[] {
    const now = Date.now()
    const result: ReturnType<typeof getRecoveryStatus> = []

    const allMuscles: MuscleGroup[] = [
      'chest', 'back', 'shoulders', 'biceps', 'triceps',
      'quads', 'hamstrings', 'glutes', 'calves', 'abs',
    ]

    allMuscles.forEach(muscle => {
      let lastTrainedTime: number | null = null

      for (const w of workouts.value) {
        const workoutTime = new Date(w.date).getTime()
        for (const ex of w.exercises) {
          const libraryEx = EXERCISE_LIBRARY.find(e => e.name === ex.name)
          if (libraryEx?.muscleGroups.includes(muscle)) {
            if (!lastTrainedTime || workoutTime > lastTrainedTime) {
              lastTrainedTime = workoutTime
            }
          }
        }
      }

      let recoveryPercent = 100
      if (lastTrainedTime) {
        const hoursSince = (now - lastTrainedTime) / (1000 * 60 * 60)
        const requiredHours = RECOVERY_HOURS[muscle] || 72
        recoveryPercent = Math.min(Math.round((hoursSince / requiredHours) * 100), 100)
      }

      result.push({
        muscle,
        recoveryPercent,
        lastTrained: lastTrainedTime ? new Date(lastTrainedTime).toISOString() : null,
      })
    })

    return result
  }

  return {
    getSuggestion,
    getRecoveryStatus,
  }
}
