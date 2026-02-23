import { defineStore } from 'pinia'
import type { WorkoutSession, ExerciseLog, Set, Exercise, CardioLog, ExerciseGroupType } from '~/types/database'

const STORAGE_KEY = 'gym-app-active-workout'

interface PersistedState {
  session: WorkoutSession | null
  exerciseLogs: ActiveExerciseLog[]
  isActive: boolean
  isPaused: boolean
  startedAt: string | null
  pausedAt: string | null
  totalPausedTime: number
  restTimerEndAt: string | null
}

interface ActiveSet {
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  tempo: string | null
  set_type: 'warmup' | 'working' | 'dropset' | 'failure' | 'amrap'
  completed_at: string | null
  is_pr: boolean
}

interface ActiveExerciseLog {
  id: string
  exercise: Exercise
  order_index: number
  sets: ActiveSet[]
  cardio_log: Partial<CardioLog> | null
  notes: string
  group_id: string | null
  group_type: ExerciseGroupType | null
}

export type ExerciseGroupEntry = {
  type: 'standalone'
  exercise: ActiveExerciseLog
  exerciseIndex: number
} | {
  type: 'group'
  groupId: string
  groupType: ExerciseGroupType
  exercises: { log: ActiveExerciseLog; exerciseIndex: number }[]
}

interface WorkoutState {
  session: WorkoutSession | null
  exerciseLogs: ActiveExerciseLog[]
  isActive: boolean
  isPaused: boolean
  startedAt: Date | null
  pausedAt: Date | null
  totalPausedTime: number
  restTimerEndAt: Date | null
}

export const useWorkoutStore = defineStore('workout', {
  state: (): WorkoutState => ({
    session: null,
    exerciseLogs: [],
    isActive: false,
    isPaused: false,
    startedAt: null,
    pausedAt: null,
    totalPausedTime: 0,
    restTimerEndAt: null,
  }),

  getters: {
    elapsedSeconds: (state) => {
      if (!state.startedAt) return 0
      const now = state.isPaused && state.pausedAt ? state.pausedAt : new Date()
      return Math.floor((now.getTime() - state.startedAt.getTime() - state.totalPausedTime) / 1000)
    },

    currentExercise: (state) => {
      return state.exerciseLogs[state.exerciseLogs.length - 1] || null
    },

    totalSets: (state) => {
      return state.exerciseLogs.reduce((sum, log) => {
        return sum + log.sets.filter(s => s.completed_at).length
      }, 0)
    },

    totalVolume: (state) => {
      return state.exerciseLogs.reduce((sum, log) => {
        return sum + log.sets.reduce((setSum, set) => {
          if (set.completed_at && set.reps && set.weight_kg) {
            return setSum + (set.reps * set.weight_kg)
          }
          return setSum
        }, 0)
      }, 0)
    },

    restTimerRemaining: (state) => {
      if (!state.restTimerEndAt) return 0
      return Math.max(0, Math.floor((state.restTimerEndAt.getTime() - Date.now()) / 1000))
    },

    groupedExerciseLogs: (state): ExerciseGroupEntry[] => {
      const entries: ExerciseGroupEntry[] = []
      const seenGroupIds = new Set<string>()

      for (let i = 0; i < state.exerciseLogs.length; i++) {
        const log = state.exerciseLogs[i]
        if (log.group_id) {
          if (seenGroupIds.has(log.group_id)) continue
          seenGroupIds.add(log.group_id)
          const groupMembers = state.exerciseLogs
            .map((l, idx) => ({ log: l, exerciseIndex: idx }))
            .filter(item => item.log.group_id === log.group_id)
          entries.push({
            type: 'group',
            groupId: log.group_id,
            groupType: log.group_type || 'superset',
            exercises: groupMembers,
          })
        } else {
          entries.push({ type: 'standalone', exercise: log, exerciseIndex: i })
        }
      }
      return entries
    },
  },

  actions: {
    startWorkout(name: string) {
      this.session = {
        id: crypto.randomUUID(),
        user_id: '',
        template_id: null,
        name,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        completed_at: null,
        duration_sec: null,
        notes: null,
        rating: null,
        perceived_exertion: null,
        calories_burned: null,
        mood: null,
        energy: null,
        sleep_quality: null,
        created_at: new Date().toISOString(),
      }
      this.exerciseLogs = []
      this.isActive = true
      this.isPaused = false
      this.startedAt = new Date()
      this.pausedAt = null
      this.totalPausedTime = 0
      this.restTimerEndAt = null
      this.persistState()
    },

    // Start a workout pre-populated from a previous workout's data
    startFromHistory(workout: {
      name: string
      exercises: {
        exercise: Exercise
        sets: { weight_kg: number | null; reps: number | null; set_type?: string }[]
        group_id?: string | null
        group_type?: ExerciseGroupType | null
      }[]
    }) {
      this.startWorkout(workout.name)

      for (const ex of workout.exercises) {
        this.addExercise(ex.exercise, ex.group_id && ex.group_type ? {
          groupId: ex.group_id,
          groupType: ex.group_type,
        } : undefined)

        const exerciseIndex = this.exerciseLogs.length - 1

        // Pre-populate sets from the historical workout
        for (const set of ex.sets) {
          this.addSet(exerciseIndex, (set.set_type as ActiveSet['set_type']) || 'working')
          const setIndex = this.exerciseLogs[exerciseIndex].sets.length - 1
          this.exerciseLogs[exerciseIndex].sets[setIndex].weight_kg = set.weight_kg
          this.exerciseLogs[exerciseIndex].sets[setIndex].reps = set.reps
        }

        // If no sets from history, add one empty set
        if (ex.sets.length === 0 && ex.exercise.category !== 'cardio') {
          this.addSet(exerciseIndex)
        }
      }

      this.persistState()
    },

    pauseWorkout() {
      if (this.isActive && !this.isPaused) {
        this.isPaused = true
        this.pausedAt = new Date()
        this.persistState()
      }
    },

    resumeWorkout() {
      if (this.isPaused && this.pausedAt) {
        this.totalPausedTime += Date.now() - this.pausedAt.getTime()
        this.isPaused = false
        this.pausedAt = null
        this.persistState()
      }
    },

    addExercise(exercise: Exercise, options?: { groupId?: string; groupType?: ExerciseGroupType }) {
      const log: ActiveExerciseLog = {
        id: crypto.randomUUID(),
        exercise,
        order_index: this.exerciseLogs.length,
        sets: [],
        cardio_log: exercise.category === 'cardio' ? {} : null,
        notes: '',
        group_id: options?.groupId ?? null,
        group_type: options?.groupType ?? null,
      }
      this.exerciseLogs.push(log)
      this.persistState()
    },

    removeExercise(index: number) {
      const removed = this.exerciseLogs[index]
      const groupId = removed?.group_id
      this.exerciseLogs.splice(index, 1)
      this.exerciseLogs.forEach((log, i) => {
        log.order_index = i
      })
      // Auto-dissolve group if fewer than 2 members remain
      if (groupId) {
        const remaining = this.exerciseLogs.filter(l => l.group_id === groupId)
        if (remaining.length < 2) {
          remaining.forEach(l => { l.group_id = null; l.group_type = null })
        }
      }
      this.persistState()
    },

    addSet(exerciseIndex: number, setType: ActiveSet['set_type'] = 'working') {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log) return

      const lastSet = log.sets[log.sets.length - 1]
      const newSet: ActiveSet = {
        set_number: log.sets.length + 1,
        reps: lastSet?.reps ?? null,
        weight_kg: lastSet?.weight_kg ?? null,
        rpe: null,
        tempo: null,
        set_type: setType,
        completed_at: null,
        is_pr: false,
      }
      log.sets.push(newSet)
      this.persistState()
    },

    addDropSet(exerciseIndex: number, afterSetIndex: number, weightReduction: number = 0.75) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log) return

      const parentSet = log.sets[afterSetIndex]
      if (!parentSet) return

      const reducedWeight = parentSet.weight_kg
        ? Math.round(parentSet.weight_kg * weightReduction * 2) / 2 // Round to nearest 0.5
        : null

      const newSet: ActiveSet = {
        set_number: afterSetIndex + 2, // Will be renumbered below
        reps: parentSet.reps ?? null,
        weight_kg: reducedWeight,
        rpe: null,
        tempo: null,
        set_type: 'dropset',
        completed_at: null,
        is_pr: false,
      }

      // Insert after the parent set
      log.sets.splice(afterSetIndex + 1, 0, newSet)

      // Renumber all sets
      log.sets.forEach((set, i) => {
        set.set_number = i + 1
      })

      this.persistState()
    },

    completeSet(exerciseIndex: number, setIndex: number, data: Partial<ActiveSet>) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.sets[setIndex]) return

      log.sets[setIndex] = {
        ...log.sets[setIndex],
        ...data,
        completed_at: new Date().toISOString(),
      }
      this.persistState()
    },

    updateSet(exerciseIndex: number, setIndex: number, data: Partial<ActiveSet>) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.sets[setIndex]) return

      log.sets[setIndex] = {
        ...log.sets[setIndex],
        ...data,
      }
      this.persistState()
    },

    removeSet(exerciseIndex: number, setIndex: number) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log) return

      log.sets.splice(setIndex, 1)
      log.sets.forEach((set, i) => {
        set.set_number = i + 1
      })
      this.persistState()
    },

    uncompleteSet(exerciseIndex: number, setIndex: number) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.sets[setIndex]) return

      log.sets[setIndex] = {
        ...log.sets[setIndex],
        completed_at: null,
      }
      this.persistState()
    },

    updateCardioLog(exerciseIndex: number, data: Partial<CardioLog>) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log) return

      // Initialize cardio_log if it doesn't exist
      if (!log.cardio_log) {
        log.cardio_log = {}
      }

      log.cardio_log = { ...log.cardio_log, ...data }
      this.persistState()
    },

    completeCardioLog(exerciseIndex: number) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.cardio_log) return

      log.cardio_log = {
        ...log.cardio_log,
        completed_at: new Date().toISOString(),
      }
      this.persistState()
    },

    startRestTimer(seconds: number) {
      this.restTimerEndAt = new Date(Date.now() + seconds * 1000)
      this.persistState()
    },

    cancelRestTimer() {
      this.restTimerEndAt = null
      this.persistState()
    },

    linkWithNext(exerciseIndex: number) {
      const current = this.exerciseLogs[exerciseIndex]
      const next = this.exerciseLogs[exerciseIndex + 1]
      if (!current || !next) return

      const existingGroupId = current.group_id || next.group_id
      const groupId = existingGroupId || crypto.randomUUID()

      // If current is already in a group, add next to that group
      if (current.group_id && !next.group_id) {
        next.group_id = current.group_id
        next.group_type = current.group_type
      }
      // If next is already in a group, add current to that group
      else if (!current.group_id && next.group_id) {
        current.group_id = next.group_id
        current.group_type = next.group_type
      }
      // Neither in a group - create new superset
      else if (!current.group_id && !next.group_id) {
        current.group_id = groupId
        current.group_type = 'superset'
        next.group_id = groupId
        next.group_type = 'superset'
      }
      // Both already in the same group - nothing to do
      else if (current.group_id === next.group_id) {
        return
      }
      // Both in different groups - merge into current's group
      else {
        const targetGroupId = current.group_id!
        const sourceGroupId = next.group_id!
        this.exerciseLogs.forEach(l => {
          if (l.group_id === sourceGroupId) {
            l.group_id = targetGroupId
          }
        })
      }

      // Auto-upgrade: determine group type based on member count
      const finalGroupId = current.group_id!
      const members = this.exerciseLogs.filter(l => l.group_id === finalGroupId)
      const groupType: ExerciseGroupType = members.length >= 3 ? 'circuit' : 'superset'
      members.forEach(l => { l.group_type = groupType })

      this.persistState()
    },

    removeFromGroup(exerciseIndex: number) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.group_id) return

      const groupId = log.group_id
      log.group_id = null
      log.group_type = null

      // Check remaining members
      const remaining = this.exerciseLogs.filter(l => l.group_id === groupId)
      if (remaining.length < 2) {
        remaining.forEach(l => { l.group_id = null; l.group_type = null })
      } else {
        // Downgrade from circuit to superset if only 2 remain
        const groupType: ExerciseGroupType = remaining.length >= 3 ? 'circuit' : 'superset'
        remaining.forEach(l => { l.group_type = groupType })
      }

      this.persistState()
    },

    dissolveGroup(groupId: string) {
      this.exerciseLogs.forEach(l => {
        if (l.group_id === groupId) {
          l.group_id = null
          l.group_type = null
        }
      })
      this.persistState()
    },

    generateWarmupSets(exerciseIndex: number, targetWeight: number) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log) return

      // Remove any existing warmup sets
      log.sets = log.sets.filter(s => s.set_type !== 'warmup')

      // Generate warm-up progression: bar → 50% → 70% → 85%
      const barWeight = 20 // Standard barbell
      const warmups: { weight: number; reps: number }[] = []

      if (targetWeight > barWeight * 2) {
        warmups.push({ weight: barWeight, reps: 10 })
        warmups.push({ weight: Math.round(targetWeight * 0.5 / 2.5) * 2.5, reps: 8 })
        warmups.push({ weight: Math.round(targetWeight * 0.7 / 2.5) * 2.5, reps: 5 })
        warmups.push({ weight: Math.round(targetWeight * 0.85 / 2.5) * 2.5, reps: 3 })
      } else if (targetWeight > barWeight) {
        warmups.push({ weight: barWeight, reps: 10 })
        warmups.push({ weight: Math.round(targetWeight * 0.7 / 2.5) * 2.5, reps: 5 })
      } else {
        warmups.push({ weight: Math.round(targetWeight * 0.5 / 2.5) * 2.5 || barWeight, reps: 10 })
      }

      // Insert warmup sets at the beginning
      const warmupSets: ActiveSet[] = warmups.map((wu, idx) => ({
        set_number: idx + 1,
        reps: wu.reps,
        weight_kg: wu.weight,
        rpe: null,
        set_type: 'warmup' as const,
        completed_at: null,
        is_pr: false,
      }))

      // Prepend warmup sets and renumber
      log.sets = [...warmupSets, ...log.sets]
      log.sets.forEach((set, i) => { set.set_number = i + 1 })

      this.persistState()
    },

    swapExercise(exerciseIndex: number, newExercise: Exercise) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log) return

      log.exercise = newExercise
      // Keep existing sets but clear completed data
      log.sets.forEach(set => {
        set.completed_at = null
        set.is_pr = false
      })

      // If swapping from strength to cardio or vice versa
      if (newExercise.category === 'cardio' && !log.cardio_log) {
        log.cardio_log = {}
        log.sets = []
      } else if (newExercise.category !== 'cardio' && log.cardio_log) {
        log.cardio_log = null
        if (log.sets.length === 0) {
          this.addSet(exerciseIndex)
        }
      }

      this.persistState()
    },

    async endWorkout() {
      if (!this.session || !this.startedAt) return null

      const duration = this.elapsedSeconds
      this.session = {
        ...this.session,
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_sec: duration,
      }

      const completedSession = { ...this.session }
      const completedLogs = [...this.exerciseLogs]

      // Reset state
      this.session = null
      this.exerciseLogs = []
      this.isActive = false
      this.isPaused = false
      this.startedAt = null
      this.pausedAt = null
      this.totalPausedTime = 0
      this.restTimerEndAt = null
      this.clearPersisted()

      return { session: completedSession, exerciseLogs: completedLogs }
    },

    cancelWorkout() {
      this.session = null
      this.exerciseLogs = []
      this.isActive = false
      this.isPaused = false
      this.startedAt = null
      this.pausedAt = null
      this.totalPausedTime = 0
      this.restTimerEndAt = null
      this.clearPersisted()
    },

    persistState() {
      if (typeof window === 'undefined') return

      const state: PersistedState = {
        session: this.session,
        exerciseLogs: this.exerciseLogs,
        isActive: this.isActive,
        isPaused: this.isPaused,
        startedAt: this.startedAt?.toISOString() ?? null,
        pausedAt: this.pausedAt?.toISOString() ?? null,
        totalPausedTime: this.totalPausedTime,
        restTimerEndAt: this.restTimerEndAt?.toISOString() ?? null,
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (e) {
        console.error('Failed to persist workout state:', e)
      }
    },

    restoreState() {
      if (typeof window === 'undefined') return false

      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return false

        const state: PersistedState = JSON.parse(stored)

        // Only restore if there was an active workout
        if (!state.isActive || !state.session) {
          this.clearPersisted()
          return false
        }

        this.session = state.session
        this.exerciseLogs = state.exerciseLogs
        this.isActive = state.isActive
        this.isPaused = state.isPaused
        this.startedAt = state.startedAt ? new Date(state.startedAt) : null
        this.pausedAt = state.pausedAt ? new Date(state.pausedAt) : null
        this.totalPausedTime = state.totalPausedTime
        this.restTimerEndAt = state.restTimerEndAt ? new Date(state.restTimerEndAt) : null

        return true
      } catch (e) {
        console.error('Failed to restore workout state:', e)
        this.clearPersisted()
        return false
      }
    },

    clearPersisted() {
      if (typeof window === 'undefined') return
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
