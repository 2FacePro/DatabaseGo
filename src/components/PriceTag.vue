<template>
  <div class="price-tag" v-if="show">
    <div class="pt-row">
      <span class="pt-label">Harga Jual</span>
      <span class="pt-val">{{ formatRp(hj) }}</span>
    </div>
    <div class="pt-row" v-if="hb">
      <span class="pt-label">Harga Beli</span>
      <span class="pt-val">{{ formatRp(hb) }}</span>
    </div>
    <div class="pt-row" v-if="hb && hj">
      <span class="pt-label">Laba</span>
      <span class="pt-val" :class="laba >= 0 ? 'pos' : 'neg'">
        {{ formatRp(laba) }} ({{ pctStr }}%)
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { pnum, formatRp } from '../lib/parse.js'

const props = defineProps({
  hargaJual: { type: String, default: '' },
  hargaBeli: { type: String, default: '' },
})

const hj = computed(() => pnum(props.hargaJual, true))
const hb = computed(() => pnum(props.hargaBeli, true))
const laba = computed(() => (hj.value != null && hb.value != null) ? hj.value - hb.value : null)
const pctStr = computed(() => {
  if (laba.value == null || !hb.value) return ''
  return (laba.value / hb.value * 100).toFixed(1).replace('.', ',')
})
const show = computed(() => hj.value != null && hj.value > 0)
</script>

<style scoped>
.price-tag {
  background: var(--brand-soft);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 8px;
  font-size: 13px;
}
.pt-row { display: flex; justify-content: space-between; gap: 8px; }
.pt-label { color: var(--muted); }
.pt-val { font-weight: 700; }
.pos { color: var(--brand); }
.neg { color: var(--err); }
</style>
