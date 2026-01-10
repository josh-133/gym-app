<script setup lang="ts">
definePageMeta({
  layout: false,
})

const auth = useAuth()

// Redirect to dashboard if already logged in
onMounted(async () => {
  await auth.initialize()
  if (auth.isAuthenticated.value) {
    await navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
    <!-- Hero Section -->
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="p-6">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <span class="font-bold text-2xl text-white">GymApp</span>
          </div>
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/login"
              class="text-white/90 hover:text-white font-medium transition-colors"
            >
              Log In
            </NuxtLink>
            <NuxtLink
              to="/signup"
              class="bg-white text-indigo-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Get Started
            </NuxtLink>
          </div>
        </div>
      </header>

      <!-- Hero Content -->
      <main class="flex-1 flex items-center">
        <div class="max-w-7xl mx-auto px-6 py-12 lg:py-24">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <!-- Text Content -->
            <div class="text-center lg:text-left">
              <h1 class="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Track Your
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
                  Fitness Journey
                </span>
              </h1>
              <p class="text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0">
                Log workouts, track progress, and get AI-powered insights to help you achieve your fitness goals faster.
              </p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <NuxtLink
                  to="/signup"
                  class="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors shadow-lg"
                >
                  Start Free Trial
                </NuxtLink>
                <a
                  href="#features"
                  class="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>

            <!-- Hero Image/Stats -->
            <div class="hidden lg:block">
              <div class="relative">
                <!-- Stats Cards -->
                <div class="absolute -top-4 -left-4 bg-white rounded-2xl p-4 shadow-xl animate-fade-in">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900">127</p>
                      <p class="text-sm text-gray-500">Workouts Logged</p>
                    </div>
                  </div>
                </div>

                <div class="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-xl animate-fade-in" style="animation-delay: 0.2s">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-gray-900">+23%</p>
                      <p class="text-sm text-gray-500">Strength Gain</p>
                    </div>
                  </div>
                </div>

                <!-- Main Card -->
                <div class="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                  <div class="aspect-square flex items-center justify-center">
                    <div class="text-center">
                      <div class="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
                        </svg>
                      </div>
                      <p class="text-white text-xl font-semibold">Ready to lift?</p>
                      <p class="text-white/60">Start your workout now</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Features Section -->
    <section id="features" class="bg-white py-24">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to succeed
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you track, analyze, and improve your fitness journey.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div class="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center mb-6">
              <svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Workout Logging</h3>
            <p class="text-gray-600">
              Easily log your sets, reps, and weights. Track both strength training and cardio workouts.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div class="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6">
              <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Progress Analytics</h3>
            <p class="text-gray-600">
              Visualize your progress with beautiful charts. Track volume, frequency, and strength trends.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div class="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center mb-6">
              <svg class="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Personal Records</h3>
            <p class="text-gray-600">
              Automatically track your PRs and celebrate your achievements with badges and milestones.
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div class="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
              <svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">AI Insights</h3>
            <p class="text-gray-600">
              Get personalized recommendations and insights powered by AI to optimize your training.
            </p>
          </div>

          <!-- Feature 5 -->
          <div class="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div class="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center mb-6">
              <svg class="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Exercise Library</h3>
            <p class="text-gray-600">
              Access a comprehensive library of exercises with instructions, videos, and muscle targeting.
            </p>
          </div>

          <!-- Feature 6 -->
          <div class="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
              <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Rest Timer</h3>
            <p class="text-gray-600">
              Built-in rest timer to keep your workouts on track and optimize your recovery between sets.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gray-900 py-24">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-white mb-6">
          Ready to transform your fitness?
        </h2>
        <p class="text-xl text-gray-400 mb-8">
          Join thousands of people who are already tracking their progress and achieving their goals.
        </p>
        <NuxtLink
          to="/signup"
          class="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
        >
          Get Started for Free
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-950 py-12">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </div>
            <span class="font-bold text-white">GymApp</span>
          </div>
          <p class="text-gray-500 text-sm">
            &copy; {{ new Date().getFullYear() }} GymApp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
