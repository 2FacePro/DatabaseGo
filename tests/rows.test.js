import { describe, it, expect } from 'vitest'
import { toRows, buildWorkbook, HEAD, MARKER } from '../src/lib/rows.js'
import XLSX from 'xlsx/dist/xlsx.mini.min.js'

const baseProduk = {
  nama: 'Gula Pasir',
  kategori: 'Sembako',
  satuan: 'KG',
  barcode: '',
  tanpaStok: false,
  desimal: false,
  hasVariants: false,
  hargaJual: 15000,
  hargaBeli: 13000,
  stok: 10,
  stokMin: 5,
  variants: [],
  units: [],
  batches: [],
}

describe('skenario 8 - tanpa stok', () => {
  it('TanpaStok TRUE, HargaBeli 0, Stok 0, Satuan -, StokMin null', () => {
    const rows = toRows({ ...baseProduk, tanpaStok: true, satuan: '', stokMin: 5 })
    expect(rows).toHaveLength(1)
    const r = rows[0]
    expect(r[3]).toBe('TRUE')     // TanpaStok
    expect(r[10]).toBe(0)         // HargaBeli
    expect(r[11]).toBe(0)         // Stok
    expect(r[13]).toBe('-')       // Satuan — kosong → '-'
    // StokMin: sesuai dbapp.txt r[12] = p.tanpaStok ? null : p.stokMin → null
    expect(r[12]).toBeNull()      // StokMin kosong
  })
})

describe('skenario 6 - produk desimal dengan satuan tambahan', () => {
  it('qty desimal TRUE, Unit1 dan Unit2 terisi', () => {
    const rows = toRows({
      ...baseProduk,
      nama: 'Gula',
      hargaJual: 20000,
      hargaBeli: 18500,
      stok: 49.5,
      desimal: true,
      units: [
        { name: '1/2 kg', price: 10000, hb: null, isi: 0.5 },
        { name: '1/4 kg', price: 5000, hb: null, isi: 0.25 },
        { name: '', price: '', hb: '', isi: '' },
      ],
    })
    expect(rows).toHaveLength(1)
    const r = rows[0]
    expect(r[11]).toBe(49.5)      // Stok
    expect(r[14]).toBe('1/2 kg')  // Unit1
    expect(r[15]).toBe(10000)     // Price1
    expect(r[17]).toBe(0.5)       // JumlahIsi1
    expect(r[18]).toBe('1/4 kg')  // Unit2
    expect(r[19]).toBe(5000)      // Price2
    expect(r[21]).toBe(0.25)      // JumlahIsi2
    expect(r[28]).toBe('TRUE')    // QtyDesimal
  })
})

describe('skenario 7 - batch', () => {
  it('dua batch → dua baris Excel', () => {
    const rows = toRows({
      ...baseProduk,
      barcode: '1234567890',
      batches: [
        { no: 'B001', exp: '2025-12-01', stok: 20, hb: 12500 },
        { no: 'B002', exp: '2026-06-01', stok: 30, hb: 13000 },
      ],
    })
    expect(rows).toHaveLength(2)
    // Nama dan harga jual sama
    expect(rows[0][0]).toBe(baseProduk.nama)
    expect(rows[1][0]).toBe(baseProduk.nama)
    expect(rows[0][9]).toBe(15000)  // HargaJual
    expect(rows[1][9]).toBe(15000)
    // Stok berbeda
    expect(rows[0][11]).toBe(20)
    expect(rows[1][11]).toBe(30)
    // BatchNumber berbeda
    expect(rows[0][26]).toBe('B001')
    expect(rows[1][26]).toBe('B002')
    // Barcode sama di kedua baris — toRows menyimpan sebagai string biasa
    // (wrapping ke {t:'s'} hanya dilakukan di buildWorkbook)
    expect(rows[0][2]).toBe('1234567890')
    expect(rows[1][2]).toBe('1234567890')
  })
})

describe('skenario 13 - varian satu jenis (Indomie)', () => {
  it('3 varian → 3 baris Excel sesuai spesifikasi', () => {
    const rows = toRows({
      nama: 'Indomie',
      kategori: 'Mie Instan',
      satuan: 'BUNGKUS',
      barcode: '',
      tanpaStok: false,
      desimal: false,
      hasVariants: true,
      hargaJual: 3500,
      hargaBeli: 2800,
      stok: null,
      stokMin: 5,
      vt1: 'Rasa',
      vt2: '',
      variants: [
        { v1: 'Goreng', v2: '', jual: null, beli: null, stok: 100, barcode: '8991111111111' },
        { v1: 'Soto',   v2: '', jual: 3600, beli: null, stok: 50,  barcode: '' },
        { v1: 'Kari Ayam', v2: '', jual: null, beli: null, stok: 30, barcode: '' },
      ],
      units: [],
      batches: [],
    })
    expect(rows).toHaveLength(3)

    // Baris 1: Goreng
    expect(rows[0][4]).toBe('TRUE')         // HasVariants
    expect(rows[0][5]).toBe('Rasa')         // Variant1Type
    expect(rows[0][6]).toBe('Goreng')       // Variant1Value
    expect(rows[0][9]).toBe(3500)           // HargaJual (pakai standar)
    expect(rows[0][10]).toBe(2800)          // HargaBeli (pakai standar)
    expect(rows[0][11]).toBe(100)           // Stok
    expect(rows[0][12]).toBe(5)             // StokMin (hanya baris 1)
    // Barcode di baris 1 adalah barcode varian
    expect(rows[0][2]).toBe('8991111111111')

    // Baris 2: Soto dengan harga berbeda
    expect(rows[1][6]).toBe('Soto')
    expect(rows[1][9]).toBe(3600)           // HargaJual override
    expect(rows[1][10]).toBe(2800)          // HargaBeli standar
    expect(rows[1][11]).toBe(50)
    expect(rows[1][12]).toBeNull()          // StokMin kosong di baris 2+

    // Baris 3: Kari Ayam
    expect(rows[2][6]).toBe('Kari Ayam')
    expect(rows[2][9]).toBe(3500)
    expect(rows[2][11]).toBe(30)
  })
})

describe('HEAD dan MARKER', () => {
  it('HEAD punya 29 kolom dengan urutan benar', () => {
    expect(HEAD).toHaveLength(29)
    expect(HEAD[0]).toBe('Nama')
    expect(HEAD[4]).toBe('HasVariants')
    expect(HEAD[28]).toBe('QtyDesimal')
    expect(HEAD[26]).toBe('BatchNumber')
    expect(HEAD[27]).toBe('ExpiryDate')
  })

  it('MARKER mengandung DATA START', () => {
    expect(MARKER).toContain('DATA START')
    expect(MARKER).toContain('###')
  })
})

describe('buildWorkbook', () => {
  it('menghasilkan workbook dengan sheet Petunjuk dan Data', () => {
    const wb = buildWorkbook([baseProduk], XLSX)
    expect(wb.SheetNames).toContain('Petunjuk')
    expect(wb.SheetNames).toContain('Data')
    // Urutan sheet: Petunjuk dulu
    expect(wb.SheetNames[0]).toBe('Petunjuk')
    expect(wb.SheetNames[1]).toBe('Data')
  })

  it('A1 sheet Data adalah "Nama" dan A2 adalah penanda', () => {
    const wb = buildWorkbook([baseProduk], XLSX)
    const ws = wb.Sheets['Data']
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
    expect(rows[0][0]).toBe('Nama')
    expect(rows[0].length).toBe(29)
    expect(String(rows[1][0])).toContain('DATA START')
  })

  it('kolom angka bertipe angka (bukan string)', () => {
    const wb = buildWorkbook([{ ...baseProduk, hargaJual: 15000 }], XLSX)
    const ws = wb.Sheets['Data']
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
    const dataRow = rows[2] // baris 3 (setelah header dan marker)
    const hargaJual = dataRow[9]
    expect(typeof hargaJual).toBe('number')
  })
})
