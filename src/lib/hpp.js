/**
 * @typedef {Object} HppInput
 * @property {number|null} hargaKemasan
 * @property {number|null} isi
 * @property {number|null} jumlah
 * @property {number|null} biaya
 * @property {number|null} susut
 * @property {number|null} untung
 * @property {'markup'|'margin'} mode
 * @property {number} bulat
 */

/**
 * @typedef {Object} HppResult
 * @property {boolean} ok
 * @property {string} error
 * @property {number} total
 * @property {number} qty
 * @property {number} hpp
 * @property {number} jual
 */

const fail = (error, total = 0) => ({ ok: false, error, total, qty: 0, hpp: 0, jual: 0 })

/**
 * Hitung HPP dari data kemasan
 * @param {HppInput} input
 * @returns {HppResult}
 */
export function calcHpp(input) {
  const { hargaKemasan, isi, jumlah, biaya, susut, untung, mode = 'markup', bulat = 100 } = input

  if (hargaKemasan == null || isi == null) {
    return fail('Isi harga beli dan isi per kemasan untuk menghitung modal per satuan.')
  }
  // NaN muncul jika teks bukan angka (mis. "abc")
  if ([hargaKemasan, isi, jumlah, biaya, susut, untung].some(n => n != null && !Number.isFinite(n))) {
    return fail('Ada isian yang bukan angka. Periksa kembali.')
  }
  if (hargaKemasan <= 0 || isi <= 0) {
    return fail('Harga beli kemasan dan isi per kemasan harus lebih dari 0.')
  }
  const jmlValue = jumlah ?? 1
  if (jmlValue <= 0) return fail('Jumlah kemasan harus lebih dari 0.')

  const biayaVal = biaya ?? 0
  const susutVal = susut ?? 0
  if (biayaVal < 0) return fail('Biaya tambahan harus angka tidak negatif.')
  if (susutVal < 0) return fail('Susut harus angka tidak negatif.')
  if (susutVal >= 100) return fail('Susut tidak bisa 100% atau lebih.')
  if (untung == null || untung < 0) return fail('Target untung harus angka tidak negatif.')
  if (mode === 'margin' && untung >= 100) {
    return fail('Target untung pada mode margin tidak bisa 100% atau lebih.')
  }

  const totalModal = hargaKemasan * jmlValue + biayaVal
  const qtyBersih = isi * jmlValue * (1 - susutVal / 100)

  if (qtyBersih <= 0) return fail('Qty bersih setelah susut tidak lebih dari 0.', totalModal)

  const hpp = Math.round((totalModal / qtyBersih) * 100) / 100

  const hargaMentah = mode === 'markup' ? hpp * (1 + untung / 100) : hpp / (1 - untung / 100)

  const jual = bulat > 1
    ? Math.ceil(hargaMentah / bulat - 1e-9) * bulat
    : Math.ceil(hargaMentah - 1e-9)

  return { ok: true, error: '', total: totalModal, qty: qtyBersih, hpp, jual }
}
