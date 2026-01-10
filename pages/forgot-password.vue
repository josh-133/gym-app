<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, NAlert } from 'naive-ui'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
})

const auth = useAuth()

const schema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email'),
  })
)

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: schema,
})

const [email, emailAttrs] = defineField('email')

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  error.value = null

  try {
    await auth.resetPassword(values.email)
    success.value = true
  } catch (e: any) {
    error.value = e.message || 'Failed to send reset email'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="animate-fade-in">
    <NCard class="shadow-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Enter your email to receive a reset link</p>
      </div>

      <!-- Success Message -->
      <NAlert v-if="success" type="success" class="mb-4">
        Check your email for a password reset link. It may take a few minutes to arrive.
      </NAlert>

      <!-- Error Alert -->
      <NAlert v-if="error" type="error" class="mb-4" closable @close="error = null">
        {{ error }}
      </NAlert>

      <!-- Reset Form -->
      <form v-if="!success" @submit.prevent="onSubmit">
        <NForm>
          <NFormItem label="Email" :validation-status="errors.email ? 'error' : undefined" :feedback="errors.email">
            <NInput
              v-model:value="email"
              v-bind="emailAttrs"
              placeholder="you@example.com"
              type="email"
              size="large"
            />
          </NFormItem>

          <NButton
            type="primary"
            size="large"
            block
            attr-type="submit"
            :loading="loading"
          >
            Send Reset Link
          </NButton>
        </NForm>
      </form>

      <!-- Back to Login -->
      <p class="text-center text-gray-500 dark:text-gray-400 mt-6">
        Remember your password?
        <NuxtLink to="/login" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
          Sign in
        </NuxtLink>
      </p>
    </NCard>
  </div>
</template>
