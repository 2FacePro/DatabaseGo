import { reactive, computed, ref } from "vue";
import { norm, key, pnum, displayNum } from "../lib/parse.js";
import { validate } from "../lib/validate.js";
import { useProductStore } from "../stores/products.js";

const blankUnits = () => [
  { name: "", price: "", hb: "", isi: "" },
  { name: "", price: "", hb: "", isi: "" },
  { name: "", price: "", hb: "", isi: "" },
];

const blankVariant = () => ({
  v1: "",
  v2: "",
  jual: "",
  beli: "",
  stok: "",
  barcode: "",
  units: blankUnits(),
});

export function useProductForm() {
  const store = useProductStore();

  const form = reactive({
    id: null,
    nama: "",
    kategori: "",
    satuan: "",
    hargaJual: "",
    hargaBeli: "",
    stok: "",
    stokMin: "5",
    barcode: "",
    tanpaStok: false,
    desimal: false,
    hasVariants: false,
    vt1: "",
    vt2: "",
    variants: [],
    units: blankUnits(),
    batches: [],
    draft: false,
  });

  const isEditing = computed(() => !!form.id);
  const isDuplicate = ref(false);
  const submitAttempted = ref(false);

  const parsedProduct = computed(() => ({
    ...form,
    hargaJual: pnum(form.hargaJual, true),
    hargaBeli: pnum(form.hargaBeli, true),
    stok: pnum(form.stok, false),
    stokMin: pnum(form.stokMin, false),
    draft: !!form.draft,
    variants: form.variants.map((v) => ({
      ...v,
      jual: pnum(v.jual, true),
      beli: pnum(v.beli, true),
      stok: pnum(v.stok, false),
      units: (v.units || []).map((u) => ({
        name: u.name,
        price: pnum(u.price, true),
        hb: pnum(u.hb, true),
        isi: pnum(u.isi, false),
      })),
    })),
    units: form.units.map((u) => ({
      name: u.name,
      price: pnum(u.price, true),
      hb: pnum(u.hb, true),
      isi: pnum(u.isi, false),
    })),
    batches: form.batches.map((b) => ({
      ...b,
      stok: pnum(String(b.stok ?? ""), false),
      hb: pnum(String(b.hb ?? ""), true),
    })),
  }));

  // PENTING: kirim SEMUA produk (termasuk yang sedang diedit).
  // validate memakai editId untuk mengabaikan diri sendiri.
  // Jangan filter di sini — kalau di-filter, cek known.names salah saat edit draf impor.
  const validationMessages = computed(() => {
    return validate(parsedProduct.value, {
      products: store.products,
      known: store.known,
      editId: form.id,
    });
  });

  const visibleMessages = computed(() => {
    return validationMessages.value.filter((m) => submitAttempted.value || !m.requiredOnly);
  });

  const hasErrors = computed(() => validationMessages.value.some((m) => m.level === "error"));

  const canSaveDraft = computed(() => !!norm(form.nama));

  const hpp = reactive({
    hargaKemasan: "",
    isi: "",
    jumlah: "",
    biaya: "",
    susut: "",
    stokCheck: false,
  });

  function clearForm(keepSticky = true) {
    const kat = keepSticky && store.sticky ? form.kategori : "";
    const sat = keepSticky && store.sticky ? form.satuan : "";
    form.id = null;
    form.nama = "";
    form.kategori = kat;
    form.satuan = sat;
    form.hargaJual = "";
    form.hargaBeli = "";
    form.stok = "";
    form.stokMin = "5";
    form.barcode = "";
    form.tanpaStok = false;
    form.desimal = false;
    form.hasVariants = false;
    form.vt1 = "";
    form.vt2 = "";
    form.variants = [];
    form.units = blankUnits();
    form.batches = [];
    form.draft = false;
    isDuplicate.value = false;
    submitAttempted.value = false;
  }

  function fillForm(p) {
    form.id = p.id;
    form.nama = norm(p.nama || "");
    form.kategori = norm(p.kategori || "");
    form.satuan = norm(p.satuan || "");
    form.hargaJual = p.hargaJual != null ? displayNum(p.hargaJual) : "";
    form.hargaBeli = p.hargaBeli != null ? displayNum(p.hargaBeli) : "";
    form.stok = p.stok != null ? displayNum(p.stok) : "";
    form.stokMin = p.stokMin != null ? displayNum(p.stokMin) : "5";
    form.barcode = norm(p.barcode || "");
    form.tanpaStok = !!p.tanpaStok;
    form.desimal = !!p.desimal;
    form.hasVariants = !!p.hasVariants;
    form.vt1 = norm(p.vt1 || "");
    form.vt2 = norm(p.vt2 || "");
    form.draft = !!p.draft;
    form.variants = (p.variants || []).map((v) => ({
      v1: norm(v.v1 || ""),
      v2: norm(v.v2 || ""),
      jual: v.jual != null ? displayNum(v.jual) : "",
      beli: v.beli != null ? displayNum(v.beli) : "",
      stok: v.stok != null ? displayNum(v.stok) : "",
      barcode: norm(v.barcode || ""),
      units: [0, 1, 2].map((i) => {
        const u = (v.units || [])[i] || {};
        return {
          name: norm(u.name || ""),
          price: u.price != null ? displayNum(u.price) : "",
          hb: u.hb != null ? displayNum(u.hb) : "",
          isi: u.isi != null ? displayNum(u.isi) : "",
        };
      }),
    }));
    form.units = [0, 1, 2].map((i) => {
      const u = (p.units || [])[i] || {};
      return {
        name: norm(u.name || ""),
        price: u.price != null ? displayNum(u.price) : "",
        hb: u.hb != null ? displayNum(u.hb) : "",
        isi: u.isi != null ? displayNum(u.isi) : "",
      };
    });
    form.batches = (p.batches || []).map((b) => ({
      no: norm(b.no || ""),
      exp: b.exp || "",
      stok: b.stok != null ? displayNum(b.stok) : "",
      hb: b.hb != null ? displayNum(b.hb) : "",
    }));
    isDuplicate.value = false;
    submitAttempted.value = false;
  }

  function fillDuplicate(p) {
    fillForm(p);
    form.id = null;
    form.nama = norm(p.nama || "") + " ";
    form.barcode = "";
    form.draft = false;
    form.variants = form.variants.map((v) => ({ ...v, barcode: "" }));
    isDuplicate.value = true;
  }

  function normalizeWithKnown(val, knownList) {
    const k = key(val);
    const found = knownList.find((x) => key(x) === k);
    return found || val;
  }

  function buildProductObject(opts = {}) {
    const asDraft = !!opts.asDraft;
    const nama = norm(form.nama);
    const kategori = normalizeWithKnown(norm(form.kategori), store.allCats);
    const satuan = normalizeWithKnown(norm(form.satuan), store.allUnits);
    const vt1 = normalizeWithKnown(norm(form.vt1), store.allVTypes);
    const vt2 = norm(form.vt2) ? normalizeWithKnown(norm(form.vt2), store.allVTypes) : "";

    return {
      nama,
      kategori,
      satuan: form.tanpaStok && !satuan ? "-" : satuan,
      barcode: norm(form.barcode),
      tanpaStok: form.tanpaStok,
      desimal: form.desimal,
      hasVariants: form.hasVariants,
      vt1: form.hasVariants ? vt1 : "",
      vt2: form.hasVariants ? vt2 : "",
      hargaJual: pnum(form.hargaJual, true),
      hargaBeli: pnum(form.hargaBeli, true),
      stok: pnum(form.stok, false),
      stokMin: pnum(form.stokMin, false) ?? 5,
      draft: asDraft,
      variants: form.hasVariants
        ? form.variants
            .filter(
              (v) =>
                v.v1 ||
                v.v2 ||
                v.jual ||
                v.beli ||
                (v.stok !== "" && v.stok != null) ||
                v.barcode ||
                (v.units || []).some((u) => u.name || u.price || u.hb || u.isi),
            )
            .map((v) => ({
              v1: norm(v.v1),
              v2: norm(v.v2),
              jual: pnum(v.jual, true),
              beli: pnum(v.beli, true),
              stok: pnum(v.stok, false),
              barcode: norm(v.barcode),
              units: (v.units || [])
                .filter((u) => norm(u.name) || u.price || u.hb || u.isi)
                .map((u) => ({
                  name: norm(u.name),
                  price: pnum(u.price, true),
                  hb: pnum(u.hb, true),
                  isi: pnum(u.isi, false),
                })),
            }))
        : [],
      units: form.hasVariants
        ? []
        : form.units
            .filter((u) => norm(u.name) || u.price || u.hb || u.isi)
            .map((u) => ({
              name: norm(u.name),
              price: pnum(u.price, true),
              hb: pnum(u.hb, true),
              isi: pnum(u.isi, false),
            })),
      batches: form.batches
        .filter((b) => b.no || b.exp || b.stok || b.hb)
        .map((b) => ({
          no: norm(b.no || ""),
          exp: b.exp || "",
          stok: pnum(String(b.stok ?? ""), false),
          hb: pnum(String(b.hb ?? ""), true),
        })),
    };
  }

  return {
    form,
    isEditing,
    isDuplicate,
    submitAttempted,
    parsedProduct,
    validationMessages,
    visibleMessages,
    hasErrors,
    canSaveDraft,
    hpp,
    clearForm,
    fillForm,
    fillDuplicate,
    buildProductObject,
    normalizeWithKnown,
    blankVariant,
  };
}
