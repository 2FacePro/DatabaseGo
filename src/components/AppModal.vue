<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="modelValue" class="modal-backdrop" @click="close">
        <div class="modal" role="dialog" aria-modal="true" @click.stop>
          <div class="modal-header">
            <div class="modal-title">
              <AppIcon v-if="icon" :name="icon" :size="18" />
              <h3>{{ title }}</h3>
            </div>
            <button class="btn icon-only" type="button" @click="close" aria-label="Tutup">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import AppIcon from '../icons/AppIcon.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  z-index: 1000;
  overflow: auto;
}
.modal {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 12px;
  width: min(1100px, 100%);
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
}
.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.modal-title h3 {
  margin: 0;
  font-size: 16px;
}
.modal-body {
  padding: 16px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (max-width: 700px) {
  .modal-backdrop {
    padding: 16px 10px;
  }
  .modal {
    max-height: calc(100vh - 32px);
  }
}
</style>
