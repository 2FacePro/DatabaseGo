import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '../src/stores/products.js'

// Mock localStorage
const storage = {}
vi.stubGlobal('localStorage', {
  getItem: (k) => storage[k] ?? null,
  setItem: (k, v) => { storage[k] = v },
  removeItem: (k) => { delete storage[k] },
})

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('store - add dan remove', () => {
  it('add menambah produk ke awal', () => {
    const store = useProductStore()
    store.add({ nama: 'Gula', kategori: 'Sembako', satuan: 'KG', hargaJual: 15000, hargaBeli: 13000, stok: 10, stokMin: 5, tanpaStok: false, desimal: false, hasVariants: false, variants: [], units: [], batches: [] })
    store.add({ nama: 'Beras', kategori: 'Sembako', satuan: 'KG', hargaJual: 12000, hargaBeli: 10000, stok: 20, stokMin: 5, tanpaStok: false, desimal: false, hasVariants: false, variants: [], units: [], batches: [] })
    expect(store.products[0].nama).toBe('Beras')
    expect(store.products[1].nama).toBe('Gula')
  })

  it('remove menghapus produk berdasarkan id', () => {
    const store = useProductStore()
    store.add({ nama: 'Test', kategori: 'A', satuan: 'PCS', hargaJual: 1000, hargaBeli: 800, stok: 5, stokMin: 1, tanpaStok: false, desimal: false, hasVariants: false, variants: [], units: [], batches: [] })
    const id = store.products[0].id
    store.remove(id)
    expect(store.products).toHaveLength(0)
  })

  it('clear mengosongkan semua produk', () => {
    const store = useProductStore()
    store.add({ nama: 'A', kategori: 'B', satuan: 'PCS', hargaJual: 1000, hargaBeli: 800, stok: 1, stokMin: 1, tanpaStok: false, desimal: false, hasVariants: false, variants: [], units: [], batches: [] })
    store.clear()
    expect(store.products).toHaveLength(0)
  })
})

describe('store - rowCount', () => {
  it('produk tanpa batch = 1 baris', () => {
    const store = useProductStore()
    store.add({ nama: 'Gula', kategori: 'A', satuan: 'KG', hargaJual: 15000, hargaBeli: 13000, stok: 10, stokMin: 5, tanpaStok: false, desimal: false, hasVariants: false, variants: [], units: [], batches: [] })
    expect(store.rowCount).toBe(1)
  })

  it('produk dengan 2 batch = 2 baris', () => {
    const store = useProductStore()
    store.add({
      nama: 'Yogurt', kategori: 'Dairy', satuan: 'PCS', hargaJual: 5000, hargaBeli: 4000,
      stok: 0, stokMin: 5, tanpaStok: false, desimal: false, hasVariants: false, variants: [], units: [],
      batches: [
        { no: 'B001', exp: '2025-12-01', stok: 10, hb: null },
        { no: 'B002', exp: '2026-01-01', stok: 15, hb: null },
      ],
    })
    expect(store.rowCount).toBe(2)
  })

  it('produk varian dengan 3 varian = 3 baris', () => {
    const store = useProductStore()
    store.add({
      nama: 'Indomie', kategori: 'Mie', satuan: 'BUNGKUS', hargaJual: 3500, hargaBeli: 2800,
      stok: null, stokMin: 5, tanpaStok: false, desimal: false, hasVariants: true,
      vt1: 'Rasa', vt2: '',
      variants: [
        { v1: 'Goreng', v2: '', jual: null, beli: null, stok: 100, barcode: '' },
        { v1: 'Soto',   v2: '', jual: 3600, beli: null, stok: 50,  barcode: '' },
        { v1: 'Kari Ayam', v2: '', jual: null, beli: null, stok: 30, barcode: '' },
      ],
      units: [], batches: [],
    })
    expect(store.rowCount).toBe(3)
  })
})

describe('store - localStorage gagal', () => {
  it('tetap berjalan meski localStorage error', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('QuotaExceeded') },
      setItem: () => { throw new Error('QuotaExceeded') },
      removeItem: () => {},
    })
    // Store tetap bisa dibuat
    const store = useProductStore()
    expect(store).toBeDefined()
    // Add tetap berfungsi di memori
    store.add({ nama: 'Test', kategori: 'A', satuan: 'PCS', hargaJual: 1000, hargaBeli: 800, stok: 1, stokMin: 1, tanpaStok: false, desimal: false, hasVariants: false, variants: [], units: [], batches: [] })
    expect(store.products).toHaveLength(1)
  })
})

describe('store - draft lama tanpa field varian', () => {
  it('produk lama tanpa hasVariants/variants terbaca tanpa error', () => {
    const oldDraft = {
      products: [
        { id: 'old1', nama: 'Produk Lama', kategori: 'Lama', satuan: 'PCS', hargaJual: 5000, hargaBeli: 4000, stok: 10, stokMin: 3, tanpaStok: false, desimal: false }
        // tidak ada hasVariants, variants, vt1, vt2
      ],
      known: { names: [], cats: [], units: [], barcodes: [], count: 0, file: '' },
      sticky: true,
      calc: { untung: '20', mode: 'markup', bulat: '100' },
    }
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify(oldDraft),
      setItem: () => {},
      removeItem: () => {},
    })
    setActivePinia(createPinia())
    const store = useProductStore()
    expect(store.products[0].hasVariants).toBe(false)
    expect(store.products[0].variants).toEqual([])
  })
})
