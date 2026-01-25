<script setup lang="ts">
import { NModal, NCard, NButton, NSpace } from 'naive-ui'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const { startCheckout } = useSubscription()
const isLoading = ref(false)

const features = [
  {
    icon: 'chart',
    title: 'Advanced Analytics',
    description: 'Deep dive into your performance metrics and trends',
  },
  {
    icon: 'trending',
    title: 'Progress Tracking',
    description: 'Track your strength gains and workout consistency over time',
  },
  {
    icon: 'bolt',
    title: 'Priority Support',
    description: 'Get faster responses and dedicated support for any questions',
  },
]

async function handleUpgrade() {
  isLoading.value = true
  try {
    await startCheckout()
  } catch (error) {
    console.error('Checkout failed:', error)
  } finally {
    isLoading.value = false
  }
}

function closeModal() {
  emit('update:show', false)
}
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="true"
    :close-on-esc="true"
    @update:show="emit('update:show', $event)"
  >
    <NCard
      style="width: 480px; max-width: 95vw"
      :bordered="false"
      size="large"
      role="dialog"
      aria-modal="true"
    >
      <template #header>
        <div class="modal-header">
          <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span>Upgrade to Premium</span>
        </div>
      </template>

      <div class="modal-content">
        <p class="intro-text">
          Unlock the full potential of your training with premium features.
        </p>

        <div class="features-list">
          <div v-for="feature in features" :key="feature.title" class="feature-item">
            <div class="feature-icon">
              <svg v-if="feature.icon === 'chart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <svg v-else-if="feature.icon === 'trending'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="feature-text">
              <h4>{{ feature.title }}</h4>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>

        <div class="pricing-section">
          <div class="price">
            <span class="amount">$9.99</span>
            <span class="period">/month</span>
          </div>
          <ul class="benefits">
            <li>
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Cancel anytime
            </li>
            <li>
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Full analytics access
            </li>
            <li>
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Priority support
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeModal">
            Maybe Later
          </NButton>
          <NButton
            type="primary"
            :loading="isLoading"
            @click="handleUpgrade"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </template>
            Upgrade Now
          </NButton>
        </NSpace>
      </template>
    </NCard>
  </NModal>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
}

.modal-content {
  padding: 8px 0;
}

.intro-text {
  color: #a1a1aa;
  margin-bottom: 24px;
  font-size: 15px;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.feature-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.feature-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 10px;
  color: #a78bfa;
}

.feature-text h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.feature-text p {
  margin: 0;
  font-size: 13px;
  color: #a1a1aa;
}

.pricing-section {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.price {
  margin-bottom: 16px;
}

.price .amount {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
}

.price .period {
  font-size: 16px;
  color: #a1a1aa;
}

.benefits {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benefits li {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #d4d4d8;
}
</style>
