<template>
  <div
    class="card"
    :class="{ editing: isEditing, expanded, draft: product.draft }"
    @click="toggleExpand"
  >
    <div class="card-top">
      <div class="card-info">
        <span class="card-nama">{{ product.nama }}</span>
        <span class="chip">{{ product.kategori || "—" }}</span>
        <span v-if="product.draft" class="chip draft">Draf</span>
        <span v-if="product.hasVariants" class="chip">
          {{ product.variants?.length || 0 }} varian
        </span>
        <span v-if="product.tanpaStok" class="chip">Tanpa stok</span>
        <span v-if="product.desimal" class="chip">Desimal</span>
        <span v-if="product.batches?.length" class="chip">
          {{ product.batches.length }} batch
        </span>
      </div>
      <div class="card-actions">
        <button
          class="btn icon-only"
          type="button"
          title="Edit"
          @click.stop="$emit('edit', product)"
        >
          <AppIcon name="edit" :size="15" />
        </button>
        <button
          class="btn icon-only"
          type="button"
          title="Duplikat"
          @click.stop="$emit('duplicate', product)"
        >
          <AppIcon name="duplicate" :size="15" />
        </button>
        <button
          class="btn icon-only danger"
          type="button"
          :title="armed[product.id] ? 'Ketuk sekali lagi untuk hapus' : 'Hapus'"
          @click.stop="twoTap(product.id, 'Hapus?', () => $emit('remove', product.id))"
        >
          <AppIcon name="remove" :size="15" />
          <span v-if="armed[product.id]" style="font-size: 12px; margin-left: 2px">Hapus?</span>
        </button>
      </div>
    </div>

    <div class="card-detail">
      <span v-if="product.hasVariants" class="price">
        {{ variantPriceRange(product) }}
        <span v-if="product.satuan && variantPriceRange(product) !== '-'" class="sat">
          / {{ product.satuan }}
        </span>
      </span>
      <span
        v-else-if="
          product.hargaJual !== undefined && product.hargaJual !== null && product.hargaJual !== ''
        "
        class="price"
      >
        {{ formatRp(product.hargaJual) }}
        <span v-if="product.satuan" class="sat">/ {{ product.satuan }}</span>
      </span>
      <span
        v-if="
          !product.tanpaStok && !product.hasVariants && product.stok != null && product.stok !== ''
        "
        class="stok"
      >
        Stok: {{ formatQty(product.stok) }}
      </span>
      <span v-if="product.barcode" class="barcode">
        <AppIcon name="barcode" :size="12" /> {{ product.barcode }}
      </span>
      <span v-if="unitCount > 0" class="chip">+{{ unitCount }} satuan</span>
      <span class="expand-hint">
        <AppIcon :name="expanded ? 'chevron-up' : 'chevron-down'" :size="13" />
        {{ expanded ? "Tutup detail" : "Lihat detail" }}
      </span>
    </div>

    <div v-if="product.hasVariants && product.variants?.length && !expanded" class="variant-chips">
      <span v-for="v in product.variants.slice(0, 6)" :key="v.v1 + '|' + v.v2" class="chip">
        {{ v.v1 }}{{ v.v2 ? " / " + v.v2 : "" }}
        <span v-if="v.jual != null" style="color: var(--brand)">
          {{ formatRp(v.jual) }}
        </span>
      </span>
      <span v-if="product.variants.length > 6" class="chip">
        +{{ product.variants.length - 6 }} lagi
      </span>
    </div>

    <div v-if="expanded" class="card-expanded">
      <div class="exp-section">
        <div class="exp-title">Info Umum</div>
        <div class="exp-grid">
          <div class="exp-item">
            <span class="exp-label">Nama</span>
            <span class="exp-value">{{ product.nama || "-" }}</span>
          </div>
          <div class="exp-item">
            <span class="exp-label">Kategori</span>
            <span class="exp-value">{{ product.kategori || "-" }}</span>
          </div>
          <div v-if="product.satuan" class="exp-item">
            <span class="exp-label">Satuan Dasar</span>
            <span class="exp-value">{{ product.satuan }}</span>
          </div>
          <div v-if="product.hasVariants" class="exp-item">
            <span class="exp-label">Harga Jual</span>
            <span class="exp-value">
              {{ variantPriceRange(product) }}
              <span v-if="product.satuan && variantPriceRange(product) !== '-'">
                / {{ product.satuan }}
              </span>
            </span>
          </div>
          <div
            v-else-if="
              product.hargaJual !== undefined &&
              product.hargaJual !== null &&
              product.hargaJual !== ''
            "
            class="exp-item"
          >
            <span class="exp-label">Harga Jual</span>
            <span class="exp-value">
              {{ formatRp(product.hargaJual) }}
              <span v-if="product.satuan"> / {{ product.satuan }}</span>
            </span>
          </div>
          <div
            v-if="!product.hasVariants && product.hargaBeli != null && product.hargaBeli !== ''"
            class="exp-item"
          >
            <span class="exp-label">Harga Beli</span>
            <span class="exp-value">{{ formatRp(product.hargaBeli) }}</span>
          </div>
          <div
            v-if="
              !product.tanpaStok &&
              !product.hasVariants &&
              product.stokMin != null &&
              product.stokMin !== ''
            "
            class="exp-item"
          >
            <span class="exp-label">Stok Minimal</span>
            <span class="exp-value">{{ formatQty(product.stokMin) }}</span>
          </div>
          <div class="exp-item">
            <span class="exp-label">Status</span>
            <span class="exp-value">{{ product.draft ? "Draf" : "Siap unduh" }}</span>
          </div>
          <div class="exp-item">
            <span class="exp-label">Opsi</span>
            <span class="exp-value">
              <span v-if="product.tanpaStok">Tanpa stok</span>
              <span v-if="product.desimal">, Qty desimal</span>
              <span v-if="product.hasVariants">, Punya varian</span>
              <span v-if="!product.tanpaStok && !product.desimal && !product.hasVariants">
                , Normal
              </span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="product.hasVariants && product.variants?.length" class="exp-section">
        <div class="exp-title">Varian</div>
        <div class="table-wrap">
          <table class="exp-table">
            <thead>
              <tr>
                <th>Varian 1</th>
                <th>Varian 2</th>
                <th>Harga Jual</th>
                <th>Harga Beli</th>
                <th>Stok</th>
                <th>Barcode</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(v, idx) in product.variants" :key="idx">
                <td>{{ v.v1 || "-" }}</td>
                <td>{{ v.v2 || "-" }}</td>
                <td>
                  {{
                    v.jual !== undefined && v.jual !== null && v.jual !== ""
                      ? formatRp(v.jual)
                      : "-"
                  }}
                </td>
                <td>{{ v.beli != null && v.beli !== "" ? formatRp(v.beli) : "-" }}</td>
                <td>{{ v.stok != null && v.stok !== "" ? formatQty(v.stok) : "-" }}</td>
                <td>{{ v.barcode || "-" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="!product.hasVariants && product.units?.filter((u) => u.name).length"
        class="exp-section"
      >
        <div class="exp-title">Satuan Tambahan</div>
        <div class="table-wrap">
          <table class="exp-table">
            <thead>
              <tr>
                <th>Nama Satuan</th>
                <th>Isi</th>
                <th>Harga Jual</th>
                <th>Harga Beli</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, idx) in product.units.filter((u) => u.name)" :key="idx">
                <td>{{ u.name }}</td>
                <td>{{ u.isi != null && u.isi !== "" ? formatQty(u.isi) : "-" }}</td>
                <td>{{ u.price != null && u.price !== "" ? formatRp(u.price) : "-" }}</td>
                <td>{{ u.hb != null && u.hb !== "" ? formatRp(u.hb) : "-" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="product.hasVariants && product.variants?.some((v) => v.units?.some((u) => u.name))"
        class="exp-section"
      >
        <div class="exp-title">Satuan Tambahan per Varian</div>
        <div v-for="(v, vi) in product.variants" :key="vi" class="var-units-block">
          <template v-if="v.units?.some((u) => u.name)">
            <div class="exp-label" style="margin-bottom: 4px">
              {{ v.v1 }}{{ v.v2 ? " / " + v.v2 : "" }}
            </div>
            <div class="table-wrap">
              <table class="exp-table">
                <thead>
                  <tr>
                    <th>Nama Satuan</th>
                    <th>Isi</th>
                    <th>Harga Jual</th>
                    <th>Harga Beli</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(u, idx) in v.units.filter((u) => u.name)" :key="idx">
                    <td>{{ u.name }}</td>
                    <td>{{ u.isi != null && u.isi !== "" ? formatQty(u.isi) : "-" }}</td>
                    <td>{{ u.price != null && u.price !== "" ? formatRp(u.price) : "-" }}</td>
                    <td>{{ u.hb != null && u.hb !== "" ? formatRp(u.hb) : "-" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>

      <div v-if="product.batches?.length" class="exp-section">
        <div class="exp-title">Batch</div>
        <div class="table-wrap">
          <table class="exp-table">
            <thead>
              <tr>
                <th>No. Batch</th>
                <th>Tanggal Kadaluarsa</th>
                <th>Stok</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, idx) in product.batches" :key="idx">
                <td>{{ b.no || "-" }}</td>
                <td>{{ b.exp || "-" }}</td>
                <td>{{ b.stok != null && b.stok !== "" ? formatQty(b.stok) : "-" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import AppIcon from "../icons/AppIcon.vue";
import { useTwoTap } from "../composables/useTwoTap.js";
import { formatRp, formatQty } from "../lib/parse.js";

const props = defineProps({
  product: { type: Object, required: true },
  isEditing: { type: Boolean, default: false },
});

defineEmits(["edit", "duplicate", "remove"]);

const { armed, twoTap } = useTwoTap();
const expanded = ref(false);

function toggleExpand() {
  expanded.value = !expanded.value;
}

const unitCount = computed(() => {
  if (props.product.hasVariants) {
    return (props.product.variants || []).reduce(
      (n, v) => n + (v.units || []).filter((u) => u.name).length,
      0,
    );
  }
  return (props.product.units || []).filter((u) => u.name).length;
});

function variantPriceRange(product) {
  if (!product.hasVariants || !Array.isArray(product.variants) || product.variants.length === 0) {
    return "-";
  }
  const prices = product.variants
    .map((v) => {
      if (v.jual !== undefined && v.jual !== null && v.jual !== "") return v.jual;
      if (
        product.hargaJual !== undefined &&
        product.hargaJual !== null &&
        product.hargaJual !== ""
      ) {
        return product.hargaJual;
      }
      return null;
    })
    .filter((v) => v !== null && v !== undefined && v !== "" && !isNaN(Number(v)))
    .map((v) => Number(v));
  if (prices.length === 0) return "-";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatRp(min);
  return formatRp(min) + " – " + formatRp(max);
}
</script>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  cursor: pointer;
}
.card.editing {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}
.card.expanded {
  border-color: var(--brand);
}
.card.draft {
  border-style: dashed;
}
.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.card-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.card-nama {
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
}
.card-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.card-detail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.price {
  font-weight: 700;
  color: var(--brand);
}
.sat {
  font-weight: 400;
  color: var(--muted);
}
.stok {
  color: var(--muted);
}
.barcode {
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 3px;
}
.variant-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.expand-hint {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--muted);
}
.chip.draft {
  background: var(--warn-bg);
  color: var(--warn);
  font-weight: 700;
}
.card-expanded {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.exp-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.exp-title {
  font-weight: 700;
  font-size: 13px;
}
.exp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 6px 12px;
}
.exp-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.exp-label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.exp-value {
  font-size: 13px;
}
.var-units-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.var-units-block:last-child {
  margin-bottom: 0;
}
.table-wrap {
  overflow-x: auto;
}
.exp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.exp-table th,
.exp-table td {
  text-align: left;
  padding: 6px 8px;
  border: 1px solid var(--line);
}
.exp-table th {
  background: var(--panel-2);
  font-weight: 600;
}
</style>
