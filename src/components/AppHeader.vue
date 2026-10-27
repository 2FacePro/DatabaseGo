<template>
  <header class="header">
    <div class="header-inner">
      <div class="header-brand">
        <AppIcon name="product" :size="22" />
        <span class="header-title">Input Produk KasGo</span>
        <span v-if="productCount > 0" class="chip">{{ productCount }} produk · {{ rowCount }} baris</span>
        <button
          class="chip sync"
          :class="syncStatus"
          type="button"
          :title="syncTitle"
          @click="$emit('sync')"
        >
          {{ syncLabel }}
        </button>
      </div>
      <div class="header-actions">
        <label
          class="divide-opt"
          title="Workaround bug KasGo: harga satuan tambahan produk varian dibagi isi saat ekspor (125.000 / 40 = 3.125). Matikan jika KasGo sudah diperbaiki."
        >
          <input
            type="checkbox"
            :checked="divideUnits"
            @change="$emit('toggleDivide', $event.target.checked)"
          />
          Bagi harga varian dengan isi
        </label>
        <button
          class="btn"
          type="button"
          :title="known.file ? `Dimuat: ${known.file} (${known.count} produk)` : 'Muat file produk lama untuk validasi duplikat'"
          @click="$emit('loadFile')"
        >
          <AppIcon name="upload" :size="16" />
          <span class="btn-label">{{ known.file ? known.file : 'Muat Excel' }}</span>
        </button>
        <button
          class="btn primary"
          type="button"
          :disabled="productCount === 0 || downloading"
          @click="$emit('download')"
        >
          <AppIcon name="download" :size="16" />
          <span class="btn-label">{{ downloading ? 'Mengunduh…' : 'Unduh Excel' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../icons/AppIcon.vue'

const props = defineProps({
  productCount: { type: Number, default: 0 },
  rowCount: { type: Number, default: 0 },
  known: { type: Object, default: () => ({}) },
  downloading: { type: Boolean, default: false },
  syncStatus: { type: String, default: 'off' },
  syncError: { type: String, default: '' },
  pending: { type: Number, default: 0 },
  divideUnits: { type: Boolean, default: true },
})

defineEmits(['loadFile', 'download', 'sync', 'toggleDivide'])

const syncLabel = computed(() => {
  switch (props.syncStatus) {
    case 'synced': return 'Tersimpan di cloud'
    case 'syncing': return `Menyimpan (${props.pending})…`
    case 'connecting': return 'Menyambung…'
    case 'offline': return props.pending ? `Offline · ${props.pending} menunggu` : 'Offline'
    case 'error': return 'Gagal sinkron'
    default: return 'Hanya lokal'
  }
})

const syncTitle = computed(() => {
  if (props.syncStatus === 'error') return `${props.syncError} (klik untuk coba lagi)`
  if (props.syncStatus === 'off') return 'Firebase belum dikonfigurasi (.env). Data hanya disimpan di browser ini.'
  if (props.syncStatus === 'offline') return 'Tidak ada koneksi. Perubahan dikirim otomatis saat online.'
  return 'Status sinkron Firebase Realtime Database'
})
</script>

<style scoped>
.header {
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--brand);
}
.header-title {
  font-weight: 800;
  font-size: 16px;
  color: var(--ink);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.sync { border: 0; cursor: pointer; font-family: inherit; }
.sync.synced { color: var(--brand); background: var(--brand-soft); }
.sync.error { color: var(--err); background: var(--err-bg); }
.sync.offline, .sync.off { color: var(--warn); background: var(--warn-bg); }
.divide-opt {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  cursor: pointer;
}
@media (max-width: 480px) {
  .btn-label { display: none; }
}
</style>
