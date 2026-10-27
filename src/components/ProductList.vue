<template>
  <div class="panel product-list">
    <div class="list-header">
      <h2 style="margin:0">
        Daftar Produk
        <span v-if="store.products.length" class="chip">{{ store.products.length }}</span>
      </h2>
      <div class="list-actions">
        <div class="search-wrap">
          <AppIcon name="search" :size="15" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none" />
          <input
            v-model="query"
            type="text"
            class="search-input"
            placeholder="Cari produk…"
            @keydown.enter.prevent
          />
          <button v-if="query" class="btn icon-only quiet clear-search" type="button" @click="query=''" aria-label="Hapus pencarian">
            <AppIcon name="close" :size="13" />
          </button>
        </div>
        <button
          v-if="store.products.length > 0"
          class="btn quiet danger"
          type="button"
          @click="twoTap('clear-all', 'Hapus Semua?', doClear)"
        >
          <AppIcon name="clear" :size="14" />
          {{ armed['clear-all'] ? 'Yakin hapus semua?' : 'Hapus Semua' }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="store.products.length === 0" class="empty">
      <AppIcon name="product" :size="40" />
      <p>Belum ada produk. Tambah produk di form atas.</p>
    </div>

    <!-- No results -->
    <div v-else-if="filtered.length === 0" class="empty">
      <AppIcon name="search" :size="32" />
      <p>Tidak ada produk yang cocok dengan "{{ query }}"</p>
    </div>

    <!-- List -->
    <div v-else class="card-list">
      <ProductCard
        v-for="p in filtered"
        :key="p.id"
        :product="p"
        :is-editing="editingId === p.id"
        @edit="handleEdit(p)"
        @duplicate="handleDuplicate(p)"
        @remove="handleRemove(p.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '../icons/AppIcon.vue'
import ProductCard from './ProductCard.vue'
import { useProductStore } from '../stores/products.js'
import { useTwoTap } from '../composables/useTwoTap.js'
import { key, norm } from '../lib/parse.js'

const emit = defineEmits(['edit', 'duplicate', 'removed', 'toast'])

const store = useProductStore()
const { armed, twoTap } = useTwoTap()

const query = ref('')
const editingId = ref(null)

const filtered = computed(() => {
  const q = key(query.value)
  if (!q) return store.products
  return store.products.filter(p =>
    key(norm(p.nama || '')).includes(q) ||
    key(norm(p.kategori || '')).includes(q) ||
    (p.barcode && key(p.barcode).includes(q)) ||
    (p.variants || []).some(v => key(norm(v.v1 || '')).includes(q) || key(norm(v.v2 || '')).includes(q))
  )
})

function handleEdit(p) {
  editingId.value = p.id
  emit('edit', p)
}

function handleDuplicate(p) {
  editingId.value = null
  emit('duplicate', p)
}

function handleRemove(id) {
  if (editingId.value === id) editingId.value = null
  store.remove(id)
  emit('removed', id)
  emit('toast', 'Produk dihapus')
}

function doClear() {
  const ids = store.products.map(p => p.id)
  store.clear()
  editingId.value = null
  ids.forEach(id => emit('removed', id))
  emit('toast', 'Semua produk dihapus')
}

defineExpose({
  clearEditing: () => { editingId.value = null }
})
</script>

<style scoped>
.product-list { display: flex; flex-direction: column; gap: 12px; }
.list-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.list-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-wrap { position: relative; }
.search-input {
  padding-left: 30px;
  padding-right: 28px;
  min-height: 36px;
  width: 200px;
  font-size: 13px;
}
.clear-search { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); }
.card-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
@media (max-width: 900px) {
  .card-list { grid-template-columns: 1fr; }
}
.empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty p { margin: 0; font-size: 14px; }
.danger { color: var(--err); }
</style>
