<script setup lang="ts">
definePageMeta({
  layout: false,
})

const auth = useAuth()

onMounted(async () => {
  await auth.initialize()
  if (auth.isAuthenticated.value) {
    await navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-[#111111]">
    <!-- Header -->
    <header class="absolute top-0 left-0 right-0 z-10">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary-900 dark:bg-white flex items-center justify-center">
              <svg class="w-6 h-6 text-white dark:text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
              </svg>
            </div>
            <span class="font-semibold text-xl text-primary-900 dark:text-white">GymTracker</span>
          </div>
          <div class="flex items-center gap-6">
            <NuxtLink
              to="/login"
              class="text-primary-900 dark:text-white font-medium hover:text-primary-700 dark:hover:text-gray-300"
            >
              Log In
            </NuxtLink>
            <NuxtLink
              to="/signup"
              class="bg-primary-900 dark:bg-white text-white dark:text-primary-900 px-6 py-2.5 rounded-full font-medium hover:bg-primary-800 dark:hover:bg-gray-100 transition-colors"
            >
              Get Started
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="min-h-screen flex items-center pt-20">
      <div class="max-w-7xl mx-auto px-6 py-20">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <!-- Text Content -->
          <div>
            <h1 class="text-5xl lg:text-6xl font-bold text-primary-900 dark:text-white leading-tight mb-6">
              Track your
              <span class="text-accent-500">strength.</span>
              <br />
              See your progress.
            </h1>
            <p class="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-lg">
              The simple, no-nonsense workout tracker. Log sets, track PRs, and watch yourself get stronger.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <NuxtLink
                to="/signup"
                class="inline-flex items-center justify-center bg-primary-900 dark:bg-white text-white dark:text-primary-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-800 dark:hover:bg-gray-100 transition-colors"
              >
                Start Free
                <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </NuxtLink>
              <a
                href="#features"
                class="inline-flex items-center justify-center border-2 border-primary-200 dark:border-gray-700 text-primary-900 dark:text-white px-8 py-4 rounded-full font-semibold text-lg hover:border-primary-900 dark:hover:border-white transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="hidden lg:block">
            <div class="relative">
              <!-- Phone mockup -->
              <div class="bg-gray-50 dark:bg-[#1a1a1a] rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
                <div class="space-y-4">
                  <!-- Today's workout card -->
                  <div class="bg-white dark:bg-[#222222] rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-4">
                      <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Today</span>
                      <span class="text-xs px-2 py-1 rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 font-medium">Active</span>
                    </div>
                    <h3 class="text-xl font-bold text-primary-900 dark:text-white mb-1">Push Day</h3>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">4 exercises completed</p>
                  </div>

                  <!-- Stats row -->
                  <div class="grid grid-cols-3 gap-3">
                    <div class="bg-white dark:bg-[#222222] rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                      <p class="text-2xl font-bold text-primary-900 dark:text-white">127</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Workouts</p>
                    </div>
                    <div class="bg-white dark:bg-[#222222] rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                      <p class="text-2xl font-bold text-primary-900 dark:text-white">12</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Day Streak</p>
                    </div>
                    <div class="bg-white dark:bg-[#222222] rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                      <p class="text-2xl font-bold text-accent-500">8</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">New PRs</p>
                    </div>
                  </div>

                  <!-- Recent PR -->
                  <div class="bg-accent-50 dark:bg-accent-900/20 rounded-2xl p-4 border border-accent-100 dark:border-accent-900/30">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <p class="font-semibold text-primary-900 dark:text-white">New PR!</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Bench Press: 100kg</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 bg-gray-50 dark:bg-[#0d0d0d]">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-primary-900 dark:text-white mb-4">
            Everything you need
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Simple tools to help you track progress and stay consistent.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Feature 1 -->
          <div class="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
            <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-primary-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-primary-900 dark:text-white mb-2">Quick Logging</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Log sets in seconds. Weight, reps, done. No complicated forms.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
            <div class="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-primary-900 dark:text-white mb-2">Progress Charts</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Watch your strength climb with clear, simple progress charts.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
            <div class="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-primary-900 dark:text-white mb-2">PR Tracking</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Automatic personal record detection. Celebrate every win.
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
            <div class="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-primary-900 dark:text-white mb-2">Rest Timer</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Built-in timer to keep your rest periods on track.
            </p>
          </div>

          <!-- Feature 5 -->
          <div class="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
            <div class="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-primary-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-primary-900 dark:text-white mb-2">Exercise Library</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Hundreds of exercises with muscle targeting info.
            </p>
          </div>

          <!-- Feature 6 -->
          <div class="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
            <div class="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-primary-900 dark:text-white mb-2">Workout History</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Full history of every workout, set, and rep you've done.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 bg-primary-900 dark:bg-white">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-white dark:text-primary-900 mb-6">
          Ready to get stronger?
        </h2>
        <p class="text-xl text-gray-300 dark:text-gray-600 mb-10">
          Join thousands of lifters tracking their progress.
        </p>
        <NuxtLink
          to="/signup"
          class="inline-flex items-center justify-center bg-white dark:bg-primary-900 text-primary-900 dark:text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
        >
          Get Started Free
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 bg-gray-50 dark:bg-[#0d0d0d] border-t border-gray-100 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary-900 dark:bg-white flex items-center justify-center">
              <svg class="w-5 h-5 text-white dark:text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h2m12 0h2M6 7v10M18 7v10M8 7h8M8 17h8M4 17h2m12 0h2" />
              </svg>
            </div>
            <span class="font-semibold text-primary-900 dark:text-white">GymTracker</span>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            &copy; {{ new Date().getFullYear() }} GymTracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
