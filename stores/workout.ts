import { defineStore } from 'pinia'
import type { WorkoutSession, ExerciseLog, Set, Exercise, CardioLog } from '~/types/database'

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
    },

    pauseWorkout() {
      if (this.isActive && !this.isPaused) {
        this.isPaused = true
        this.pausedAt = new Date()
      }
    },

    resumeWorkout() {
      if (this.isPaused && this.pausedAt) {
        this.totalPausedTime += Date.now() - this.pausedAt.getTime()
        this.isPaused = false
        this.pausedAt = null
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
    },

    removeExercise(index: number) {
      this.exerciseLogs.splice(index, 1)
      this.exerciseLogs.forEach((log, i) => {
        log.order_index = i
      })
    },

    addSet(exerciseIndex: number) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log) return

      const lastSet = log.sets[log.sets.length - 1]
      const newSet: ActiveSet = {
        set_number: log.sets.length + 1,
        reps: lastSet?.reps ?? null,
        weight_kg: lastSet?.weight_kg ?? null,
        rpe: null,
        set_type: 'working',
        completed_at: null,
        is_pr: false,
      }
      log.sets.push(newSet)
    },

    completeSet(exerciseIndex: number, setIndex: number, data: Partial<ActiveSet>) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.sets[setIndex]) return

      log.sets[setIndex] = {
        ...log.sets[setIndex],
        ...data,
        completed_at: new Date().toISOString(),
      }
    },

    updateSet(exerciseIndex: number, setIndex: number, data: Partial<ActiveSet>) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.sets[setIndex]) return

      log.sets[setIndex] = {
        ...log.sets[setIndex],
        ...data,
      }
    },

    removeSet(exerciseIndex: number, setIndex: number) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log) return

      log.sets.splice(setIndex, 1)
      log.sets.forEach((set, i) => {
        set.set_number = i + 1
      })
    },

    uncompleteSet(exerciseIndex: number, setIndex: number) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.sets[setIndex]) return

      log.sets[setIndex] = {
        ...log.sets[setIndex],
        completed_at: null,
      }
    },

    updateCardioLog(exerciseIndex: number, data: Partial<CardioLog>) {
      const log = this.exerciseLogs[exerciseIndex]
      if (!log || !log.cardio_log) return

      log.cardio_log = { ...log.cardio_log, ...data }
    },

    startRestTimer(seconds: number) {
      this.restTimerEndAt = new Date(Date.now() + seconds * 1000)
    },

    cancelRestTimer() {
      this.restTimerEndAt = null
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
    },
  },
})
