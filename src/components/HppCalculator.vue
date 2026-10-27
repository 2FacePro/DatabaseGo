<template>
  <div class="hpp-calc">
    <div class="hpp-grid">
      <div class="field">
        <label>Harga Beli Kemasan</label>
        <input v-model="hppState.hargaKemasan" type="text" inputmode="numeric" placeholder="mis. 50000" @keydown.enter.prevent />
      </div>
      <div class="field">
        <label>Isi per Kemasan</label>
        <input v-model="hppState.isi" type="text" inputmode="decimal" placeholder="mis. 1000" @keydown.enter.prevent />
      </div>
      <div class="field">
        <label>Jumlah Kemasan <span class="opt">(opsional)</span></label>
        <input v-model="hppState.jumlah" type="text" inputmode="decimal" placeholder="default: 1" @keydown.enter.prevent />
      </div>
      <div class="field">
        <label>Biaya Tambahan <span class="opt">(opsional)</span></label>
        <input v-model="hppState.biaya" type="text" inputmode="numeric" placeholder="mis. 5000" @keydown.enter.prevent />
      </div>
      <div class="field">
        <label>Susut % <span class="opt">(opsional)</span></label>
        <input v-model="hppState.susut" type="text" inputmode="decimal" placeholder="mis. 5" @keydown.enter.prevent />
      </div>
    </div>

    <div class="hpp-profit">
      <div class="field">
        <label>Target Untung %</label>
        <input v-model="store.calc.untung" type="text" inputmode="decimal" placeholder="mis. 20" @keydown.enter.prevent />
      </div>
      <div class="field">
        <label>Mode</label>
        <select v-model="store.calc.mode">
          <option value="markup">Markup (dari modal)</option>
          <option value="margin">Margin (dari harga jual)</option>
        </select>
      </div>
      <div class="field">
        <label>Pembulatan</label>
        <select v-model="store.calc.bulat">
          <option value="1">Tidak dibulatkan</option>
          <option value="100">100</option>
          <option value="500">500</option>
          <option value="1000">1.000</option>
          <option value="5000">5.000</option>
        </select>
      </div>
    </div>

    <!-- Hasil -->
    <div v-if="result.ok" class="hpp-result">
      <div class="res-row"><span>Total modal</span><span>{{ formatRp(result.total) }}</span></div>
      <div class="res-row"><span>Qty bersih</span><span>{{ formatQty(result.qty) }}</span></div>
      <div class="res-row"><span>HPP per satuan</span><span>{{ formatRp(result.hpp) }}</span></div>
      <div class="res-row accent"><span>Harga Jual Saran</span><span>{{ formatRp(result.jual) }}</span></div>
      <div class="hpp-apply">
        <button class="btn primary" type="button" @click="applyHpp">
          <AppIcon name="save" :size="14" />
          Pakai Harga ini
        </button>
        <label class="stok-check">
          <input type="checkbox" v-model="hppState.stokCheck" />
          Isi stok = qty bersih ({{ formatQty(result.qty) }})
        </label>
      </div>
    </div>
    <div v-else-if="result.error" class="hpp-error">
      {{ result.error }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../icons/AppIcon.vue'
import { calcHpp } from '../lib/hpp.js'
import { pnum, formatRp, formatQty, displayNum } from '../lib/parse.js'
import { useProductStore } from '../stores/products.js'

const props = defineProps({
  hppState: { type: Object, required: true },
  form: { type: Object, required: true },
})

const emit = defineEmits(['applied'])

const store = useProductStore()

const result = computed(() => {
  return calcHpp({
    hargaKemasan: pnum(props.hppState.hargaKemasan, true),
    isi: pnum(props.hppState.isi, false),
    jumlah: pnum(props.hppState.jumlah, false) || 1,
    biaya: pnum(props.hppState.biaya, true) || 0,
    susut: pnum(props.hppState.susut, false) || 0,
    untung: pnum(store.calc.untung, false) || 0,
    mode: store.calc.mode,
    bulat: Number(store.calc.bulat) || 100,
  })
})

function applyHpp() {
  if (!result.value.ok) return
  props.form.hargaJual = String(result.value.jual)
  props.form.hargaBeli = String(Math.round(result.value.hpp))
  if (props.hppState.stokCheck) {
    // displayNum memakai koma desimal supaya "1.125" tidak terbaca sebagai seribu seratus dua puluh lima
    props.form.stok = displayNum(Math.round(result.value.qty * 1000) / 1000)
  }
  emit('applied')
}
</script>

<style scoped>
.hpp-calc { display: flex; flex-direction: column; gap: 12px; }
.hpp-grid, .hpp-profit {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.field label { font-size: 12px; font-weight: 600; margin-bottom: 4px; display: block; }
.opt { font-weight: 400; color: var(--muted); }
.hpp-result {
  background: var(--brand-soft);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.res-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 2px 0;
  gap: 8px;
}
.res-row.accent { font-weight: 700; font-size: 16px; margin-top: 4px; color: var(--brand); }
.hpp-apply {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.stok-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.hpp-error {
  font-size: 13px;
  color: var(--muted);
  background: var(--info-bg);
  border-radius: 10px;
  padding: 10px 14px;
}
@media (max-width: 900px) {
  .hpp-grid, .hpp-profit { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .hpp-grid, .hpp-profit { grid-template-columns: 1fr; }
}
</style>
