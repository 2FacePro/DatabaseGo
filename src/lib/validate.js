import { key, norm, pnum } from './parse.js'

/**
 * @typedef {Object} ValidationMessage
 * @property {'error'|'warning'|'info'} level
 * @property {string} message
 * @property {boolean} requiredOnly
 */

const num = (v, money) => (typeof v === 'number' ? v : pnum(String(v ?? ''), money))

/**
 * Hitung effective harga jual varian (pakai standar jika kosong)
 */
function effJual(p, v) {
  const vj = num(v.jual, true)
  const pj = num(p.hargaJual, true)
  if (vj != null && !Number.isNaN(vj)) return vj
  if (pj != null && !Number.isNaN(pj)) return pj
  return null
}

/**
 * Hitung rentang harga jual efektif semua varian
 */
function jualRange(p) {
  if (!p.hasVariants) {
    const hj = num(p.hargaJual, true)
    return hj != null && !Number.isNaN(hj) ? [hj] : []
  }
  return (p.variants || [])
    .map(v => effJual(p, v))
    .filter(x => x != null && !Number.isNaN(x))
}

/**
 * Kumpulkan barcode yang dipakai, kecuali produk yang sedang diedit
 */
function collectBarcodes(products, excludeId) {
  const set = new Set()
  for (const p of products) {
    if (p.id === excludeId) continue
    if (p.barcode) set.add(norm(String(p.barcode)))
    for (const v of (p.variants || [])) {
      if (v.barcode) set.add(norm(String(v.barcode)))
    }
  }
  return set
}

/** Tanggal hari ini (zona waktu lokal, bukan UTC) format YYYY-MM-DD */
function todayStr() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const unitFilled = u => !!(u.name || u.price != null || u.hb != null || u.isi != null)

/**
 * Validasi produk
 * @param {Object} p - produk (semua field angka sudah di-parse ke number atau null/NaN)
 * @param {{ products: Array, known: Object, editId: string|null }} ctx
 * @returns {ValidationMessage[]}
 */
export function validate(p, ctx = {}) {
  const { products = [], known = {}, editId = null } = ctx
  const out = []
  const E = (m, req = false) => out.push({ level: 'error', message: m, requiredOnly: !!req })
  const W = (m) => out.push({ level: 'warning', message: m, requiredOnly: false })
  const I = (m) => out.push({ level: 'info', message: m, requiredOnly: false })

  // --- wajib isi ---
  if (!p.nama) E('Nama produk wajib diisi', true)
  if (!p.kategori) E('Kategori wajib diisi', true)
  if (!p.tanpaStok && !p.satuan) E('Satuan dasar wajib diisi, mis. BUNGKUS atau KG', true)
  if (p.hargaJual == null && !p.hasVariants) E('Harga jual wajib diisi', true)

  // --- validasi angka ---
  ;[['Harga jual', p.hargaJual], ['Harga beli', p.hargaBeli], ['Stok', p.stok], ['Stok minimum', p.stokMin]].forEach(([n, v]) => {
    if (Number.isNaN(v)) E(n + ' bukan angka')
    else if (v != null && v < 0) E(n + ' tidak boleh negatif')
  })
  if (p.hargaJual === 0) W('Harga jual 0. Pastikan memang gratis.')

  // --- stok berkoma tanpa "Qty desimal" ---
  if (!p.desimal) {
    const frac = v => v != null && Number.isFinite(v) && !Number.isInteger(v)
    if (
      frac(p.stok) || frac(p.stokMin) ||
      (p.variants || []).some(v => frac(v.stok)) ||
      (p.batches || []).some(b => frac(b.stok))
    ) {
      W('Ada stok berkoma, tetapi "Qty desimal" belum dicentang. Centang jika produk dijual dengan jumlah desimal.')
    }
  }

  // --- nama ganda ---
  const k = key(p.nama || '')
  if (k) {
    const d = products.find(x => x.id !== editId && key(norm(x.nama || '')) === k)
    if (d) E(`Nama "${d.nama}" sudah ada di daftar ini`)
    else if ((known.names || []).includes(k)) E('Nama ini sudah ada di file produk lama yang dimuat')
  }

  // --- barcode non-varian ---
  if (p.barcode && !p.hasVariants) {
    const usedBc = collectBarcodes(products, editId)
    const knownBc = known.barcodes || []
    if (usedBc.has(norm(p.barcode)) || knownBc.includes(norm(p.barcode))) {
      E('Barcode ini sudah dipakai produk lain')
    }
  }

  // --- harga jual range ---
  const effJ = jualRange(p)
  const bj = effJ.length ? Math.min(...effJ) : null

  // --- satuan tambahan ---
  const seen = new Set([key(p.satuan || '')])
  ;(p.units || []).forEach((u, i) => {
    if (!unitFilled(u)) return
    const t = 'Satuan tambahan ' + (i + 1) + (u.name ? ' (' + u.name + ')' : '')
    if (!u.name) return E(t + ': nama satuan kosong')
    if (!(u.isi > 0)) return E(t + ': isi per satuan harus lebih dari 0')
    if (u.price == null || Number.isNaN(u.price) || u.price < 0) return E(t + ': harga jual kosong atau salah')
    if (seen.has(key(u.name))) return E(t + ': nama sama dengan satuan lain')
    seen.add(key(u.name))
    if (bj > 0 && u.price / u.isi > bj * 1.0001) {
      const satuanDasar = p.satuan || 'satuan dasar'
      const hPerSatuan = Math.round(u.price / u.isi).toLocaleString('id-ID')
      W(`${u.name}: harga per ${satuanDasar} (Rp${hPerSatuan}) lebih mahal dari harga jual satuan dasar. Cek lagi.`)
    }
  })

  // --- varian ---
  if (p.hasVariants) {
    const vs = p.variants || []
    if (!p.vt1) E('Isi jenis varian 1, mis. Rasa atau Ukuran', true)
    if (!vs.length) E('Tambahkan minimal satu varian', true)
    else if (vs.length === 1) W('Baru satu varian. Jika memang tidak ada pilihan lain, produk biasa lebih sederhana.')
    if ((p.batches || []).length) E('Batch belum dicontohkan bersama varian di template. Hapus batch atau matikan varian.')

    const hasUnits = (p.units || []).some(unitFilled)
    if (hasUnits && new Set(effJ).size > 1) {
      W('Satuan tambahan memakai harga yang sama untuk semua varian, padahal harga jual varian berbeda. Cek hasilnya di Excel.')
    }

    const seenV = new Set()
    const seenB = new Set()
    const usedBc = collectBarcodes(products, editId)
    const knownBc = known.barcodes || []

    vs.forEach((v, i) => {
      const t = 'Varian ' + (i + 1) + (v.v1 ? ' (' + v.v1 + ')' : '')
      if (!v.v1) E(t + ': isi nilai ' + (p.vt1 || 'varian'), true)
      if (p.vt2 && !v.v2) E(t + ': isi nilai ' + p.vt2, true)

      if (v.v1) {
        const ck = key(v.v1) + '|' + (p.vt2 ? key(v.v2 || '') : '')
        if (seenV.has(ck)) E(t + ': kombinasi sama dengan varian lain')
        seenV.add(ck)
      }

      ;[['harga jual', v.jual], ['harga beli', v.beli], ['stok', v.stok]].forEach(([n, x]) => {
        if (Number.isNaN(x)) E(t + ': ' + n + ' bukan angka')
        else if (x != null && x < 0) E(t + ': ' + n + ' tidak boleh negatif')
      })

      if (effJual(p, v) == null) E(t + ': harga jual kosong. Isi di baris ini atau di Harga jual standar.', true)

      if (v.barcode) {
        const vbc = norm(String(v.barcode))
        if (seenB.has(vbc) || usedBc.has(vbc) || knownBc.includes(vbc)) E(t + ': barcode sudah dipakai')
        seenB.add(vbc)
      }
    })

    if (!p.tanpaStok) {
      const bs = vs.map(v => {
        const vb = num(v.beli, true)
        const pb = num(p.hargaBeli, true)
        return vb != null ? vb : pb
      })
      if (bs.some(b => b == null || b === 0)) W('Ada varian dengan harga beli kosong atau 0: laba tidak bisa dihitung. Isi jika Anda tahu.')
      vs.forEach((v, i) => {
        const b = bs[i]
        const j = effJual(p, v)
        if (b > 0 && j != null && b > j) W('Varian ' + (v.v1 || (i + 1)) + ': harga beli lebih besar dari harga jual.')
      })
    }
  } else if ((p.batches || []).length) {
    // --- batch ---
    if (p.tanpaStok) E('Produk tanpa stok tidak bisa memakai batch. Hapus batch atau matikan "Tanpa stok".')
    const today = todayStr()
    ;(p.batches || []).forEach((b, i) => {
      const t = 'Batch ' + (i + 1)
      if (!b.no && !b.exp) E(t + ': isi nomor batch atau tanggal kadaluarsa')
      if (b.stok == null || Number.isNaN(b.stok) || b.stok < 0) E(t + ': jumlah stok wajib diisi')
      if (Number.isNaN(b.hb)) E(t + ': harga beli bukan angka')
      else if (b.hb != null && b.hb < 0) E(t + ': harga beli tidak boleh negatif')
      if (b.exp && b.exp < today) W(t + ' sudah melewati tanggal kadaluarsa')
    })
    const hasUnits = (p.units || []).some(unitFilled)
    if (hasUnits) W('Batch bersama satuan tambahan belum dicontohkan di template. Coba import satu produk dulu untuk memastikan.')
  } else if (!p.tanpaStok && p.hargaBeli != null && !Number.isNaN(p.hargaBeli) && p.hargaJual != null && !Number.isNaN(p.hargaJual)) {
    if (p.hargaBeli === 0) W('Harga beli 0: laba tidak bisa dihitung. Isi jika Anda tahu.')
    else if (p.hargaBeli > p.hargaJual) {
      const rugi = Math.round(p.hargaBeli - p.hargaJual).toLocaleString('id-ID')
      W('Harga beli lebih besar dari harga jual (rugi Rp' + rugi + ' per satuan).')
    }
  } else if (!p.tanpaStok && p.hargaBeli == null && p.hargaJual > 0) {
    W('Harga beli kosong: laba tidak bisa dihitung. Isi jika Anda tahu.')
  }

  // --- info ---
  const allCats = [...(known.cats || []), ...products.map(x => x.kategori).filter(Boolean)]
  const allUnits = [...(known.units || [])]
  if (p.kategori && !allCats.some(c => key(c) === key(p.kategori)) && allCats.length) {
    I('Kategori baru "' + p.kategori + '" akan dibuat saat import.')
  }
  if (!p.tanpaStok && p.satuan && !allUnits.some(c => key(c) === key(p.satuan)) && allUnits.length) {
    I('Satuan "' + p.satuan + '" belum pernah dipakai. Cek penulisannya.')
  }

  return out
}
