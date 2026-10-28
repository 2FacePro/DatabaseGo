<template>
  <AppHeader
    :product-count="store.products.length"
    :row-count="store.rowCount"
    :draft-count="store.draftCount"
    :known="store.known"
    :downloading="downloading"
    :sync-status="store.syncStatus"
    :sync-error="store.syncError"
    :pending="store.pendingCount"
    :divide-units="store.exportOpts.divideVariantUnits"
    @load-file="handleLoadFile"
    @download="handleDownload"
    @preview="showPreview = true"
    @sync="store.syncNow()"
    @toggle-divide="(v) => (store.exportOpts.divideVariantUnits = v)"
  />

  <p v-if="!store.storageOk" class="storage-note">
    Penyimpanan lokal tidak aktif di browser ini. Data hanya aman jika sinkron Firebase aktif; unduh
    Excel secara berkala.
  </p>

  <main class="layout">
    <ProductForm ref="formRef" @saved="handleSaved" @cancel="handleCancel" @toast="toast" />
    <ProductList
      ref="productListRef"
      @edit="handleEdit"
      @duplicate="handleDuplicate"
      @removed="handleRemoved"
      @toast="toast"
    />
  </main>

  <ExcelPreview v-model="showPreview" />

  <AppToast />

  <input
    ref="fileInput"
    type="file"
    accept=".xlsx,.xls"
    class="sr"
    aria-label="Pilih file Excel produk"
    @change="handleFileChange"
  />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useProductStore } from "./stores/products.js";
import { useToast } from "./composables/useToast.js";
import AppHeader from "./components/AppHeader.vue";
import ProductForm from "./components/ProductForm.vue";
import ProductList from "./components/ProductList.vue";
import AppToast from "./components/AppToast.vue";
import ExcelPreview from "./components/ExcelPreview.vue";
import { importFile } from "./lib/importFile.js";
import { buildWorkbook, countDivided } from "./lib/rows.js";
import XLSX from "xlsx/dist/xlsx.mini.min.js";

const store = useProductStore();
const { toast } = useToast();
const formRef = ref(null);
const productListRef = ref(null);
const fileInput = ref(null);
const downloading = ref(false);
const showPreview = ref(false);

onMounted(() => store.startSync());
onBeforeUnmount(() => store.stopSync());

function handleSaved() {
  productListRef.value?.clearEditing();
}

function handleCancel() {
  productListRef.value?.clearEditing();
}

function handleEdit(product) {
  formRef.value?.startEdit(product);
}

function handleDuplicate(product) {
  formRef.value?.startDuplicate(product);
}

function handleRemoved(id) {
  formRef.value?.cancelIfEditing(id);
}

function handleLoadFile() {
  fileInput.value?.click();
}

async function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = "";
  try {
    const data = await importFile(file, XLSX);
    store.setKnown(data);

    const nProd = data.products?.length || 0;
    if (nProd > 0) {
      const { added, skipped } = store.importAsDrafts(data.products);
      toast(
        `Dimuat: ${data.count} di file · ${added} draf baru` +
          (skipped ? ` · ${skipped} dilewati (nama sudah ada)` : "") +
          ` · ${data.cats.length} kategori`,
      );
    } else {
      toast(
        `Referensi dimuat: ${data.count} nama, ${data.cats.length} kategori (tidak ada baris DATA START)`,
      );
    }
  } catch (err) {
    toast(err.message || "Gagal membaca file");
  }
}

async function handleDownload() {
  const list = store.readyProducts;
  if (!list.length) {
    toast(
      store.draftCount ? "Hanya ada draf. Selesaikan draf jadi produk dulu." : "Belum ada produk",
    );
    return;
  }
  downloading.value = true;
  try {
    const wb = buildWorkbook(list, XLSX, store.exportOpts);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fname = `produk-import-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.xlsx`;
    XLSX.writeFile(wb, fname);
    const nDiv = countDivided(list, store.exportOpts);
    const extra = store.draftCount ? ` · ${store.draftCount} draf tidak diunduh` : "";
    toast(`Diunduh: ${fname} · ${nDiv} harga satuan varian dibagi isi${extra}`);
  } catch (err) {
    toast(err.message || "Gagal membuat file Excel");
  } finally {
    downloading.value = false;
  }
}
</script>

<style>
.layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}
.storage-note {
  font-size: 13px;
  color: var(--warn);
  background: var(--warn-bg);
  padding: 8px 16px;
  margin: 0;
}
</style>
