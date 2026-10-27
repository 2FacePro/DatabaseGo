import { key, norm } from './parse.js'

/**
 * Baca file Excel produk lama — logika sesuai dbapp.txt
 * Membaca kolom berdasarkan POSISI (bukan nama), sama dengan dbapp.txt baris 877-878
 *
 * Kolom berdasarkan posisi:
 *   r[0]  = Nama
 *   r[1]  = Kategori
 *   r[2]  = Barcode
 *   r[5]  = Variant1Type
 *   r[7]  = Variant2Type
 *   r[13] = Satuan
 *   r[14] = Unit1
 *   r[18] = Unit2
 *   r[22] = Unit3
 *
 * @param {File} file
 * @param {Object} XLSX
 * @returns {Promise<{names: string[], cats: string[], units: string[], vtypes: string[], barcodes: string[], count: number, file: string}>}
 */
export async function importFile(file, XLSX) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(reader.result), { type: 'array' })
        const ws = wb.Sheets['Data'] || wb.Sheets[wb.SheetNames[wb.SheetNames.length - 1]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true })

        if (!rows.length || norm(String(rows[0]?.[0] ?? '')) !== 'Nama') {
          throw new Error('Bukan format template produk (kolom A1 harus "Nama")')
        }

        // Cari baris DATA START
        let start = rows.findIndex(r => String(r[0]).startsWith('### DATA START'))
        start = start < 0 ? 1 : start + 1

        const names = new Set()
        const cats = []
        const units = []
        const barcodes = new Set()
        const vtypes = []
        const catSeen = new Set()
        const unitSeen = new Set()
        const vtSeen = new Set()

        const addU = (u) => {
          const k = key(String(u ?? ''))
          if (k && k !== '-' && !unitSeen.has(k)) {
            unitSeen.add(k)
            units.push(norm(String(u)))
          }
        }

        for (let i = start; i < rows.length; i++) {
          const r = rows[i]
          const n = norm(String(r[0] ?? ''))
          if (!n || n.startsWith('#')) continue

          names.add(key(n))

          const c = norm(String(r[1] ?? ''))
          if (c && !catSeen.has(key(c))) { catSeen.add(key(c)); cats.push(c) }

          const b = norm(String(r[2] ?? ''))
          if (b) barcodes.add(b)

          // Satuan: r[13] = Satuan, r[14] = Unit1, r[18] = Unit2, r[22] = Unit3
          addU(r[13]); addU(r[14]); addU(r[18]); addU(r[22])

          // Jenis varian: r[5] = Variant1Type, r[7] = Variant2Type
          ;[r[5], r[7]].forEach(t => {
            const k = key(String(t ?? ''))
            if (k && !vtSeen.has(k)) { vtSeen.add(k); vtypes.push(norm(String(t))) }
          })
        }

        resolve({
          names: [...names],
          cats,
          units,
          vtypes,
          barcodes: [...barcodes],
          count: names.size,
          file: file.name,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsArrayBuffer(file)
  })
}
