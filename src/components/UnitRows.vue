<template>
  <div class="unit-rows">
    <p class="hint">
      Isi satuan jual lain, mis. Dus (isi 24 pcs). Maks 3 satuan.
    </p>
    <div class="unit-header">
      <span>Nama</span><span>Harga Jual</span><span>Harga Beli</span><span>Isi</span><span></span>
    </div>
    <div v-for="(u, i) in units" :key="i" class="unit-row">
      <input
        v-model="u.name"
        type="text"
        :placeholder="placeholders[i]"
        :list="`unit-name-list-${i}`"
        @keydown.enter.prevent
      />
      <datalist :id="`unit-name-list-${i}`">
        <option v-for="n in allUnits" :key="n" :value="n" />
      </datalist>
      <input
        v-model="u.price"
        type="text"
        inputmode="numeric"
        placeholder="mis. 55000"
        @keydown.enter.prevent
      />
      <input
        v-model="u.hb"
        type="text"
        inputmode="numeric"
        placeholder="opsional"
        @keydown.enter.prevent
      />
      <input
        v-model="u.isi"
        type="text"
        inputmode="numeric"
        :placeholder="isiPlaceholders[i]"
        @keydown.enter.prevent
      />
      <button class="btn icon-only" type="button" @click="clearRow(i)" :aria-label="`Hapus satuan ${i+1}`">
        <AppIcon name="clear" :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '../icons/AppIcon.vue'

const props = defineProps({
  units: { type: Array, required: true },
  allUnits: { type: Array, default: () => [] },
})

const placeholders = ['mis. Dus', 'mis. Karton', 'mis. Lusin']
const isiPlaceholders = ['mis. 24', 'mis. 48', 'mis. 12']

function clearRow(i) {
  props.units[i].name = ''
  props.units[i].price = ''
  props.units[i].hb = ''
  props.units[i].isi = ''
}
</script>

<style scoped>
.unit-rows { display: flex; flex-direction: column; gap: 8px; }
.unit-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 100px 36px;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  padding: 0 2px;
}
.unit-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 100px 36px;
  gap: 8px;
  align-items: center;
}
.unit-row input { min-height: 38px; font-size: 13px; }
@media (max-width: 900px) {
  .unit-header { display: none; }
  .unit-row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .unit-row { grid-template-columns: 1fr; }
}
</style>
