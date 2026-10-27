<template>
  <component
    :is="icon"
    :size="size"
    :stroke-width="strokeWidth"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    style="display:inline-block;vertical-align:middle;flex-shrink:0"
  />
</template>

<script setup>
import { computed } from 'vue'
import { icons } from './icons.js'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 18 },
  strokeWidth: { type: Number, default: 1.75 },
  label: { type: String, default: '' },
})

const icon = computed(() => {
  if (!icons[props.name]) {
    if (import.meta.env.DEV) console.warn(`[AppIcon] ikon "${props.name}" tidak ada di registri`)
    return null
  }
  return icons[props.name]
})
</script>
