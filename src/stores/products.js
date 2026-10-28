import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { child, onValue, ref as dbRef, set as dbSet, update as dbUpdate } from "firebase/database";
import { db } from "../firebase.js";
import { key, norm } from "../lib/parse.js";
import { toRows } from "../lib/rows.js";

const STORAGE_KEY = "kasgo-input-produk-v1";
const DATA_PATH = "databasego";
const DEFAULT_VTYPES = ["Rasa", "Ukuran", "Warna", "Paket", "Nominal", "Isi"];
const KNOWN_LISTS = ["names", "cats", "units", "vtypes", "barcodes"];

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Buang undefined/NaN (Firebase menolak undefined) dan lepaskan proxy reaktif */
const clean = (v) => JSON.parse(JSON.stringify(v));

/** RTDB mengubah array kosong jadi hilang & array jadi objek jika bolong: kembalikan selalu array */
const toArr = (v) =>
  Array.isArray(v)
    ? v.filter((x) => x != null)
    : v && typeof v === "object"
      ? Object.values(v)
      : [];

function normalizeKnown(k) {
  const src = k && typeof k === "object" ? k : {};
  const out = { count: Number(src.count) || 0, file: String(src.file || "") };
  for (const name of KNOWN_LISTS) out[name] = toArr(src[name]).map(String);
  return out;
}

/** Lengkapi field yang hilang (data lama / data dari RTDB) */
function migrateProduct(p, fallbackCreated = 0) {
  const createdAt = Number(p.createdAt) || fallbackCreated;

  const variants = toArr(p.variants).map((v) => {
    let units = toArr(v.units).map((u) => ({
      name: u?.name || "",
      price: u?.price ?? null,
      hb: u?.hb ?? null,
      isi: u?.isi ?? null,
    }));

    // Data lama: up[] + units global + forVariant → gabungkan ke v.units
    if (!units.length && Array.isArray(p.units) && p.units.length) {
      const vk = `${String(v.v1 || "").trim()}|${String(v.v2 || "").trim()}`;
      units = p.units
        .filter((u) => u && (!u.forVariant || u.forVariant === vk))
        .map((u, i) => ({
          name: u.name || "",
          price: v.up && v.up[i] != null ? v.up[i] : (u.price ?? null),
          hb: u.hb ?? null,
          isi: u.isi ?? null,
        }));
    }

    return {
      ...v,
      units,
    };
  });

  return {
    ...p,
    id: p.id || genId(),
    nama: p.nama ?? "",
    kategori: p.kategori ?? "",
    satuan: p.satuan ?? "",
    barcode: p.barcode ?? "",
    tanpaStok: !!p.tanpaStok,
    desimal: !!p.desimal,
    hasVariants: !!p.hasVariants,
    vt1: p.vt1 ?? "",
    vt2: p.vt2 ?? "",
    hargaJual: p.hargaJual ?? null,
    hargaBeli: p.hargaBeli ?? null,
    stok: p.stok ?? null,
    stokMin: p.stokMin ?? null,
    variants,
    units: p.hasVariants ? [] : toArr(p.units),
    batches: toArr(p.batches),
    createdAt,
    updatedAt: Number(p.updatedAt) || createdAt,
  };
}

const sortProducts = (list) => [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
const signature = (list) => list.map((p) => `${p.id}:${p.updatedAt || 0}`).join("|");

function uniq(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const k = key(x);
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

function friendlyError(e) {
  const raw = String(e?.code || e?.message || e || "");
  if (/permission/i.test(raw))
    return "Akses ditolak oleh Rules Realtime Database. Periksa tab Rules di Firebase Console.";
  if (/network|unavailable|disconnect/i.test(raw)) return "Tidak ada koneksi ke Firebase.";
  return "Gagal sinkron: " + (e?.message || raw);
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useProductStore = defineStore("products", () => {
  const saved = loadFromStorage();
  const base = Date.now();

  const products = ref(
    sortProducts(
      (Array.isArray(saved?.products) ? saved.products : [])
        .filter((p) => p && typeof p === "object")
        .map((p, i) => migrateProduct(p, base - i)),
    ),
  );
  const known = ref(normalizeKnown(saved?.known));
  const sticky = ref(saved?.sticky !== false);
  const calc = ref({ untung: "20", mode: "markup", bulat: "100", ...(saved?.calc || {}) });
  // Opsi ekspor Excel. divideVariantUnits = workaround bug KasGo (harga satuan varian dibagi isi)
  const exportOpts = ref({ divideVariantUnits: true, ...(saved?.exportOpts || {}) });
  const storageOk = ref(true);

  // Antrian sinkron: id produk yang belum terkirim / belum terhapus di cloud.
  // Data lama (tanpa antrian) dianggap belum terkirim semua, supaya tidak hilang saat sinkron pertama.
  const dirty = ref(
    new Set(Array.isArray(saved?.dirty) ? saved.dirty : products.value.map((p) => p.id)),
  );
  const removed = ref(new Set(Array.isArray(saved?.removed) ? saved.removed : []));

  try {
    localStorage.setItem(STORAGE_KEY + "-test", "1");
    localStorage.removeItem(STORAGE_KEY + "-test");
  } catch {
    storageOk.value = false;
  }

  // ---------- localStorage (cache lokal / offline) ----------
  let saveTimer = null;
  function persistNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!storageOk.value) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          products: products.value,
          known: known.value,
          sticky: sticky.value,
          calc: calc.value,
          exportOpts: exportOpts.value,
          dirty: [...dirty.value],
          removed: [...removed.value],
        }),
      );
    } catch {
      storageOk.value = false;
    }
  }
  function scheduleSave() {
    if (!storageOk.value) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 300);
  }
  if (typeof window !== "undefined") window.addEventListener("pagehide", persistNow);
  watch(calc, scheduleSave, { deep: true });
  watch(exportOpts, scheduleSave, { deep: true });
  scheduleSave();

  // ---------- Sinkron Firebase RTDB ----------
  // Struktur: databasego/products/{id}  dan  databasego/known
  const connected = ref(false);
  const everConnected = ref(false);
  const firstSnapshot = ref(false);
  const syncStarted = ref(false);
  const syncError = ref("");
  let unsubs = [];
  let flushTimer = null;
  let flushing = false;
  let again = false;

  const pendingCount = computed(() => dirty.value.size + removed.value.size);
  const syncStatus = computed(() => {
    if (!db) return "off";
    if (syncError.value) return "error";
    if (!connected.value) return everConnected.value ? "offline" : "connecting";
    if (!firstSnapshot.value) return "connecting";
    return pendingCount.value > 0 ? "syncing" : "synced";
  });

  const onErr = (e) => {
    console.error("Firebase RTDB:", e);
    syncError.value = friendlyError(e);
  };

  function queueFlush(delay = 400) {
    if (!db) return;
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, delay);
  }

  /** Kirim semua perubahan tertunda dalam satu update atomik */
  async function flush() {
    if (!db || !connected.value || !firstSnapshot.value) return;
    if (flushing) {
      again = true;
      return;
    }
    const byId = new Map(products.value.map((p) => [p.id, p]));
    const updates = {};
    const sentDirty = new Map();
    const sentRemoved = [];

    for (const id of [...dirty.value]) {
      const p = byId.get(id);
      if (!p) {
        dirty.value.delete(id);
        continue;
      }
      updates[`products/${id}`] = clean(p);
      sentDirty.set(id, p.updatedAt);
    }
    for (const id of [...removed.value]) {
      updates[`products/${id}`] = null;
      sentRemoved.push(id);
    }
    if (!Object.keys(updates).length) return;

    flushing = true;
    try {
      await dbUpdate(dbRef(db, DATA_PATH), updates);
      const now = new Map(products.value.map((p) => [p.id, p]));
      for (const [id, ver] of sentDirty) {
        const p = now.get(id);
        // jika produk diedit lagi saat pengiriman, biarkan tetap antri
        if (!p || p.updatedAt === ver) dirty.value.delete(id);
      }
      for (const id of sentRemoved) removed.value.delete(id);
      syncError.value = "";
      scheduleSave();
    } catch (e) {
      onErr(e);
    } finally {
      flushing = false;
      if (again) {
        again = false;
        queueFlush(0);
      }
    }
  }

  /** Data lama dari versi sebelumnya (array / kunci angka) diubah ke bentuk objek per-id */
  function migrateCloud(entries) {
    if (!entries.length) {
      firstSnapshot.value = true;
      return;
    }
    const t = Date.now();
    const map = {};
    entries.forEach(([, p], i) => {
      const m = migrateProduct(p, t - i);
      map[m.id] = clean(m);
    });
    dbSet(dbRef(db, `${DATA_PATH}/products`), map).catch(onErr);
  }

  function onProducts(snap) {
    const val = snap.val();
    const entries = Object.entries(val && typeof val === "object" ? val : {}).filter(
      ([, p]) => p && typeof p === "object",
    );
    if (Array.isArray(val) || entries.some(([k, p]) => p.id !== k)) {
      migrateCloud(entries);
      return;
    }

    const next = new Map();
    for (const [, p] of entries) {
      const m = migrateProduct(p);
      if (!removed.value.has(m.id)) next.set(m.id, m);
    }
    // perubahan lokal yang belum terkirim menang atas versi cloud
    for (const p of products.value) if (dirty.value.has(p.id)) next.set(p.id, p);

    const list = sortProducts([...next.values()]);
    if (signature(list) !== signature(products.value)) {
      products.value = list;
      scheduleSave();
    }
    firstSnapshot.value = true;
    queueFlush(0);
  }

  function onKnown(snap) {
    const val = snap.val();
    if (!val) {
      if (known.value.count > 0)
        dbSet(dbRef(db, `${DATA_PATH}/known`), clean(known.value)).catch(onErr);
      return;
    }
    const k = normalizeKnown(val);
    if (JSON.stringify(k) !== JSON.stringify(known.value)) {
      known.value = k;
      scheduleSave();
    }
  }

  function startSync() {
    if (!db || syncStarted.value) return;
    syncStarted.value = true;
    const root = dbRef(db, DATA_PATH);
    unsubs.push(
      onValue(dbRef(db, ".info/connected"), (s) => {
        connected.value = s.val() === true;
        if (connected.value) {
          everConnected.value = true;
          queueFlush(0);
        }
      }),
      onValue(child(root, "products"), onProducts, onErr),
      onValue(child(root, "known"), onKnown, onErr),
    );
  }

  function stopSync() {
    unsubs.forEach((u) => u());
    unsubs = [];
    clearTimeout(flushTimer);
    syncStarted.value = false;
    firstSnapshot.value = false;
    connected.value = false;
  }

  function syncNow() {
    syncError.value = "";
    if (!syncStarted.value) startSync();
    queueFlush(0);
  }

  // ---------- Aksi data ----------
  function markDirty(id) {
    removed.value.delete(id);
    dirty.value.add(id);
    scheduleSave();
    queueFlush();
  }

  function add(p) {
    const now = Date.now();
    const item = migrateProduct({ ...p, id: genId(), createdAt: now, updatedAt: now });
    products.value.unshift(item);
    markDirty(item.id);
  }

  /** @returns {boolean} false jika produk sudah tidak ada */
  function update(id, p) {
    const idx = products.value.findIndex((x) => x.id === id);
    if (idx < 0) return false;
    const old = products.value[idx];
    products.value[idx] = migrateProduct({
      ...old,
      ...p,
      id,
      createdAt: old.createdAt,
      updatedAt: Date.now(),
    });
    markDirty(id);
    return true;
  }

  function remove(id) {
    products.value = products.value.filter((x) => x.id !== id);
    dirty.value.delete(id);
    removed.value.add(id);
    scheduleSave();
    queueFlush();
  }

  function clear() {
    for (const p of products.value) removed.value.add(p.id);
    dirty.value.clear();
    products.value = [];
    scheduleSave();
    queueFlush();
  }

  function setKnown(data) {
    known.value = normalizeKnown(data);
    scheduleSave();
    if (db) dbSet(dbRef(db, `${DATA_PATH}/known`), clean(known.value)).catch(onErr);
  }

  function setCalc(newCalc) {
    calc.value = { ...calc.value, ...newCalc };
  }

  function setSticky(v) {
    sticky.value = v;
    scheduleSave();
  }

  // ---------- Turunan ----------
  const allCats = computed(() =>
    uniq([...(known.value.cats || []), ...products.value.map((p) => norm(p.kategori || ""))]),
  );

  const allUnits = computed(() =>
    uniq([
      ...(known.value.units || []),
      ...products.value.flatMap((p) => [
        norm(p.satuan || ""),
        ...(p.units || []).map((u) => norm(u.name || "")),
      ]),
    ]).filter((u) => u !== "-"),
  );

  const allVTypes = computed(() =>
    uniq([
      ...DEFAULT_VTYPES,
      ...(known.value.vtypes || []),
      ...products.value.flatMap((p) => [norm(p.vt1 || ""), norm(p.vt2 || "")]),
    ]),
  );

  const rowCount = computed(() =>
    products.value.reduce((sum, p) => sum + Math.max(1, toRows(p).length), 0),
  );

  return {
    products,
    known,
    sticky,
    calc,
    storageOk,
    exportOpts,
    syncStatus,
    syncError,
    pendingCount,
    startSync,
    stopSync,
    syncNow,
    add,
    update,
    remove,
    clear,
    setKnown,
    setCalc,
    setSticky,
    allCats,
    allUnits,
    allVTypes,
    rowCount,
  };
});
