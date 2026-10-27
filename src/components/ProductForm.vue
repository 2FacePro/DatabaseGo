<template>
  <div class="panel product-form">
    <div class="form-header">
      <h2>
        <AppIcon :name="isEditing ? 'edit' : (isDuplicate ? 'duplicate' : 'add')" :size="18" />
        {{ isEditing ? 'Edit Produk' : (isDuplicate ? 'Duplikat Produk' : 'Produk Baru') }}
      </h2>
      <button v-if="isEditing || isDuplicate" class="btn quiet" type="button" @click="handleCancel">
        <AppIcon name="cancel" :size="14" />
        Batal
      </button>
    </div>

    <div class="form-grid">
      <!-- Kolom Kiri: Data Utama -->
      <div class="form-col">
        <!-- Nama -->
        <div class="field">
          <label for="f-nama">Nama Produk <span class="req">*</span></label>
          <input
            id="f-nama"
            v-model="form.nama"
            type="text"
            placeholder="mis. Beras Premium 5kg"
            autocomplete="off"
            @keydown.enter.prevent="focusNext"
            ref="namaRef"
          />
        </div>

        <!-- Kategori -->
        <div class="field">
          <label for="f-kategori">Kategori <span class="req">*</span></label>
          <input
            id="f-kategori"
            v-model="form.kategori"
            type="text"
            placeholder="mis. Bahan Makanan"
            list="cat-list"
            @keydown.enter.prevent
          />
          <datalist id="cat-list">
            <option v-for="c in store.allCats" :key="c" :value="c" />
          </datalist>
        </div>

        <!-- Opsi produk -->
        <div class="check-row">
          <label class="check-label">
            <input type="checkbox" v-model="form.tanpaStok" />
            Tanpa stok
          </label>
          <label class="check-label">
            <input type="checkbox" v-model="form.desimal" />
            Qty desimal
          </label>
          <label class="check-label">
            <input type="checkbox" v-model="form.hasVariants" @change="onVariantToggle" />
            Punya varian
          </label>
        </div>

        <!-- Satuan -->
        <div class="field" v-if="!form.tanpaStok">
          <label for="f-satuan">Satuan Dasar <span class="req">*</span></label>
          <input
            id="f-satuan"
            v-model="form.satuan"
            type="text"
            placeholder="mis. pcs, kg, liter"
            list="unit-list"
            @keydown.enter.prevent
          />
          <datalist id="unit-list">
            <option v-for="u in store.allUnits" :key="u" :value="u" />
          </datalist>
        </div>

        <!-- Harga jual & beli -->
        <div class="price-row">
          <div class="field">
            <label for="f-hj">
              Harga Jual
              <span v-if="!form.hasVariants" class="req">*</span>
              <span v-else class="opt">(standar)</span>
            </label>
            <input
              id="f-hj"
              v-model="form.hargaJual"
              type="text"
              inputmode="numeric"
              placeholder="mis. 15000"
              @keydown.enter.prevent
            />
          </div>
          <div class="field" v-if="!form.tanpaStok">
            <label for="f-hb">Harga Beli <span class="opt">(opsional)</span></label>
            <input
              id="f-hb"
              v-model="form.hargaBeli"
              type="text"
              inputmode="numeric"
              placeholder="mis. 10000"
              @keydown.enter.prevent
            />
          </div>
        </div>

        <PriceTag :harga-jual="form.hargaJual" :harga-beli="form.hargaBeli" />

        <!-- Stok & stok min -->
        <div class="price-row" v-if="!form.tanpaStok && !form.hasVariants">
          <div class="field">
            <label for="f-stok">Stok Awal <span class="opt">(opsional)</span></label>
            <input
              id="f-stok"
              v-model="form.stok"
              type="text"
              :inputmode="form.desimal ? 'decimal' : 'numeric'"
              placeholder="0"
              @keydown.enter.prevent
            />
          </div>
          <div class="field">
            <label for="f-stokmin">Stok Min <span class="opt">(opsional)</span></label>
            <input
              id="f-stokmin"
              v-model="form.stokMin"
              type="text"
              :inputmode="form.desimal ? 'decimal' : 'numeric'"
              placeholder="5"
              @keydown.enter.prevent
            />
          </div>
        </div>

        <!-- Barcode -->
        <div class="field" v-if="!form.hasVariants">
          <label for="f-barcode">
            <AppIcon name="barcode" :size="13" />
            Barcode <span class="opt">(opsional)</span>
          </label>
          <input
            id="f-barcode"
            v-model="form.barcode"
            type="text"
            placeholder="Scan atau ketik barcode"
            autocomplete="off"
            @keydown.enter.prevent
          />
        </div>
      </div>

      <!-- Kolom Kanan: Detail & Tambahan -->
      <div class="form-col">
        <div class="detail-panel">
          <div class="detail-header">
            <h3>Detail Tambahan</h3>
            <p class="hint">Klik untuk membuka ukuran penuh di tengah layar</p>
          </div>
          <div class="detail-grid">
            <button class="detail-btn" type="button" @click="openHpp">
              <div class="detail-btn-left">
                <AppIcon name="hpp" :size="18" />
                <div>
                  <div class="detail-btn-title">Kalkulator HPP</div>
                  <div class="detail-btn-sub">Hitung HPP & saran harga jual</div>
                </div>
              </div>
              <AppIcon name="chevron-right" :size="16" />
            </button>
            <button class="detail-btn" type="button" @click="openVariant">
              <div class="detail-btn-left">
                <AppIcon name="variant" :size="18" />
                <div>
                  <div class="detail-btn-title">Varian Produk</div>
                  <div class="detail-btn-sub">{{ form.hasVariants ? (form.variants?.filter(v => v.v1 || v.v2).length || 0) + ' varian terisi' : 'Belum diaktifkan' }}</div>
                </div>
              </div>
              <AppIcon name="chevron-right" :size="16" />
            </button>
            <button class="detail-btn" type="button" @click="openUnit">
              <div class="detail-btn-left">
                <AppIcon name="unit" :size="18" />
                <div>
                  <div class="detail-btn-title">Satuan Tambahan</div>
                  <div class="detail-btn-sub">{{ form.units?.filter(u => u.name).length || 0 }} satuan</div>
                </div>
              </div>
              <AppIcon name="chevron-right" :size="16" />
            </button>
            <button v-if="!form.tanpaStok || form.batches.length" class="detail-btn" type="button" @click="openBatch">
              <div class="detail-btn-left">
                <AppIcon name="batch" :size="18" />
                <div>
                  <div class="detail-btn-title">Batch / Kadaluarsa</div>
                  <div class="detail-btn-sub">{{ form.batches?.filter(b => b.no || b.exp).length || 0 }} batch</div>
                </div>
              </div>
              <AppIcon name="chevron-right" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pesan validasi -->
    <MessageList :messages="visibleMessages" />

    <!-- Sticky kategori/satuan -->
    <div class="sticky-row">
      <label class="check-label">
        <input type="checkbox" :checked="store.sticky" @change="store.setSticky($event.target.checked)" />
        Tempel kategori &amp; satuan
      </label>
    </div>

    <!-- Tombol simpan -->
    <div class="form-footer">
      <button
        class="btn primary"
        type="button"
        :disabled="hasErrors && submitAttempted"
        @click="handleSubmit"
      >
        <AppIcon name="save" :size="16" />
        {{ isEditing ? 'Simpan Perubahan' : 'Tambah Produk' }}
      </button>
      <button v-if="!isEditing" class="btn quiet" type="button" @click="handleClear">
        <AppIcon name="clear" :size="14" />
        Bersihkan
      </button>
    </div>

    <AppModal v-model="showHpp" title="Kalkulator HPP" icon="hpp">
      <HppCalculator :hpp-state="hpp" :form="form" @applied="showHpp = false" />
    </AppModal>

    <AppModal v-model="showVariant" title="Varian Produk" icon="variant">
      <VariantPanel :form="form" :all-v-types="store.allVTypes" />
    </AppModal>

    <AppModal v-model="showUnit" title="Satuan Tambahan" icon="unit">
      <UnitRows :units="form.units" :all-units="store.allUnits" />
    </AppModal>

    <AppModal v-model="showBatch" title="Batch / Kadaluarsa" icon="batch">
      <BatchRows :batches="form.batches" />
    </AppModal>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import AppIcon from '../icons/AppIcon.vue'
import PriceTag from './PriceTag.vue'
import HppCalculator from './HppCalculator.vue'
import VariantPanel from './VariantPanel.vue'
import UnitRows from './UnitRows.vue'
import BatchRows from './BatchRows.vue'
import MessageList from './MessageList.vue'
import AppModal from './AppModal.vue'
import { useProductForm } from '../composables/useProductForm.js'
import { useProductStore } from '../stores/products.js'

const emit = defineEmits(['saved', 'cancel', 'toast'])

const store = useProductStore()
const {
  form, isEditing, isDuplicate, submitAttempted,
  visibleMessages, hasErrors,
  hpp,
  clearForm, fillForm, fillDuplicate, buildProductObject,
} = useProductForm()

const namaRef = ref(null)
const showHpp = ref(false)
const showVariant = ref(false)
const showUnit = ref(false)
const showBatch = ref(false)

const blankVariant = () => ({ v1: '', v2: '', jual: '', beli: '', stok: '', barcode: '' })

function openHpp() {
  showHpp.value = true
}
function openVariant() {
  if (!form.hasVariants) {
    form.hasVariants = true
    if (form.variants.length === 0) form.variants.push(blankVariant(), blankVariant())
  }
  showVariant.value = true
}
function openUnit() {
  showUnit.value = true
}
function openBatch() {
  showBatch.value = true
}

function onVariantToggle() {
  if (form.hasVariants && form.variants.length === 0) form.variants.push(blankVariant(), blankVariant())
}

function handleSubmit() {
  submitAttempted.value = true
  if (hasErrors.value) return
  const p = buildProductObject()
  const wasEditing = isEditing.value
  if (wasEditing) {
    if (store.update(form.id, p)) {
      emit('toast', `Diperbarui: ${p.nama}`)
    } else {
      // produk asli sudah terhapus (mis. dari perangkat lain)
      store.add(p)
      emit('toast', `Produk asli sudah terhapus, disimpan sebagai baru: ${p.nama}`)
    }
  } else {
    store.add(p)
    emit('toast', `Ditambahkan: ${p.nama}`)
  }
  emit('saved')
  clearForm(!wasEditing)
  nextTick(() => namaRef.value?.focus())
}

function handleCancel() {
  clearForm()
  emit('cancel')
}

function handleClear() {
  clearForm(false)
  nextTick(() => namaRef.value?.focus())
}

function focusNext() {
  document.getElementById('f-kategori')?.focus()
}

function startEdit(product) {
  fillForm(product)
  nextTick(() => namaRef.value?.focus())
  namaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function startDuplicate(product) {
  fillDuplicate(product)
  nextTick(() => namaRef.value?.focus())
  namaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Dipanggil saat produk yang sedang diedit dihapus dari daftar */
function cancelIfEditing(id) {
  if (form.id === id) {
    clearForm(false)
    emit('cancel')
  }
}

defineExpose({ startEdit, startDuplicate, cancelIfEditing })
</script>

<style scoped>
.product-form { display: flex; flex-direction: column; gap: 12px; }
.form-header { display: flex; align-items: center; justify-content: space-between; }
.form-header h2 { margin: 0; display: flex; align-items: center; gap: 8px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.form-col { display: flex; flex-direction: column; gap: 12px; }
.detail-panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.detail-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-header h3 { margin: 0; font-size: 15px; }
.detail-grid { display: flex; flex-direction: column; }
.detail-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--line);
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.detail-btn:last-child { border-bottom: none; }
.detail-btn:hover { background: var(--panel-2); }
.detail-btn-left { display: flex; align-items: center; gap: 10px; }
.detail-btn-title { font-weight: 600; }
.detail-btn-sub { font-size: 12px; color: var(--muted); }
.field { display: flex; flex-direction: column; }
.req { color: var(--err); }
.opt { font-weight: 400; color: var(--muted); font-size: 12px; }
.price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.check-row { display: flex; gap: 16px; flex-wrap: wrap; }
.check-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.sticky-row { padding-top: 4px; border-top: 1px solid var(--line); }
.form-footer { display: flex; gap: 8px; align-items: center; }
@media (max-width: 1100px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
