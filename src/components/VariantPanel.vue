<template>
  <div class="variant-panel">
    <div v-if="form.hasVariants" class="vbody">
      <div class="vtype-row">
        <div class="field">
          <label>Jenis Varian 1 <span class="req">*</span></label>
          <input
            v-model="form.vt1"
            type="text"
            placeholder="mis. Ukuran"
            list="vtype1-list"
            @keydown.enter.prevent
          />
          <datalist id="vtype1-list">
            <option v-for="vt in allVTypes" :key="vt" :value="vt" />
          </datalist>
        </div>
        <div class="field">
          <label>Jenis Varian 2 <span class="opt">(opsional)</span></label>
          <input
            v-model="form.vt2"
            type="text"
            placeholder="mis. Warna"
            list="vtype2-list"
            @keydown.enter.prevent
          />
          <datalist id="vtype2-list">
            <option v-for="vt in allVTypes" :key="vt" :value="vt" />
          </datalist>
        </div>
      </div>

      <p class="hint">
        Harga di sini = per satuan dasar. Satuan tambahan (Dus/Lusin) diisi di panel "Satuan
        Tambahan" per varian.
      </p>

      <div class="scroll">
        <div class="var-header" :style="gridStyle">
          <span>{{ form.vt1 || "Varian 1" }}</span>
          <span v-if="form.vt2">{{ form.vt2 }}</span>
          <span>Harga Jual</span>
          <span>Harga Beli</span>
          <span>Stok</span>
          <span>Barcode</span>
          <span></span>
        </div>

        <div v-for="(v, i) in form.variants" :key="i" class="var-row" :style="gridStyle">
          <input
            v-model="v.v1"
            type="text"
            :placeholder="form.vt1 || 'Nilai 1'"
            @keydown.enter.prevent
          />
          <input
            v-if="form.vt2"
            v-model="v.v2"
            type="text"
            :placeholder="form.vt2 || 'Nilai 2'"
            @keydown.enter.prevent
          />
          <input
            v-model="v.jual"
            type="text"
            inputmode="numeric"
            placeholder="Standar"
            @keydown.enter.prevent
          />
          <input
            v-model="v.beli"
            type="text"
            inputmode="numeric"
            placeholder="Standar"
            @keydown.enter.prevent
          />
          <input
            v-model="v.stok"
            type="text"
            inputmode="numeric"
            placeholder="0"
            @keydown.enter.prevent
          />
          <input v-model="v.barcode" type="text" placeholder="Opsional" @keydown.enter.prevent />
          <button
            class="btn icon-only danger"
            type="button"
            @click="removeVariant(i)"
            :aria-label="`Hapus varian ${i + 1}`"
          >
            <AppIcon name="remove" :size="14" />
          </button>
        </div>
      </div>

      <div class="var-actions">
        <button class="btn" type="button" @click="addVariant">
          <AppIcon name="add" :size="14" />
          Tambah Baris
        </button>
        <p class="hint" style="margin: 0">Harga kosong = pakai standar dari atas</p>
      </div>
    </div>
    <p v-else class="hint">Centang "Punya varian" di kolom kiri untuk mengatur varian.</p>
  </div>
</template>

<script setup>
import { computed, watch } from "vue";
import AppIcon from "../icons/AppIcon.vue";

const props = defineProps({
  form: { type: Object, required: true },
  allVTypes: { type: Array, default: () => [] },
});

const blankVariant = () => ({
  v1: "",
  v2: "",
  jual: "",
  beli: "",
  stok: "",
  barcode: "",
  units: [
    { name: "", price: "", hb: "", isi: "" },
    { name: "", price: "", hb: "", isi: "" },
    { name: "", price: "", hb: "", isi: "" },
  ],
});

const gridStyle = computed(() => ({
  "--cols": 5 + (props.form.vt2 ? 1 : 0),
}));

function ensureUnits() {
  props.form.variants.forEach((v) => {
    if (!Array.isArray(v.units) || v.units.length !== 3) {
      const src = Array.isArray(v.units) ? v.units : [];
      v.units = [0, 1, 2].map((i) => ({
        name: src[i]?.name || "",
        price: src[i]?.price != null ? src[i].price : "",
        hb: src[i]?.hb != null ? src[i].hb : "",
        isi: src[i]?.isi != null ? src[i].isi : "",
      }));
    }
  });
}

watch(
  () => props.form.hasVariants,
  (val) => {
    if (val && props.form.variants.length === 0) {
      addVariant();
      addVariant();
    }
  },
  { immediate: true },
);

watch(() => props.form.variants.length, ensureUnits, { immediate: true });

function addVariant() {
  props.form.variants.push(blankVariant());
}

function removeVariant(i) {
  props.form.variants.splice(i, 1);
}
</script>

<style scoped>
.variant-panel {
  display: flex;
  flex-direction: column;
}
.vbody {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.vtype-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  display: block;
}
.req {
  color: var(--err);
}
.opt {
  font-weight: 400;
  color: var(--muted);
  font-size: 12px;
}
.scroll {
  overflow-x: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.var-header,
.var-row {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(96px, 1fr)) 36px;
  gap: 8px;
  min-width: calc(var(--cols) * 104px + 44px);
}
.var-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  padding: 0 2px;
}
.var-row {
  align-items: center;
}
.var-row input {
  min-height: 38px;
  font-size: 13px;
}
.var-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
@media (max-width: 1000px) {
  .var-header {
    display: none;
  }
  .var-row {
    grid-template-columns: 1fr 1fr;
    min-width: 0;
  }
}
@media (max-width: 700px) {
  .vtype-row {
    grid-template-columns: 1fr;
  }
  .var-row {
    grid-template-columns: 1fr;
  }
}
</style>
