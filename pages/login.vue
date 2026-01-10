<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, NAlert, NDivider } from 'naive-ui'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

definePageMeta({
  layout: 'auth',
})

const auth = useAuth()

const loginSchema = toTypedSchema(
  z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
)

const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: loginSchema,
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const loading = ref(false)
const error = ref<string | null>(null)

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  error.value = null

  try {
    await auth.signIn(values.email, values.password)
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e.message || 'Failed to sign in'
  } finally {
    loading.value = false
  }
})

async function handleGoogleSignIn() {
  loading.value = true
  error.value = null

  try {
    await auth.signInWithGoogle()
  } catch (e: any) {
    error.value = e.message || 'Failed to sign in with Google'
    loading.value = false
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <NCard class="shadow-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Sign in to continue your fitness journey</p>
      </div>

      <!-- Error Alert -->
      <NAlert v-if="error" type="error" class="mb-4" closable @close="error = null">
        {{ error }}
      </NAlert>

      <!-- Login Form -->
      <form @submit.prevent="onSubmit">
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

          <NFormItem label="Password" :validation-status="errors.password ? 'error' : undefined" :feedback="errors.password">
            <NInput
              v-model:value="password"
              v-bind="passwordAttrs"
              placeholder="Enter your password"
              type="password"
              show-password-on="click"
              size="large"
            />
          </NFormItem>

          <div class="flex justify-end mb-4">
            <NuxtLink to="/forgot-password" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot password?
            </NuxtLink>
          </div>

          <NButton
            type="primary"
            size="large"
            block
            attr-type="submit"
            :loading="loading"
          >
            Sign In
          </NButton>
        </NForm>
      </form>

      <!-- Divider -->
      <NDivider>or continue with</NDivider>

      <!-- Social Login -->
      <NButton
        size="large"
        block
        :loading="loading"
        @click="handleGoogleSignIn"
      >
        <template #icon>
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </template>
        Continue with Google
      </NButton>

      <!-- Sign Up Link -->
      <p class="text-center text-gray-500 dark:text-gray-400 mt-6">
        Don't have an account?
        <NuxtLink to="/signup" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
          Sign up
        </NuxtLink>
      </p>
    </NCard>
  </div>
</template>
