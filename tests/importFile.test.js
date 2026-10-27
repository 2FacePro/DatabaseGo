import { describe, it, expect, vi } from 'vitest'
import { importFile } from '../src/lib/importFile.js'
import XLSX from 'xlsx/dist/xlsx.mini.min.js'

function makeXlsxFile(rows) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new File([buf], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

describe('importFile', () => {
  it('baca file dengan benar dan ekstrak data', async () => {
    const rows = [
      ['Nama', 'Kategori', 'Barcode', 'Satuan', 'Variant1Type', 'Variant2Type'],
      ['### DATA START (Jangan hapus baris ini!) ###'],
      ['Mie Goreng', 'Mie Instan', '1234567', 'BUNGKUS', '', ''],
      ['Beras', 'Sembako', '9876543', 'KG', '', ''],
    ]
    const file = makeXlsxFile(rows)
    const result = await importFile(file, XLSX)
    expect(result.count).toBe(2)
    expect(result.cats).toContain('Mie Instan')
    expect(result.cats).toContain('Sembako')
    expect(result.barcodes).toContain('1234567')
    expect(result.file).toBe('test.xlsx')
  })

  it('baris varian dengan nama sama dihitung satu produk', async () => {
    const rows = [
      ['Nama', 'Kategori', 'Barcode', 'Satuan', 'HasVariants', 'Variant1Type', 'Variant1Value'],
      ['### DATA START ###'],
      ['Indomie', 'Mie Instan', '', 'BUNGKUS', 'TRUE', 'Rasa', 'Goreng'],
      ['Indomie', 'Mie Instan', '', 'BUNGKUS', 'TRUE', 'Rasa', 'Soto'],
      ['Beras', 'Sembako', '', 'KG', '', '', ''],
    ]
    const file = makeXlsxFile(rows)
    const result = await importFile(file, XLSX)
    // Indomie 2 baris = 1 produk, Beras = 1 produk → total 2
    expect(result.count).toBe(2)
  })

  it('error jika A1 bukan Nama', async () => {
    const rows = [
      ['ID', 'Name', 'Price'],
      ['1', 'Product A', '10000'],
    ]
    const file = makeXlsxFile(rows)
    await expect(importFile(file, XLSX)).rejects.toThrow('Bukan format template')
  })
})
