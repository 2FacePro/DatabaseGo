<template>
  <div class="batch-rows">
    <p class="hint">
      Gunakan jika produk punya batch berbeda (nomor lot, tanggal kadaluarsa berbeda).
    </p>
    <div class="batch-header">
      <span>No. Batch</span><span>Kadaluarsa</span><span>Jumlah</span><span>Harga Beli</span><span></span>
    </div>
    <div v-for="(b, i) in batches" :key="i" class="batch-row">
      <input
        v-model="b.no"
        type="text"
        placeholder="Nomor batch"
        @keydown.enter.prevent
      />
      <input
        v-model="b.exp"
        type="date"
        @keydown.enter.prevent
      />
      <input
        v-model="b.stok"
        type="text"
        inputmode="numeric"
        placeholder="Jumlah"
        @keydown.enter.prevent
      />
      <input
        v-model="b.hb"
        type="text"
        inputmode="numeric"
        placeholder="Opsional"
        @keydown.enter.prevent
      />
      <button class="btn icon-only danger" type="button" @click="removeRow(i)" :aria-label="`Hapus batch ${i+1}`">
        <AppIcon name="remove" :size="14" />
      </button>
    </div>
    <button class="btn" type="button" @click="addRow">
      <AppIcon name="add" :size="14" />
      Tambah Batch
    </button>
  </div>
</template>

<script setup>
import AppIcon from '../icons/AppIcon.vue'

const props = defineProps({
  batches: { type: Array, required: true },
})

function addRow() {
  props.batches.push({ no: '', exp: '', stok: '', hb: '' })
}

function removeRow(i) {
  props.batches.splice(i, 1)
}
</script>

<style scoped>
.batch-rows { display: flex; flex-direction: column; gap: 8px; }
.batch-header {
  display: grid;
  grid-template-columns: 1fr 160px 100px 1fr 36px;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  padding: 0 2px;
}
.batch-row {
  display: grid;
  grid-template-columns: 1fr 160px 100px 1fr 36px;
  gap: 8px;
  align-items: center;
}
.batch-row input { min-height: 38px; font-size: 13px; }
@media (max-width: 900px) {
  .batch-header { display: none; }
  .batch-row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .batch-row { grid-template-columns: 1fr; }
}
</style>
