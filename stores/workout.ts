import { defineStore } from 'pinia'
import type { WorkoutSession, ExerciseLog, Set, Exercise, CardioLog } from '~/types/database'

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

    addExercise(exercise: Exercise) {
      const log: ActiveExerciseLog = {
        id: crypto.randomUUID(),
        exercise,
        order_index: this.exerciseLogs.length,
        sets: [],
        cardio_log: exercise.category === 'cardio' ? {} : null,
        notes: '',
      }
      this.exerciseLogs.push(log)
      this.persistState()
    },

    removeExercise(index: number) {
      this.exerciseLogs.splice(index, 1)
      this.exerciseLogs.forEach((log, i) => {
        log.order_index = i
      })
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
