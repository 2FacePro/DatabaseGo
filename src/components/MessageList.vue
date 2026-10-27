<template>
  <div class="msg-list">
    <div
      v-for="(m, i) in messages"
      :key="i"
      class="msg-item"
      :class="m.level"
    >
      <AppIcon
        :name="m.level === 'error' ? 'error' : m.level === 'warning' ? 'warning' : 'info'"
        :size="15"
      />
      <span>{{ m.message }}</span>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '../icons/AppIcon.vue'

defineProps({
  messages: { type: Array, default: () => [] },
})
</script>

<style scoped>
.msg-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.msg-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  line-height: 1.4;
  padding: 6px 8px;
  border-radius: 6px;
}
.msg-item.error { background: var(--err-bg); color: var(--err); }
.msg-item.warning { background: var(--warn-bg); color: var(--warn); }
.msg-item.info { background: var(--info-bg); color: var(--muted); }
</style>
