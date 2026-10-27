import { describe, it, expect } from 'vitest'
import { pnum, norm, key, formatRp, formatQty } from '../src/lib/parse.js'

describe('pnum - mode uang (money=true)', () => {
  it('angka titik ribuan → hapus titik', () => {
    expect(pnum('4.000', true)).toBe(4000)
  })
  it('prefix Rp dengan spasi', () => {
    expect(pnum('Rp 2.875', true)).toBe(2875)
  })
  it('desimal dengan koma', () => {
    expect(pnum('12333,33', true)).toBe(12333.33)
  })
  it('angka biasa', () => {
    expect(pnum('10000', true)).toBe(10000)
  })
  it('kosong → null', () => {
    expect(pnum('', true)).toBeNull()
  })
  it('string tidak valid → NaN', () => {
    expect(pnum('abc', true)).toBeNaN()
  })
})

describe('pnum - mode qty (money=false)', () => {
  it('desimal koma', () => {
    expect(pnum('49,5', false)).toBe(49.5)
  })
  it('pola ribuan 1.000', () => {
    expect(pnum('1.000', false)).toBe(1000)
  })
  it('pola ribuan 12.500', () => {
    expect(pnum('12.500', false)).toBe(12500)
  })
  it('desimal biasa 0.5 (titik)', () => {
    expect(pnum('0.5', false)).toBe(0.5)
  })
  it('kosong → null', () => {
    expect(pnum('', false)).toBeNull()
  })
})

describe('norm', () => {
  it('trim dan collapse spasi', () => {
    expect(norm('  Gula   Pasir  ')).toBe('Gula Pasir')
  })
  it('null → string kosong', () => {
    expect(norm(null)).toBe('')
  })
})

describe('key', () => {
  it('huruf kecil + trim', () => {
    expect(key('Sembako')).toBe('sembako')
    expect(key('SEMBAKO')).toBe('sembako')
  })
})

describe('formatRp', () => {
  it('format angka jadi Rp', () => {
    expect(formatRp(10000)).toBe('Rp10.000')
  })
  it('null → kosong', () => {
    expect(formatRp(null)).toBe('')
  })
})
