<script setup lang="ts">
import { NCard, NButton, NForm, NFormItem, NInput, NSelect, NAvatar, NTabs, NTabPane, NDivider, NSwitch, NTag, NModal } from 'naive-ui'
import PremiumBadge from '~/components/subscription/PremiumBadge.vue'

definePageMeta({
  middleware: ['auth'],
})

const auth = useAuth()
const uiStore = useUIStore()
const route = useRoute()
const router = useRouter()
const { isPremium, status, openCustomerPortal } = useSubscription()
const notification = useNotification()

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
        <div class="relative">
          <NAvatar
            round
            :size="100"
            :src="auth.profile.value?.avatar_url || undefined"
            class="text-3xl"
          >
            {{ auth.profile.value?.display_name?.[0] || auth.profile.value?.username?.[0] || 'U' }}
          </NAvatar>
          <button class="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
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
