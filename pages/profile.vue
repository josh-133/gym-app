<script setup lang="ts">
import { NCard, NButton, NForm, NFormItem, NInput, NSelect, NAvatar, NTabs, NTabPane, NDivider, NSwitch, NTag, NModal } from 'naive-ui'
import PremiumBadge from '~/components/subscription/PremiumBadge.vue'
import { workoutsToCSV, downloadCSV } from '~/utils/csvExport'

definePageMeta({
  middleware: ['auth'],
})

const auth = useAuth()
const uiStore = useUIStore()
const route = useRoute()
const router = useRouter()
const { isPremium, status, openCustomerPortal } = useSubscription()
const notification = useNotification()
const { workouts, loadWorkouts } = useWorkoutHistory()
const { measurements, fetchMeasurements } = useBodyMeasurements()
const { goals, fetchGoals } = useGoals()

// Load data for export
onMounted(() => {
  loadWorkouts()
  fetchMeasurements()
  fetchGoals()
})

// Tab state - read from query parameter
const activeTab = ref<string>('profile')

// Set initial tab from query parameter
onMounted(() => {
  const tab = route.query.tab
  if (tab === 'settings' || tab === 'profile') {
    activeTab.value = tab
  }
})

// Watch for route changes to update tab
watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'settings' || tab === 'profile') {
      activeTab.value = tab
    }
  }
)

// Update URL when tab changes
function handleTabChange(tabName: string) {
  activeTab.value = tabName
  router.replace({ query: { ...route.query, tab: tabName } })
}

const isManagingSubscription = ref(false)

// Delete account confirmation
const showDeleteModal = ref(false)
const deleteConfirmText = ref('')
const isDeleting = ref(false)

async function handleDeleteAccount() {
  if (deleteConfirmText.value !== 'DELETE') return

  isDeleting.value = true
  try {
    // In a real app, call an API to delete the account
    // For now, just sign out
    await auth.signOut()
    await navigateTo('/login')
  } catch (error) {
    console.error('Delete account error:', error)
    notification.error('Failed to delete account. Please try again.')
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
  }
}

async function handleManageSubscription() {
  isManagingSubscription.value = true
  try {
    await openCustomerPortal()
  } catch (error) {
    console.error('Failed to open portal:', error)
    notification.error('Failed to open subscription portal. Please try again.')
  } finally {
    isManagingSubscription.value = false
  }
}

// Profile form
const displayName = ref('')
const bio = ref('')
const fitnessGoal = ref<string | null>(null)
const experienceLevel = ref<string | null>(null)
const unitSystem = ref('metric')

const saving = ref(false)

// Watch for profile data to load and update form
watch(
  () => auth.profile.value,
  (newProfile) => {
    if (newProfile) {
      displayName.value = newProfile.display_name || ''
      bio.value = newProfile.bio || ''
      fitnessGoal.value = newProfile.fitness_goal || null
      experienceLevel.value = newProfile.experience_level || null
      unitSystem.value = newProfile.unit_system || 'metric'
    }
  },
  { immediate: true }
)

const fitnessGoalOptions = [
  { label: 'Build Muscle', value: 'build_muscle' },
  { label: 'Lose Weight', value: 'lose_weight' },
  { label: 'Maintain Fitness', value: 'maintain' },
  { label: 'Increase Strength', value: 'increase_strength' },
  { label: 'Improve Endurance', value: 'improve_endurance' },
]

const experienceOptions = [
  { label: 'Beginner (0-1 years)', value: 'beginner' },
  { label: 'Intermediate (1-3 years)', value: 'intermediate' },
  { label: 'Advanced (3+ years)', value: 'advanced' },
]

const unitOptions = [
  { label: 'Metric (kg, km)', value: 'metric' },
  { label: 'Imperial (lb, mi)', value: 'imperial' },
]

// Auto-save unit system when changed (separate from profile form)
const savingUnits = ref(false)
watch(unitSystem, async (newValue, oldValue) => {
  // Only save if the value actually changed and profile is loaded
  if (oldValue && newValue !== oldValue && auth.profile.value) {
    savingUnits.value = true
    try {
      await auth.updateProfile({ unit_system: newValue })
      notification.success('Unit system updated!')
    } catch (error) {
      console.error('Failed to update unit system:', error)
      notification.error('Failed to update unit system.')
      // Revert on error
      unitSystem.value = oldValue
    } finally {
      savingUnits.value = false
    }
  }
})

async function saveProfile() {
  saving.value = true
  try {
    await auth.updateProfile({
      display_name: displayName.value || null,
      bio: bio.value || null,
      fitness_goal: fitnessGoal.value,
      experience_level: experienceLevel.value,
      unit_system: unitSystem.value,
    })
    notification.success('Profile saved successfully!')
  } catch (error) {
    console.error('Save profile error:', error)
    notification.error('Failed to save profile. Please try again.')
  } finally {
    saving.value = false
  }
}

async function handleSignOut() {
  try {
    await auth.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
  }
  // Always navigate to login, even if signOut fails
  await navigateTo('/login')
}

// Export all user data
const isExporting = ref(false)
const isExportingCSV = ref(false)

async function exportCSV() {
  isExportingCSV.value = true
  try {
    const csv = workoutsToCSV(workouts.value as any)
    downloadCSV(csv, `workout-history-${new Date().toISOString().split('T')[0]}.csv`)
    notification.success('CSV exported successfully!')
  } catch (error) {
    console.error('CSV export error:', error)
    notification.error('Failed to export CSV.')
  } finally {
    isExportingCSV.value = false
  }
}

async function exportData() {
  isExporting.value = true
  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: auth.profile.value ? {
        username: auth.profile.value.username,
        displayName: auth.profile.value.display_name,
        bio: auth.profile.value.bio,
        fitnessGoal: auth.profile.value.fitness_goal,
        experienceLevel: auth.profile.value.experience_level,
        unitSystem: auth.profile.value.unit_system,
        createdAt: auth.profile.value.created_at,
      } : null,
      workouts: workouts.value,
      bodyMeasurements: measurements.value,
      goals: goals.value,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileName = `gym-tracker-export-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileName)
    linkElement.click()

    notification.success('Data exported successfully!')
  } catch (error) {
    console.error('Export error:', error)
    notification.error('Failed to export data. Please try again.')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
    <!-- Loading State -->
    <div v-if="auth.loading.value" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <template v-else>
    <!-- Profile Header -->
    <NCard>
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <NAvatar
          round
          :size="100"
          :src="auth.profile.value?.avatar_url || undefined"
          class="text-3xl"
        >
          {{ auth.profile.value?.display_name?.[0] || auth.profile.value?.username?.[0] || 'U' }}
        </NAvatar>
        <div class="text-center sm:text-left">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ auth.profile.value?.display_name || auth.profile.value?.username || 'User' }}
            </h1>
            <PremiumBadge v-if="isPremium" />
          </div>
          <p class="text-gray-500 dark:text-gray-400">
            @{{ auth.profile.value?.username || 'username' }}
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Member since {{ new Date(auth.profile.value?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}
          </p>
        </div>
      </div>
    </NCard>

    <!-- Tabs -->
    <NTabs type="line" animated :value="activeTab" @update:value="handleTabChange">
      <!-- Profile Tab -->
      <NTabPane name="profile" tab="Profile">
        <NCard class="mt-4">
          <form @submit.prevent="saveProfile">
            <NForm>
              <NFormItem label="Display Name">
                <NInput v-model:value="displayName" placeholder="Your display name" />
              </NFormItem>

              <NFormItem label="Bio">
                <NInput
                  v-model:value="bio"
                  type="textarea"
                  placeholder="Tell us about yourself..."
                  :rows="3"
                />
              </NFormItem>

              <NFormItem label="Fitness Goal">
                <NSelect
                  v-model:value="fitnessGoal"
                  :options="fitnessGoalOptions"
                  placeholder="Select your goal"
                />
              </NFormItem>

              <NFormItem label="Experience Level">
                <NSelect
                  v-model:value="experienceLevel"
                  :options="experienceOptions"
                  placeholder="Select your level"
                />
              </NFormItem>

              <NButton
                type="primary"
                :loading="saving"
                @click="saveProfile"
              >
                Save Changes
              </NButton>
            </NForm>
          </form>
        </NCard>
      </NTabPane>

      <!-- Settings Tab -->
      <NTabPane name="settings" tab="Settings">
        <div class="space-y-4 mt-4">
          <!-- Subscription -->
          <NCard title="Subscription">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-white">Plan</p>
                  <NTag v-if="isPremium" type="success" size="small">Premium</NTag>
                  <NTag v-else type="default" size="small">Free</NTag>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ isPremium ? 'You have access to all premium features' : 'Upgrade to unlock premium features' }}
                </p>
              </div>
              <NButton
                v-if="isPremium"
                :loading="isManagingSubscription"
                @click="handleManageSubscription"
              >
                Manage
              </NButton>
              <NButton
                v-else
                type="primary"
                @click="navigateTo('/upgrade')"
              >
                Upgrade
              </NButton>
            </div>
          </NCard>

          <!-- Units -->
          <NCard title="Units">
            <NFormItem label="Measurement System">
              <NSelect
                v-model:value="unitSystem"
                :options="unitOptions"
              />
            </NFormItem>
          </NCard>

          <!-- Appearance -->
          <NCard title="Appearance">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Theme</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Current: {{ uiStore.theme === 'system' ? 'System' : uiStore.theme === 'dark' ? 'Dark' : 'Light' }}
                </p>
              </div>
              <NButton @click="uiStore.toggleTheme">
                Toggle Theme
              </NButton>
            </div>
          </NCard>

          <!-- Data Export -->
          <NCard title="Your Data">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Export as JSON</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Full data export including profile, measurements, and goals
                  </p>
                </div>
                <NButton :loading="isExporting" @click="exportData">
                  <template #icon>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </template>
                  JSON
                </NButton>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Export as CSV</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Workout history as spreadsheet (one row per set)
                  </p>
                </div>
                <NButton :loading="isExportingCSV" @click="exportCSV">
                  <template #icon>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </template>
                  CSV
                </NButton>
              </div>
            </div>
          </NCard>

          <!-- Import Data -->
          <NCard title="Import Data">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Import from Other Apps</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Import workout history from Strong, Hevy, or FitNotes
                </p>
              </div>
              <NuxtLink to="/settings/import">
                <NButton>
                  <template #icon>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </template>
                  Import
                </NButton>
              </NuxtLink>
            </div>
          </NCard>

          <!-- Account -->
          <NCard title="Account">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Email</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ auth.user.value?.email }}
                  </p>
                </div>
              </div>

              <NDivider />

              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Sign Out</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Sign out of your account on this device
                  </p>
                </div>
                <NButton type="error" @click="handleSignOut">
                  Sign Out
                </NButton>
              </div>
            </div>
          </NCard>

          <!-- Danger Zone -->
          <NCard title="Danger Zone">
            <div class="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div>
                <p class="font-medium text-red-700 dark:text-red-400">Delete Account</p>
                <p class="text-sm text-red-600 dark:text-red-500">
                  Permanently delete your account and all data
                </p>
              </div>
              <NButton type="error" ghost @click="showDeleteModal = true">
                Delete
              </NButton>
            </div>
          </NCard>
        </div>
      </NTabPane>
    </NTabs>

    <!-- Delete Account Confirmation Modal -->
    <NModal
      v-model:show="showDeleteModal"
      preset="card"
      title="Delete Account"
      style="width: 90%; max-width: 450px;"
    >
      <div class="space-y-4">
        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p class="text-red-700 dark:text-red-400 font-medium">Warning: This action cannot be undone</p>
          <p class="text-red-600 dark:text-red-500 text-sm mt-1">
            All your data including workouts, progress, and settings will be permanently deleted.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type <span class="font-mono font-bold">DELETE</span> to confirm
          </label>
          <NInput
            v-model:value="deleteConfirmText"
            placeholder="Type DELETE to confirm"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <NButton block @click="showDeleteModal = false; deleteConfirmText = ''">
            Cancel
          </NButton>
          <NButton
            type="error"
            block
            :disabled="deleteConfirmText !== 'DELETE'"
            :loading="isDeleting"
            @click="handleDeleteAccount"
          >
            Delete My Account
          </NButton>
        </div>
      </div>
    </NModal>
    </template>
  </div>
</template>
