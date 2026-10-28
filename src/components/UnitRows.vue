<template>
  <div class="unit-rows">
    <!-- Mode varian: pilih varian dulu, lalu isi max 3 satuan untuk varian itu -->
    <template v-if="hasVariants">
      <p class="hint">
        Pilih varian, lalu isi satuan tambahan untuk varian itu (maks 3 per varian). Setiap varian
        bisa punya satuan sendiri.
      </p>

      <div class="var-pick">
        <label>Pilih Varian</label>
        <select v-model="selectedKey" class="var-select">
          <option value="" disabled>— pilih varian —</option>
          <option v-for="opt in variantOptions" :key="opt.key" :value="opt.key">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <p v-if="variantOptions.length === 0" class="hint-warn">
        Isi nilai varian di panel "Varian Produk" terlebih dahulu.
      </p>

      <template v-else-if="selectedKey && currentUnits">
        <p class="hint-active">
          Satuan untuk: <strong>{{ selectedLabel }}</strong>
          <span class="chip">{{ filledCount }} / 3</span>
        </p>

        <div class="unit-header">
          <span>Nama</span>
          <span>Harga Jual</span>
          <span>Harga Beli</span>
          <span>Isi</span>
          <span></span>
        </div>

        <div v-for="(u, i) in currentUnits" :key="i" class="unit-row">
          <input
            v-model="u.name"
            type="text"
            :placeholder="placeholders[i]"
            :list="`unit-name-list-v-${i}`"
            @keydown.enter.prevent
          />
          <datalist :id="`unit-name-list-v-${i}`">
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
          <button
            class="btn icon-only"
            type="button"
            @click="clearRow(i)"
            :aria-label="`Hapus satuan ${i + 1}`"
          >
            <AppIcon name="clear" :size="14" />
          </button>
        </div>
      </template>
    </template>

    <!-- Mode non-varian: 3 slot global -->
    <template v-else>
      <p class="hint">Isi satuan jual lain, mis. Dus (isi 24 pcs). Maks 3 satuan.</p>

      <div class="unit-header">
        <span>Nama</span>
        <span>Harga Jual</span>
        <span>Harga Beli</span>
        <span>Isi</span>
        <span></span>
      </div>

      <div v-for="(u, i) in units" :key="i" class="unit-row">
        <input
          v-model="u.name"
          type="text"
          :placeholder="placeholders[i]"
          :list="`unit-name-list-nv-${i}`"
          @keydown.enter.prevent
        />
        <datalist :id="`unit-name-list-nv-${i}`">
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
        <button
          class="btn icon-only"
          type="button"
          @click="clearRow(i)"
          :aria-label="`Hapus satuan ${i + 1}`"
        >
          <AppIcon name="clear" :size="14" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import AppIcon from "../icons/AppIcon.vue";

const props = defineProps({
  units: { type: Array, required: true },
  allUnits: { type: Array, default: () => [] },
  hasVariants: { type: Boolean, default: false },
  variants: { type: Array, default: () => [] },
  vt1: { type: String, default: "" },
  vt2: { type: String, default: "" },
});

const placeholders = ["mis. Dus", "mis. Karton", "mis. Lusin"];
const isiPlaceholders = ["mis. 24", "mis. 48", "mis. 12"];

const selectedKey = ref("");

const variantOptions = computed(() => {
  const seen = new Set();
  return (props.variants || [])
    .map((v, idx) => {
      const v1 = String(v.v1 || "").trim();
      const v2 = String(v.v2 || "").trim();
      if (!v1) return null;
      const key = idx + "|" + v1 + "|" + v2;
      const label = v1 + (v2 ? " / " + v2 : "");
      return { key, idx, label };
    })
    .filter(Boolean)
    .filter((opt) => {
      if (seen.has(opt.key)) return false;
      seen.add(opt.key);
      return true;
    });
});

const selectedLabel = computed(() => {
  const opt = variantOptions.value.find((o) => o.key === selectedKey.value);
  return opt?.label || "";
});

function ensureUnits(v) {
  if (!Array.isArray(v.units) || v.units.length !== 3) {
    const src = Array.isArray(v.units) ? v.units : [];
    v.units = [0, 1, 2].map((i) => ({
      name: src[i]?.name || "",
      price: src[i]?.price != null ? src[i].price : "",
      hb: src[i]?.hb != null ? src[i].hb : "",
      isi: src[i]?.isi != null ? src[i].isi : "",
    }));
  }
  return v.units;
}

const currentUnits = computed(() => {
  if (!selectedKey.value) return null;
  const opt = variantOptions.value.find((o) => o.key === selectedKey.value);
  if (!opt) return null;
  const v = props.variants[opt.idx];
  if (!v) return null;
  return ensureUnits(v);
});

const filledCount = computed(
  () => (currentUnits.value || []).filter((u) => u.name || u.price || u.hb || u.isi).length,
);

watch(
  variantOptions,
  (opts) => {
    if (!opts.length) {
      selectedKey.value = "";
      return;
    }
    if (!opts.some((o) => o.key === selectedKey.value)) {
      selectedKey.value = opts[0].key;
    }
  },
  { immediate: true },
);

function clearRow(i) {
  if (props.hasVariants && currentUnits.value) {
    currentUnits.value[i].name = "";
    currentUnits.value[i].price = "";
    currentUnits.value[i].hb = "";
    currentUnits.value[i].isi = "";
  } else {
    props.units[i].name = "";
    props.units[i].price = "";
    props.units[i].hb = "";
    props.units[i].isi = "";
  }
}
</script>

<style scoped>
.unit-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.var-pick {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 320px;
}
.var-pick label {
  font-size: 12px;
  font-weight: 600;
}
.var-select {
  min-height: 38px;
  font-size: 13px;
}
.hint-active {
  font-size: 13px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
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
.unit-row input {
  min-height: 38px;
  font-size: 13px;
}
.hint-warn {
  font-size: 12px;
  color: var(--warn);
  background: var(--warn-bg);
  padding: 6px 10px;
  border-radius: 6px;
  margin: 0;
}
@media (max-width: 900px) {
  .unit-header {
    display: none;
  }
  .unit-row {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 600px) {
  .unit-row {
    grid-template-columns: 1fr;
  }
}
</style>
