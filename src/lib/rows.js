import { pnum } from "./parse.js";

export const HEAD = [
  "Nama",
  "Kategori",
  "Barcode",
  "TanpaStok",
  "HasVariants",
  "Variant1Type",
  "Variant1Value",
  "Variant2Type",
  "Variant2Value",
  "HargaJual",
  "HargaBeli",
  "Stok",
  "StokMin",
  "Satuan",
  "Unit1",
  "Price1",
  "HargaBeli1",
  "JumlahIsi1",
  "Unit2",
  "Price2",
  "HargaBeli2",
  "JumlahIsi2",
  "Unit3",
  "Price3",
  "HargaBeli3",
  "JumlahIsi3",
  "BatchNumber",
  "ExpiryDate",
  "QtyDesimal",
];

export const MARKER = "### DATA START (Jangan hapus baris ini!) ###";

/**
 * Apakah HargaBeli satuan tambahan ikut dibagi isi saat workaround aktif.
 * Asumsi: KasGo memperlakukan harga beli sama seperti harga jual.
 * Belum terbukti. Setelah import, cek harga beli Dus di KasGo.
 * Kalau salah, ubah jadi false.
 */
export const DIVIDE_COST_TOO = true;

const num = (v, money) => (typeof v === "number" ? v : pnum(String(v ?? ""), money));

const fin = (r) => r.map((x) => (x === undefined || Number.isNaN(x) ? null : x));

/** Bulatkan ke 1 digit desimal (3333.333… → 3333.3) */
function round1(n) {
  return Math.round(n * 10) / 10;
}

function effJual(p, v) {
  const vj = num(v.jual, true);
  const pj = num(p.hargaJual, true);
  if (vj != null && !Number.isNaN(vj)) return vj;
  if (pj != null && !Number.isNaN(pj)) return pj;
  return null;
}

/**
 * Konversi satu produk ke baris-baris Excel
 * @param {Object} p
 * @param {{ divideVariantUnits?: boolean }} [opts]
 */
export function toRows(p, opts = {}) {
  const divide = !!opts.divideVariantUnits;

  // --- produk varian: satuan dari variants[i].units ---
  if (p.hasVariants) {
    return (p.variants || []).map((v, i) => {
      const r = new Array(29).fill(null);
      r[0] = p.nama;
      r[1] = p.kategori;
      r[2] = v.barcode || null;
      r[3] = p.tanpaStok ? "TRUE" : null;
      r[4] = "TRUE";
      r[5] = p.vt1;
      r[6] = v.v1;
      if (p.vt2) {
        r[7] = p.vt2;
        r[8] = v.v2;
      }
      r[9] = effJual(p, v);

      const vBeli = num(v.beli, true);
      const pBeli = num(p.hargaBeli, true);
      r[10] = p.tanpaStok ? 0 : vBeli != null ? vBeli : pBeli != null ? pBeli : 0;
      const vStok = num(v.stok, false);
      r[11] = p.tanpaStok ? 0 : vStok != null ? vStok : 0;
      r[12] = i === 0 && !p.tanpaStok ? (p.stokMin ?? null) : null;
      r[13] = p.tanpaStok ? p.satuan || "-" : p.satuan;

      const vUnits = (v.units || [])
        .filter((u) => u.name || u.price != null || u.hb != null || u.isi != null)
        .slice(0, 3);

      vUnits.forEach((u, k) => {
        const c = 14 + k * 4;
        const d = divide && Number(u.isi) > 0;
        const price = u.price ?? null;
        r[c] = u.name || null;
        r[c + 1] = d && price != null ? round1(price / u.isi) : price;
        r[c + 2] = d && DIVIDE_COST_TOO && u.hb != null ? round1(u.hb / u.isi) : (u.hb ?? null);
        r[c + 3] = u.isi ?? null;
      });

      r[28] = p.desimal ? "TRUE" : null;
      return fin(r);
    });
  }

  // --- produk biasa / batch ---
  const units = (p.units || []).filter(
    (u) => !!(u.name || u.price != null || u.hb != null || u.isi != null),
  );
  const batches = p.batches || [];
  const bs = batches.length ? batches : [null];

  return bs.map((b) => {
    const r = new Array(29).fill(null);
    r[0] = p.nama;
    r[1] = p.kategori;
    r[2] = p.barcode || null;
    r[3] = p.tanpaStok ? "TRUE" : null;
    const pJual = num(p.hargaJual, true);
    const pBeli = num(p.hargaBeli, true);
    const pStok = num(p.stok, false);
    r[9] = pJual;
    r[10] = p.tanpaStok ? 0 : b && b.hb != null ? b.hb : pBeli != null ? pBeli : 0;
    r[11] = p.tanpaStok ? 0 : b ? (b.stok ?? 0) : pStok != null ? pStok : 0;
    r[12] = p.tanpaStok ? null : (p.stokMin ?? null);
    r[13] = p.tanpaStok ? p.satuan || "-" : p.satuan;
    units.forEach((u, i) => {
      const c = 14 + i * 4;
      r[c] = u.name || null;
      r[c + 1] = u.price ?? null;
      r[c + 2] = u.hb ?? null;
      r[c + 3] = u.isi ?? null;
    });
    if (b) {
      r[26] = b.no || null;
      r[27] = b.exp || null;
    }
    r[28] = p.desimal ? "TRUE" : null;
    return fin(r);
  });
}

export function countDivided(products, opts = {}) {
  if (!opts.divideVariantUnits) return 0;
  let n = 0;
  for (const p of products) {
    if (!p.hasVariants) continue;
    for (const v of p.variants || []) {
      for (const u of v.units || []) {
        if (u.name && u.isi > 0 && u.price != null) n++;
      }
    }
  }
  return n;
}

export function buildSheetRows(products, opts = {}) {
  const rows = [];
  [...products].reverse().forEach((p) => toRows(p, opts).forEach((r) => rows.push(r)));
  return rows;
}

export function buildWorkbook(products, XLSX, opts = {}) {
  const rows = buildSheetRows(products, opts);

  const wsData = XLSX.utils.aoa_to_sheet([HEAD, [MARKER], ...rows]);
  wsData["!cols"] = HEAD.map((_, i) => ({ wch: i === 0 ? 30 : i === 1 ? 20 : 13 }));

  for (let ri = 2; ri < rows.length + 2; ri++) {
    for (const c of [2, 27]) {
      const addr = XLSX.utils.encode_cell({ r: ri, c });
      const cell = wsData[addr];
      if (cell && cell.v != null && cell.v !== "") {
        wsData[addr] = { t: "s", v: String(cell.v) };
      }
    }
  }

  const helpLines = [
    ["PETUNJUK PENGISIAN TEMPLATE IMPORT PRODUK"],
    [],
    ["File ini dibuat oleh aplikasi Input Produk KasGo dengan format yang sama seperti template."],
    [
      'Data produk ada di sheet "Data", di bawah baris "DATA START". Jangan ubah nama kolom dan jangan hapus baris DATA START.',
    ],
    ["Setelah diperiksa, simpan lalu import di aplikasi KasGo."],
  ];
  if (opts.divideVariantUnits) {
    helpLines.push(
      [],
      ['CATATAN: file ini dibuat dengan opsi "Bagi harga varian dengan isi" aktif.'],
      [
        "Untuk produk varian, Price/HargaBeli satuan tambahan sudah dibagi JumlahIsi (workaround KasGo). Jangan ubah manual.",
      ],
    );
  }
  const wsHelp = XLSX.utils.aoa_to_sheet(helpLines);
  wsHelp["!cols"] = [{ wch: 110 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsHelp, "Petunjuk");
  XLSX.utils.book_append_sheet(wb, wsData, "Data");
  return wb;
}
