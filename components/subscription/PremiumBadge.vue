<script setup lang="ts">
defineProps<{
  size?: 'small' | 'medium'
}>()
</script>

<template>
  <span
    class="premium-badge"
    :class="{ 'premium-badge--small': size === 'small' }"
  >
    PRO
  </span>
</template>

<style scoped>
.premium-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #1a1a2e;
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  border-radius: 4px;
  text-transform: uppercase;
}

.premium-badge--small {
  padding: 1px 6px;
  font-size: 9px;
}
</style>
