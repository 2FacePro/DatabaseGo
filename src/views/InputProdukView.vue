<template>
  <div ref="root"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import html from '@/../public/input-produk-kasgo.html?raw'

const root = ref(null)

onMounted(() => {
  if (!root.value) return
  root.value.innerHTML = html
  const scripts = root.value.querySelectorAll('script')
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script')
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value)
    })
    newScript.textContent = oldScript.textContent
    oldScript.parentNode.replaceChild(newScript, oldScript)
  })
})
</script>
