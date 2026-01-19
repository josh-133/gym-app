<script setup lang="ts">
import { NCard, NButton, NProgress, NTag, NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NEmpty } from 'naive-ui'
import type { GoalType, CreateGoalInput } from '~/composables/useGoals'

definePageMeta({
  middleware: ['auth'],
})

const { goals, loading, fetchGoals, createGoal, updateGoalProgress, deleteGoal, activeGoals, completedGoals, getProgressPercentage, getGoalTypeInfo } = useGoals()

// Fetch goals on mount
onMounted(() => {
  fetchGoals()
})

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const saving = ref(false)
const editingGoalId = ref<string | null>(null)

const newGoal = ref<CreateGoalInput>({
  goal_type: 'strength',
  title: '',
  description: '',
  target_value: 0,
  current_value: 0,
  unit: 'kg',
  exercise_id: '',
  deadline: '',
})

const goalTypeOptions = [
  { label: 'Body Weight', value: 'weight' },
  { label: 'Strength', value: 'strength' },
  { label: 'Cardio', value: 'cardio' },
  { label: 'Workout Frequency', value: 'workout_frequency' },
  { label: 'Custom', value: 'custom' },
]

const unitOptions = [
  { label: 'kg', value: 'kg' },
  { label: 'lbs', value: 'lbs' },
  { label: 'km', value: 'km' },
  { label: 'miles', value: 'miles' },
  { label: 'workouts', value: 'workouts' },
  { label: 'days', value: 'days' },
  { label: 'minutes', value: 'minutes' },
  { label: 'reps', value: 'reps' },
]

function resetForm() {
  newGoal.value = {
    goal_type: 'strength',
    title: '',
    description: '',
    target_value: 0,
    current_value: 0,
    unit: 'kg',
    exercise_id: '',
    deadline: '',
  }
  editingGoalId.value = null
}

async function handleAddGoal() {
  if (!newGoal.value.title.trim() || newGoal.value.target_value <= 0) return

  saving.value = true
  try {
    await createGoal(newGoal.value)
    showAddModal.value = false
    resetForm()
  } catch (err) {
    console.error('Error adding goal:', err)
  } finally {
    saving.value = false
  }
}

function openEditModal(goal: typeof goals.value[0]) {
  editingGoalId.value = goal.id
  newGoal.value = {
    goal_type: goal.goal_type,
    title: goal.title,
    description: goal.description || '',
    target_value: goal.target_value,
    current_value: goal.current_value,
    unit: goal.unit,
    exercise_id: goal.exercise_id || '',
    deadline: goal.deadline || '',
  }
  showEditModal.value = true
}

async function handleUpdateProgress() {
  if (!editingGoalId.value) return

  saving.value = true
  try {
    await updateGoalProgress(editingGoalId.value, newGoal.value.current_value || 0)
    showEditModal.value = false
    resetForm()
  } catch (err) {
    console.error('Error updating goal:', err)
  } finally {
    saving.value = false
  }
}

async function handleDeleteGoal(id: string) {
  if (!confirm('Are you sure you want to delete this goal?')) return

  try {
    await deleteGoal(id)
  } catch (err) {
    console.error('Error deleting goal:', err)
  }
}

function formatDeadline(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `${diffDays} days left`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Goals</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Set and track your fitness goals</p>
      </div>
      <NButton type="primary" @click="showAddModal = true">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </template>
        Add Goal
      </NButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="goals.length === 0" class="card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
        <span class="text-3xl">🎯</span>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Goals Yet</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Set your first fitness goal to start tracking your progress!</p>
      <NButton type="primary" @click="showAddModal = true">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </template>
        Create Your First Goal
      </NButton>
    </div>

    <template v-else>
      <!-- Active Goals -->
      <div v-if="activeGoals.length > 0">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Goals</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NCard v-for="goal in activeGoals" :key="goal.id" class="relative">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ getGoalTypeInfo(goal.goal_type).icon }}</span>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ goal.title }}</h3>
                  <NTag :type="getGoalTypeInfo(goal.goal_type).color as any" size="small">
                    {{ getGoalTypeInfo(goal.goal_type).label }}
                  </NTag>
                </div>
              </div>
              <div class="flex gap-1">
                <button
                  class="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  @click="openEditModal(goal)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  @click="handleDeleteGoal(goal.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <p v-if="goal.description" class="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {{ goal.description }}
            </p>

            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">Progress</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ goal.current_value }} / {{ goal.target_value }} {{ goal.unit }}
                </span>
              </div>
              <NProgress
                type="line"
                :percentage="getProgressPercentage(goal)"
                :height="10"
                :border-radius="5"
                status="success"
              />
            </div>

            <div v-if="goal.deadline" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {{ formatDeadline(goal.deadline) }}
            </div>
          </NCard>
        </div>
      </div>

      <!-- Completed Goals -->
      <div v-if="completedGoals.length > 0">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Completed Goals</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NCard v-for="goal in completedGoals" :key="goal.id" class="relative opacity-75">
            <div class="absolute top-2 right-2">
              <span class="text-green-500">✓</span>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">{{ getGoalTypeInfo(goal.goal_type).icon }}</span>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ goal.title }}</h3>
                <p class="text-xs text-green-600 dark:text-green-400">
                  Completed {{ new Date(goal.completed_at!).toLocaleDateString() }}
                </p>
              </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ goal.target_value }} {{ goal.unit }} achieved!
            </p>
          </NCard>
        </div>
      </div>
    </template>

    <!-- Add Goal Modal -->
    <NModal
      v-model:show="showAddModal"
      preset="card"
      title="Add New Goal"
      :style="{ maxWidth: '500px' }"
      :mask-closable="!saving"
      :closable="!saving"
    >
      <NForm>
        <NFormItem label="Goal Type" required>
          <NSelect
            v-model:value="newGoal.goal_type"
            :options="goalTypeOptions"
            placeholder="Select goal type"
          />
        </NFormItem>

        <NFormItem label="Goal Title" required>
          <NInput v-model:value="newGoal.title" placeholder="e.g., Bench Press 100kg" />
        </NFormItem>

        <NFormItem label="Description">
          <NInput
            v-model:value="newGoal.description"
            type="textarea"
            placeholder="Optional description..."
            :rows="2"
          />
        </NFormItem>

        <div class="grid grid-cols-2 gap-4">
          <NFormItem label="Target Value" required>
            <NInputNumber v-model:value="newGoal.target_value" :min="0" placeholder="100" />
          </NFormItem>

          <NFormItem label="Unit" required>
            <NSelect
              v-model:value="newGoal.unit"
              :options="unitOptions"
              placeholder="kg"
            />
          </NFormItem>
        </div>

        <NFormItem label="Starting Value">
          <NInputNumber v-model:value="newGoal.current_value" :min="0" placeholder="0" />
        </NFormItem>

        <NFormItem label="Deadline (Optional)">
          <NInput v-model:value="newGoal.deadline" type="date" />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton :disabled="saving" @click="showAddModal = false; resetForm()">
            Cancel
          </NButton>
          <NButton
            type="primary"
            :loading="saving"
            :disabled="!newGoal.title.trim() || newGoal.target_value <= 0"
            @click="handleAddGoal"
          >
            Add Goal
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- Edit/Update Progress Modal -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      title="Update Progress"
      :style="{ maxWidth: '400px' }"
      :mask-closable="!saving"
      :closable="!saving"
    >
      <NForm>
        <NFormItem label="Current Progress">
          <NInputNumber
            v-model:value="newGoal.current_value"
            :min="0"
            :max="newGoal.target_value * 2"
          />
        </NFormItem>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Target: {{ newGoal.target_value }} {{ newGoal.unit }}
        </p>
      </NForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton :disabled="saving" @click="showEditModal = false; resetForm()">
            Cancel
          </NButton>
          <NButton
            type="primary"
            :loading="saving"
            @click="handleUpdateProgress"
          >
            Update Progress
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
