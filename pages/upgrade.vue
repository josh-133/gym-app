<script setup lang="ts">
import { NCard, NButton, NResult } from 'naive-ui'

definePageMeta({
  middleware: ['auth'],
})

const route = useRoute()
const { isPremium, status, startCheckout, openCustomerPortal, isLoading } = useSubscription()
const notification = useNotification()

const isProcessing = ref(false)

const success = computed(() => route.query.success === 'true')
const cancelled = computed(() => route.query.cancelled === 'true')

const features = [
  {
    icon: 'chart',
    title: 'Advanced Analytics',
    description: 'Deep dive into your performance metrics with detailed charts and trend analysis',
  },
  {
    icon: 'trending',
    title: 'Progress Tracking',
    description: 'Track your strength gains, body measurements, and workout consistency over time',
  },
  {
    icon: 'bolt',
    title: 'Priority Support',
    description: 'Get faster responses and dedicated support for any questions or issues',
  },
]

const benefits = [
  'Advanced analytics dashboard',
  'Detailed progress tracking',
  'Priority support',
  'Cancel anytime',
]

async function handleUpgrade() {
  isProcessing.value = true
  try {
    await startCheckout()
  } catch (error) {
    console.error('Failed to start checkout:', error)
    notification.error('Failed to start checkout. Please try again.')
  } finally {
    isProcessing.value = false
  }
}

async function handleManageSubscription() {
  isProcessing.value = true
  try {
    await openCustomerPortal()
  } catch (error) {
    console.error('Failed to open portal:', error)
    notification.error('Failed to open subscription portal. Please try again.')
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
    <!-- Success State -->
    <NCard v-if="success" class="!bg-green-50 dark:!bg-green-900/20">
      <NResult
        status="success"
        title="Welcome to Premium!"
        description="Your subscription is now active. Enjoy all premium features."
      >
        <template #footer>
          <NButton type="primary" @click="navigateTo('/dashboard')">
            Go to Dashboard
          </NButton>
        </template>
      </NResult>
    </NCard>

    <!-- Cancelled State -->
    <NCard v-else-if="cancelled" class="!bg-yellow-50 dark:!bg-yellow-900/20">
      <NResult
        status="warning"
        title="Checkout Cancelled"
        description="No worries! You can upgrade anytime when you're ready."
      >
        <template #footer>
          <NButton @click="navigateTo('/dashboard')">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </template>
            Back to Dashboard
          </NButton>
        </template>
      </NResult>
    </NCard>

    <!-- Already Premium -->
    <template v-else-if="isPremium">
      <NCard>
        <div class="text-center py-8">
          <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-4">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You're a Premium Member!
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            You have full access to all premium features. Thank you for your support!
          </p>
          <div class="flex justify-center gap-4">
            <NButton type="primary" @click="navigateTo('/dashboard')">
              Go to Dashboard
            </NButton>
          </div>
        </div>
      </NCard>

      <NCard title="Manage Subscription">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 dark:text-gray-300">
              Status: <span class="font-semibold text-green-600 dark:text-green-400">Active</span>
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Manage your billing, update payment methods, or cancel your subscription
            </p>
          </div>
          <NButton :loading="isProcessing" @click="handleManageSubscription">
            Manage Subscription
          </NButton>
        </div>
      </NCard>
    </template>

    <!-- Upgrade CTA -->
    <template v-else>
      <!-- Header -->
      <div class="text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upgrade to Premium
        </h1>
        <p class="text-lg text-gray-500 dark:text-gray-400">
          Unlock the full potential of your training with premium features
        </p>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-6">
        <NCard v-for="feature in features" :key="feature.title">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
              <svg v-if="feature.icon === 'chart'" class="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <svg v-else-if="feature.icon === 'trending'" class="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <svg v-else class="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ feature.description }}
            </p>
          </div>
        </NCard>
      </div>

      <!-- Pricing Card -->
      <NCard class="!border-violet-300 dark:!border-violet-700">
        <div class="text-center py-6">
          <div class="mb-6">
            <span class="text-5xl font-bold text-gray-900 dark:text-white">$9.99</span>
            <span class="text-xl text-gray-500 dark:text-gray-400">/month</span>
          </div>

          <ul class="space-y-3 mb-8 max-w-xs mx-auto">
            <li v-for="benefit in benefits" :key="benefit" class="flex items-center gap-3">
              <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-600 dark:text-gray-300">{{ benefit }}</span>
            </li>
          </ul>

          <NButton
            type="primary"
            size="large"
            :loading="isProcessing"
            class="!px-12"
            @click="handleUpgrade"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </template>
            Subscribe Now
          </NButton>

          <p class="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </NCard>

      <!-- Back Link -->
      <div class="text-center">
        <NButton quaternary @click="navigateTo('/dashboard')">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </template>
          Back to Dashboard
        </NButton>
      </div>
    </template>
  </div>
</template>
