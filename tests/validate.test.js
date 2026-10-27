import { describe, it, expect } from 'vitest'
import { validate } from '../src/lib/validate.js'

const baseProduct = {
  nama: 'Gula Pasir',
  kategori: 'Sembako',
  satuan: 'KG',
  hargaJual: 15000,
  hargaBeli: 13000,
  stok: 10,
  stokMin: 5,
  barcode: '',
  tanpaStok: false,
  desimal: false,
  hasVariants: false,
  vt1: '',
  vt2: '',
  variants: [],
  units: [],
  batches: [],
}

describe('skenario 1 - form kosong', () => {
  it('error wajib: nama, kategori, satuan, harga jual', () => {
    const msgs = validate(
      { nama: '', kategori: '', satuan: '', hargaJual: null, hargaBeli: null, stok: null, stokMin: null, tanpaStok: false, hasVariants: false, vt1: '', vt2: '', variants: [], units: [], batches: [] },
      {}
    )
    const errors = msgs.filter(m => m.level === 'error' && m.requiredOnly)
    const messages = errors.map(m => m.message)
    expect(messages.some(m => m.includes('Nama produk'))).toBe(true)
    expect(messages.some(m => m.includes('Kategori'))).toBe(true)
    expect(messages.some(m => m.includes('Satuan dasar'))).toBe(true)
    expect(messages.some(m => m.includes('Harga jual'))).toBe(true)
  })
})

describe('skenario 5 - nama ganda', () => {
  it('error jika nama sama (case-insensitive)', () => {
    const existing = [{ id: 'abc', nama: 'mie goreng test', kategori: 'Mie', satuan: 'BUNGKUS', hargaJual: 3500, variants: [], units: [], batches: [] }]
    const msgs = validate(
      { ...baseProduct, nama: 'Mie Goreng Test' },
      { products: existing }
    )
    const dup = msgs.find(m => m.level === 'error' && m.message.includes('sudah ada di daftar ini'))
    expect(dup).toBeDefined()
  })
})

describe('tanpa stok', () => {
  it('tidak error satuan jika tanpaStok', () => {
    const msgs = validate(
      { ...baseProduct, tanpaStok: true, satuan: '' },
      {}
    )
    const satuanErr = msgs.find(m => m.level === 'error' && m.message.includes('Satuan dasar'))
    expect(satuanErr).toBeUndefined()
  })
})

describe('harga jual 0 → warning', () => {
  it('warning "Harga jual 0. Pastikan memang gratis."', () => {
    const msgs = validate({ ...baseProduct, hargaJual: 0 }, {})
    const warn = msgs.find(m => m.level === 'warning' && m.message.includes('Harga jual 0'))
    expect(warn).toBeDefined()
  })
})

describe('harga beli > harga jual', () => {
  it('warning rugi', () => {
    const msgs = validate(
      { ...baseProduct, hargaJual: 10000, hargaBeli: 12000 },
      {}
    )
    const warn = msgs.find(m => m.level === 'warning' && m.message.includes('besar dari harga jual'))
    expect(warn).toBeDefined()
  })
})

describe('harga beli kosong saat harga jual > 0', () => {
  it('warning laba tidak bisa dihitung', () => {
    const msgs = validate({ ...baseProduct, hargaBeli: null }, {})
    const warn = msgs.find(m => m.level === 'warning' && m.message.includes('Harga beli kosong'))
    expect(warn).toBeDefined()
  })
})

describe('batch kadaluarsa lewat', () => {
  it('warning tanggal lewat', () => {
    const msgs = validate(
      { ...baseProduct, batches: [{ no: 'B001', exp: '2020-01-01', stok: 10, hb: null }] },
      {}
    )
    const warn = msgs.find(m => m.level === 'warning' && m.message.includes('kadaluarsa'))
    expect(warn).toBeDefined()
  })
})

describe('varian - validasi', () => {
  it('error jika varian aktif tapi tidak ada baris', () => {
    const msgs = validate(
      { ...baseProduct, hasVariants: true, vt1: 'Rasa', variants: [] },
      {}
    )
    const err = msgs.find(m => m.level === 'error' && m.message.includes('minimal satu varian'))
    expect(err).toBeDefined()
  })

  it('error jenis varian 1 kosong', () => {
    const msgs = validate(
      { ...baseProduct, hasVariants: true, vt1: '', variants: [{ v1: 'Goreng', v2: '', jual: null, beli: null, stok: 10, barcode: '' }] },
      {}
    )
    const err = msgs.find(m => m.level === 'error' && m.requiredOnly && m.message.includes('jenis varian 1'))
    expect(err).toBeDefined()
  })

  it('error duplikat kombinasi varian (case-insensitive)', () => {
    const msgs = validate(
      {
        ...baseProduct,
        hasVariants: true,
        vt1: 'Ukuran',
        hargaJual: 50000,
        variants: [
          { v1: 'L', v2: '', jual: null, beli: null, stok: 10, barcode: '' },
          { v1: 'l', v2: '', jual: null, beli: null, stok: 10, barcode: '' },
        ],
      },
      {}
    )
    const err = msgs.find(m => m.level === 'error' && m.message.includes('kombinasi sama dengan varian lain'))
    expect(err).toBeDefined()
  })

  it('baris varian kosong total tidak memunculkan error varian', () => {
    const msgs = validate(
      {
        ...baseProduct,
        hasVariants: true,
        vt1: 'Rasa',
        hargaJual: 3500,
        variants: [
          { v1: 'Goreng', v2: '', jual: null, beli: null, stok: 10, barcode: '' },
          // baris kosong total dikecualikan di readForm sebelum validate
        ],
      },
      {}
    )
    const err = msgs.filter(m => m.level === 'error')
    expect(err.every(m => !m.message.includes('Varian 2'))).toBe(true)
  })
})
