import { key, norm, pnum } from "./parse.js";

const MARKER_RE = /DATA\s*START/i;
const EXAMPLE_RE = /^###\s*CONTOH/i;

function cell(row, i) {
  const v = row?.[i];
  if (v == null || v === "") return "";
  return String(v).trim();
}

function isTrue(v) {
  const s = String(v ?? "")
    .trim()
    .toUpperCase();
  return s === "TRUE" || s === "1" || s === "YA" || s === "YES";
}

/**
 * Baca workbook → known (anti-duplikat) + daftar produk siap dijadikan draf
 */
export function importFile(file, XLSX) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = wb.SheetNames.find((n) => /data/i.test(n)) || wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        if (!sheet) throw new Error("Sheet Data tidak ditemukan");

        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: false,
        });

        // Cari baris marker DATA START
        let start = -1;
        for (let i = 0; i < rows.length; i++) {
          const a = cell(rows[i], 0);
          if (MARKER_RE.test(a)) {
            start = i + 1;
            break;
          }
        }
        // Fallback: baris setelah header Nama|Kategori
        if (start < 0) {
          for (let i = 0; i < Math.min(rows.length, 30); i++) {
            if (key(cell(rows[i], 0)) === "nama" && key(cell(rows[i], 1)) === "kategori") {
              start = i + 1;
              break;
            }
          }
        }
        if (start < 0) start = 1;

        const names = [];
        const cats = [];
        const units = [];
        const vtypes = [];
        const barcodes = [];
        const rawProducts = []; // baris data mentah

        for (let i = start; i < rows.length; i++) {
          const r = rows[i];
          const nama = cell(r, 0);
          if (!nama) continue;
          if (EXAMPLE_RE.test(nama) || MARKER_RE.test(nama)) continue;
          if (nama.startsWith("###")) continue;

          const kategori = cell(r, 1);
          const barcode = cell(r, 2);
          const tanpaStok = isTrue(cell(r, 3));
          const hasVariants = isTrue(cell(r, 4));
          const vt1 = cell(r, 5);
          const v1 = cell(r, 6);
          const vt2 = cell(r, 7);
          const v2 = cell(r, 8);
          const hargaJual = pnum(cell(r, 9), true);
          const hargaBeli = pnum(cell(r, 10), true);
          const stok = pnum(cell(r, 11), false);
          const stokMin = pnum(cell(r, 12), false);
          const satuan = cell(r, 13);

          const unitSlots = [0, 1, 2]
            .map((k) => {
              const base = 14 + k * 4;
              return {
                name: cell(r, base),
                price: pnum(cell(r, base + 1), true),
                hb: pnum(cell(r, base + 2), true),
                isi: pnum(cell(r, base + 3), false),
              };
            })
            .filter((u) => u.name || u.price != null || u.hb != null || u.isi != null);

          const batchNo = cell(r, 26);
          const batchExp = cell(r, 27);
          const desimal = isTrue(cell(r, 28));

          names.push(nama);
          if (kategori) cats.push(kategori);
          if (satuan && satuan !== "-") units.push(satuan);
          if (vt1) vtypes.push(vt1);
          if (vt2) vtypes.push(vt2);
          unitSlots.forEach((u) => {
            if (u.name) units.push(u.name);
          });
          if (barcode) barcodes.push(barcode);

          rawProducts.push({
            nama,
            kategori,
            barcode,
            tanpaStok,
            hasVariants,
            vt1,
            v1,
            vt2,
            v2,
            hargaJual,
            hargaBeli,
            stok,
            stokMin,
            satuan,
            units: unitSlots,
            batchNo,
            batchExp,
            desimal,
          });
        }

        // Gabung baris varian / batch jadi satu produk
        const products = groupRows(rawProducts);

        const uniq = (arr) => {
          const seen = new Set();
          const out = [];
          for (const x of arr) {
            const k = key(x);
            if (k && !seen.has(k)) {
              seen.add(k);
              out.push(norm(x));
            }
          }
          return out;
        };

        resolve({
          count: products.length,
          file: file.name,
          names: uniq(names).map((n) => key(n)),
          cats: uniq(cats),
          units: uniq(units),
          vtypes: uniq(vtypes),
          barcodes: uniq(barcodes).map((b) => norm(b)),
          products, // ← siap jadi draf
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsArrayBuffer(file);
  });
}

/** Gabungkan baris Excel → model produk app */
function groupRows(rows) {
  const map = new Map();

  for (const r of rows) {
    const nk = key(r.nama);
    if (!nk) continue;

    if (r.hasVariants) {
      let p = map.get(nk);
      if (!p) {
        p = {
          nama: norm(r.nama),
          kategori: norm(r.kategori),
          satuan: r.tanpaStok ? r.satuan || "-" : norm(r.satuan),
          barcode: "",
          tanpaStok: r.tanpaStok,
          desimal: r.desimal,
          hasVariants: true,
          vt1: norm(r.vt1),
          vt2: norm(r.vt2),
          hargaJual: null,
          hargaBeli: null,
          stok: null,
          stokMin: r.stokMin,
          units: [],
          variants: [],
          batches: [],
          draft: true,
        };
        map.set(nk, p);
      }
      if (r.stokMin != null && p.stokMin == null) p.stokMin = r.stokMin;
      p.variants.push({
        v1: norm(r.v1),
        v2: norm(r.v2),
        jual: r.hargaJual,
        beli: r.hargaBeli,
        stok: r.stok,
        barcode: norm(r.barcode),
        units: r.units.map((u) => ({
          name: norm(u.name),
          price: u.price,
          hb: u.hb,
          isi: u.isi,
        })),
      });
    } else if (r.batchNo || r.batchExp) {
      let p = map.get(nk);
      if (!p) {
        p = {
          nama: norm(r.nama),
          kategori: norm(r.kategori),
          satuan: norm(r.satuan),
          barcode: norm(r.barcode),
          tanpaStok: false,
          desimal: r.desimal,
          hasVariants: false,
          vt1: "",
          vt2: "",
          hargaJual: r.hargaJual,
          hargaBeli: r.hargaBeli,
          stok: null,
          stokMin: r.stokMin,
          units: r.units.map((u) => ({
            name: norm(u.name),
            price: u.price,
            hb: u.hb,
            isi: u.isi,
          })),
          variants: [],
          batches: [],
          draft: true,
        };
        map.set(nk, p);
      }
      p.batches.push({
        no: norm(r.batchNo),
        exp: r.batchExp || "",
        stok: r.stok,
        hb: r.hargaBeli,
      });
    } else {
      // produk biasa (atau overwrite jika nama sama — ambil baris pertama)
      if (map.has(nk)) continue;
      map.set(nk, {
        nama: norm(r.nama),
        kategori: norm(r.kategori),
        satuan: r.tanpaStok ? r.satuan || "-" : norm(r.satuan),
        barcode: norm(r.barcode),
        tanpaStok: r.tanpaStok,
        desimal: r.desimal,
        hasVariants: false,
        vt1: "",
        vt2: "",
        hargaJual: r.hargaJual,
        hargaBeli: r.hargaBeli,
        stok: r.stok,
        stokMin: r.stokMin,
        units: r.units.map((u) => ({
          name: norm(u.name),
          price: u.price,
          hb: u.hb,
          isi: u.isi,
        })),
        variants: [],
        batches: [],
        draft: true,
      });
    }
  }

  return [...map.values()];
}
