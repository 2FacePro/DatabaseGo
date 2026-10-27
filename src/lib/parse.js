/**
 * Bersihkan dan normalisasi string: trim + collapse spasi
 * @param {string} s
 * @returns {string}
 */
export function norm(s) {
  return String(s ?? '').trim().replace(/\s+/g, ' ')
}

/**
 * Buat key perbandingan: huruf kecil + trim + collapse
 * @param {string} s
 * @returns {string}
 */
export function key(s) {
  return norm(s).toLowerCase()
}

/**
 * Parse angka dari input teks
 * @param {string} text
 * @param {boolean} money - true = mode uang (harga), false = mode jumlah
 * @returns {number|null} null jika kosong, NaN jika tidak valid
 */
export function pnum(text, money = false) {
  const s = String(text ?? '').trim()
  if (!s) return null
  let cleaned = s
  if (money) {
    // hapus R, p, spasi, titik sebagai pemisah ribuan; koma → desimal
    cleaned = cleaned.replace(/[Rp\s]/g, '').replace(/\./g, '').replace(',', '.')
  } else {
    // mode qty: deteksi pola ribuan (mis. 1.000 atau 12.500)
    cleaned = cleaned.replace(/\s/g, '')
    const thousandPattern = /^\d{1,3}(\.\d{3})+$/
    if (thousandPattern.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '')
    } else {
      cleaned = cleaned.replace(',', '.')
    }
  }
  const n = Number(cleaned)
  return cleaned === '' ? null : n
}

/**
 * Format angka sebagai Rupiah (mis. Rp12.000)
 * @param {number|null} n
 * @returns {string}
 */
export function formatRp(n) {
  if (n == null || isNaN(n)) return ''
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

/**
 * Format angka qty dengan koma sebagai desimal
 * @param {number|null} n
 * @param {number} decimals
 * @returns {string}
 */
export function formatQty(n, decimals = 3) {
  if (n == null || isNaN(n)) return ''
  return n.toLocaleString('id-ID', { maximumFractionDigits: decimals })
}

/**
 * Display nilai angka untuk input (koma sebagai desimal)
 * @param {number|null} n
 * @returns {string}
 */
export function displayNum(n) {
  if (n == null || isNaN(n)) return ''
  return String(n).replace('.', ',')
}
