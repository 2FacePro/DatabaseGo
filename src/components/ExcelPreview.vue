<template>
  <AppModal
    :model-value="modelValue"
    title="Preview Excel (sheet Data)"
    icon="spreadsheet"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="pv-bar">
      <span class="chip">{{ shown.length }} dari {{ rows.length }} baris</span>
      <span class="chip" :class="{ hl: changedCount > 0 }">{{ changedCount }} sel dibagi isi</span>
      <label class="pv-opt" title="Sama dengan checkbox di header">
        <input type="checkbox" v-model="store.exportOpts.divideVariantUnits" />
        Bagi harga varian dengan isi
      </label>
      <label class="pv-opt">
        <input type="checkbox" v-model="onlyChanged" />
        Hanya baris yang berubah
      </label>
      <label class="pv-opt">
        <input type="checkbox" v-model="allCols" />
        Semua kolom
      </label>
    </div>

    <p v-if="!rows.length" class="hint">Belum ada produk.</p>
    <div v-else class="pv-wrap">
      <table class="pv-table">
        <thead>
          <tr>
            <th class="pv-n">#</th>
            <th v-for="c in cols" :key="c" :class="{ 'pv-first': c === 0 }">{{ HEAD[c] }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in shown" :key="r.i">
            <td class="pv-n">{{ r.i + 1 }}</td>
            <td
              v-for="c in cols"
              :key="c"
              :class="{ 'pv-first': c === 0, 'pv-changed': isChanged(r.i, c), 'pv-num': typeof r.row[c] === 'number' }"
              :title="isChanged(r.i, c) ? 'Nilai di aplikasi: ' + fmt(off[r.i][c]) + ' → Excel: ' + fmt(r.row[c]) : ''"
            >
              {{ fmt(r.row[c]) }}
              <small v-if="isChanged(r.i, c)" class="pv-was">dari {{ fmt(off[r.i][c]) }}</small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint">
      Tampilan ini memakai fungsi yang sama dengan file unduhan. Sel kuning = nilai yang dibagi isi.
      Angka desimal ditampilkan 2 digit, di file Excel tersimpan penuh.
    </p>
  </AppModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppModal from './AppModal.vue'
import { useProductStore } from '../stores/products.js'
import { HEAD, buildSheetRows } from '../lib/rows.js'

defineProps({ modelValue: { type: Boolean, default: false } })
defineEmits(['update:modelValue'])

const store = useProductStore()
const onlyChanged = ref(false)
const allCols = ref(false)

// kedua versi dihitung supaya sel yang berubah bisa ditandai
const on = computed(() => buildSheetRows(store.products, { ...store.exportOpts, divideVariantUnits: true }))
const off = computed(() => buildSheetRows(store.products, { ...store.exportOpts, divideVariantUnits: false }))
const rows = computed(() => (store.exportOpts.divideVariantUnits ? on.value : off.value))

const isChanged = (i, c) =>
  !!store.exportOpts.divideVariantUnits && on.value[i]?.[c] !== off.value[i]?.[c]

const changedCount = computed(() => {
  if (!store.exportOpts.divideVariantUnits) return 0
  let n = 0
  on.value.forEach((r, i) => r.forEach((v, c) => { if (v !== off.value[i][c]) n++ }))
  return n
})

const cols = computed(() => {
  if (allCols.value) return HEAD.map((_, c) => c)
  return HEAD.map((_, c) => c).filter(c => c === 0 || rows.value.some(r => r[c] != null && r[c] !== ''))
})

const shown = computed(() => {
  const list = rows.value.map((row, i) => ({ row, i }))
  return onlyChanged.value ? list.filter(r => r.row.some((_, c) => isChanged(r.i, c))) : list
})

function fmt(v) {
  if (v == null || v === '') return ''
  if (typeof v === 'number') return v.toLocaleString('id-ID', { maximumFractionDigits: 2 })
  return String(v)
}
</script>

<style scoped>
.pv-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.pv-opt { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; margin: 0; cursor: pointer; }
.chip.hl { background: var(--tag); color: var(--tag-ink); font-weight: 700; }
.pv-wrap { overflow: auto; max-height: 60vh; border: 1px solid var(--line); border-radius: 8px; }
.pv-table { border-collapse: collapse; font-size: 12px; width: max-content; min-width: 100%; }
.pv-table th, .pv-table td { border: 1px solid var(--line); padding: 5px 8px; white-space: nowrap; text-align: left; }
.pv-table th { position: sticky; top: 0; background: var(--panel-2); z-index: 2; font-weight: 700; }
.pv-n { color: var(--muted); text-align: right !important; }
.pv-first { position: sticky; left: 0; background: var(--panel); z-index: 1; }
.pv-table th.pv-first { z-index: 3; background: var(--panel-2); }
.pv-num { text-align: right !important; }
.pv-changed { background: var(--tag); color: var(--tag-ink); font-weight: 700; }
.pv-was { display: block; font-weight: 400; font-size: 10px; opacity: .75; }
</style>
