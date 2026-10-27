import { describe, it, expect } from 'vitest'
import { calcHpp } from '../src/lib/hpp.js'

describe('calcHpp - skenario 2 (HPP sederhana)', () => {
  it('markup 20%, bulat 100, isi 5kg seharga 60000', () => {
    const r = calcHpp({
      hargaKemasan: 60000,
      isi: 5,
      jumlah: 1,
      biaya: 0,
      susut: 0,
      untung: 20,
      mode: 'markup',
      bulat: 100,
    })
    expect(r.ok).toBe(true)
    expect(r.hpp).toBe(12000)
    expect(r.jual).toBe(14400)
    // untung per satuan = 14400 - 12000 = 2400
    // 2400/12000 = 20% dari modal
    // 2400/14400 = 16.67% dari harga jual
    expect(r.hpp).toBe(12000)
    expect(r.jual).toBe(14400)
    expect(r.qty).toBe(5)
    expect(r.total).toBe(60000)
  })
})

describe('calcHpp - skenario 3 (HPP lengkap)', () => {
  it('margin 15%, jumlah 10, biaya 50000, susut 2%, bulat 500', () => {
    const r = calcHpp({
      hargaKemasan: 62500,
      isi: 5,
      jumlah: 10,
      biaya: 50000,
      susut: 2,
      untung: 15,
      mode: 'margin',
      bulat: 500,
    })
    expect(r.ok).toBe(true)
    expect(r.total).toBe(675000) // 62500*10 + 50000
    // qty bersih = 5 * 10 * (1 - 0.02) = 49
    expect(r.qty).toBeCloseTo(49, 5)
    // hpp = 675000 / 49 ≈ 13775.51
    expect(r.hpp).toBeCloseTo(13775.51, 1)
    // jual = ceil(hpp / (1-0.15) / 500) * 500
    // = ceil(13775.51 / 0.85 / 500) * 500
    // = ceil(16206.48 / 500) * 500
    // = ceil(32.41) * 500 = 33 * 500 = 16500
    expect(r.jual).toBe(16500)
  })
})

describe('calcHpp - error cases', () => {
  it('kosong → error', () => {
    const r = calcHpp({ hargaKemasan: null, isi: null, untung: 20, mode: 'markup', bulat: 100 })
    expect(r.ok).toBe(false)
    expect(r.error).toBeTruthy()
  })
  it('harga 0 → error', () => {
    const r = calcHpp({ hargaKemasan: 0, isi: 5, untung: 20, mode: 'markup', bulat: 100 })
    expect(r.ok).toBe(false)
  })
  it('susut >= 100 → error', () => {
    const r = calcHpp({ hargaKemasan: 1000, isi: 5, susut: 100, untung: 20, mode: 'markup', bulat: 100 })
    expect(r.ok).toBe(false)
  })
  it('margin >= 100 → error', () => {
    const r = calcHpp({ hargaKemasan: 1000, isi: 5, susut: 0, untung: 100, mode: 'margin', bulat: 100 })
    expect(r.ok).toBe(false)
  })
})
