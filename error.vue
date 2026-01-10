<script setup lang="ts">
import { NButton } from 'naive-ui'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const errorTitle = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'Page Not Found'
    case 403:
      return 'Access Denied'
    case 500:
      return 'Server Error'
    default:
      return 'Something Went Wrong'
  }
})

const errorDescription = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return "The page you're looking for doesn't exist or has been moved."
    case 403:
      return "You don't have permission to access this page."
    case 500:
      return "We're experiencing technical difficulties. Please try again later."
    default:
      return props.error.message || 'An unexpected error occurred.'
  }
})

const errorIcon = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return '🔍'
    case 403:
      return '🔒'
    case 500:
      return '⚠️'
    default:
      return '😕'
  }
})

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <!-- Error Icon -->
      <div class="text-8xl mb-6">{{ errorIcon }}</div>

      <!-- Error Code -->
      <p class="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">
        {{ error.statusCode }}
      </p>

      <!-- Error Title -->
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {{ errorTitle }}
      </h1>

      <!-- Error Description -->
      <p class="text-gray-500 dark:text-gray-400 mb-8">
        {{ errorDescription }}
      </p>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <NButton type="primary" size="large" @click="handleError">
          Go Home
        </NButton>
        <NButton size="large" @click="$router.back()">
          Go Back
        </NButton>
      </div>

      <!-- Help Text -->
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-8">
        If this problem persists, please contact support.
      </p>
    </div>
  </div>
</template>
