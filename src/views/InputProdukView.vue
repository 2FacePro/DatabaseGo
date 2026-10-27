<template>
  <div ref="root"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { onValue, ref as databaseRef, set } from 'firebase/database'
import { db } from '@/firebase'
import html from '@/../public/input-produk-kasgo.html?raw'

const root = ref(null)
const DATA_PATH = 'databasego'

let unsubscribe = null
let pushTimer = null

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).filter((key) => value[key] !== undefined).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

const normalizeProduct = (product) => ({
  ...product,
  units: Array.isArray(product?.units) ? product.units : [],
  batches: Array.isArray(product?.batches) ? product.batches : [],
})

const signature = (data) =>
  stableStringify({
    products: (data?.products || []).filter((product) => product && typeof product === 'object').map(normalizeProduct),
    known: { names: [], cats: [], units: [], barcodes: [], count: 0, file: '', ...data?.known },
    sticky: data?.sticky !== false,
    calc: { untung: '20', mode: 'markup', bulat: '100', ...data?.calc },
  })

const toPayload = (state) => ({
  products: state.products || [],
  known: state.known || {},
  sticky: state.sticky !== false,
  calc: state.calc || {},
  updated: Date.now(),
})

const hasProducts = (state) => Array.isArray(state?.products) && state.products.length > 0

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

  const bridge = window.__kasgo
  if (!bridge) {
    console.warn('Aplikasi input produk tidak siap, sinkronisasi database dinonaktifkan.')
    return
  }
  if (!db) {
    console.warn('Konfigurasi Firebase belum lengkap, data hanya disimpan di browser.')
    return
  }

  const dataRef = databaseRef(db, DATA_PATH)
  let applyingRemote = false
  let lastSignature = ''
  let initialized = false

  const push = (state) => {
    if (applyingRemote) return
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      const payload = toPayload(state)
      lastSignature = signature(payload)
      set(dataRef, payload).catch((error) => {
        console.error('Gagal menyimpan data ke Firebase Realtime Database:', error)
      })
    }, 300)
  }

  const applyRemote = (data) => {
    applyingRemote = true
    try {
      bridge.applyState(data)
      lastSignature = signature(data)
    } finally {
      applyingRemote = false
    }
  }

  bridge.onPersist = (state) => push(state)

  unsubscribe = onValue(
    dataRef,
    (snapshot) => {
      const cloud = snapshot.val()

      if (!initialized) {
        initialized = true
        if (!cloud) {
          if (hasProducts(bridge.state())) push(bridge.state())
          return
        }

        const local = bridge.state()
        const cloudIds = new Set((cloud.products || []).map((product) => product.id))
        const localOnly = (local.products || []).filter((product) => product && !cloudIds.has(product.id))

        if (localOnly.length) {
          const merged = {
            products: [...localOnly, ...(cloud.products || [])],
            known: cloud.known || local.known,
            sticky: cloud.sticky,
            calc: cloud.calc || local.calc,
          }
          applyRemote(merged)
          push(merged)
          return
        }
      }

      if (!cloud) return
      if (signature(cloud) === lastSignature) return
      applyRemote(cloud)
    },
    (error) => {
      console.error('Koneksi Firebase Realtime Database gagal:', error)
    },
  )
})

onBeforeUnmount(() => {
  clearTimeout(pushTimer)
  if (unsubscribe) unsubscribe()
  if (window.__kasgo) window.__kasgo.onPersist = null
})
</script>
