const fs = require('fs')
const p = 'D:/Kasgodb/public/input-produk-kasgo.html'
let c = fs.readFileSync(p, 'utf8')
c = c.replace("const KEY = 'kasgo-input-produk-v1';", "const KEY = 'kasgo-input-produk-v1';\nconst DRAFT_KEY = 'kasgo-input-draft-v1';")
const add = `
function saveDraft(){
  try {
    const d = {
      nama: $('#f-nama').value, kategori: $('#f-kat').value, satuan: $('#f-satuan').value,
      jual: $('#f-jual').value, beli: $('#f-beli').value, stok: $('#f-stok').value, stokmin: $('#f-stokmin').value,
      barcode: $('#f-barcode').value, desimal: $('#f-desimal').checked, tanpastok: $('#f-tanpastok').checked,
      units: [0,1,2].map(i=>({n: document.getElementById('u'+i+'-name')?document.getElementById('u'+i+'-name').value:'', p: document.getElementById('u'+i+'-price')?document.getElementById('u'+i+'-price').value:'', hb: document.getElementById('u'+i+'-hb')?document.getElementById('u'+i+'-hb').value:'', isi: document.getElementById('u'+i+'-isi')?document.getElementById('u'+i+'-isi').value:''})),
      batches: batches.map(b=>({no:b.no,exp:b.exp,stok:b.stok,hb:b.hb})),
      hpp:{h:$('#h-harga').value,isi:$('#h-isi').value,jml:$('#h-jumlah').value,bi:$('#h-biaya').value,susut:$('#h-susut').value,unt:$('#h-untung').value,mode:$('#h-mode').value,bul:$('#h-bulat').value,stok:$('#h-stok').checked},
      time: Date.now()
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  }catch(e){}
}
function loadDraft(){
  try {
    const t = localStorage.getItem(DRAFT_KEY); if(!t) return;
    const d = JSON.parse(t);
    if(d.nama) $('#f-nama').value=d.nama;
    if(d.kategori) $('#f-kat').value=d.kategori;
    if(d.satuan) $('#f-satuan').value=d.satuan;
    if(d.jual) $('#f-jual').value=d.jual;
    if(d.beli) $('#f-beli').value=d.beli;
    if(d.stok) $('#f-stok').value=d.stok;
    if(d.stokmin) $('#f-stokmin').value=d.stokmin;
    if(d.barcode) $('#f-barcode').value=d.barcode;
    if($('#f-desimal')) $('#f-desimal').checked=!!d.desimal;
    if($('#f-tanpastok')) $('#f-tanpastok').checked=!!d.tanpastok;
    if(d.units){d.units.forEach((u,i)=>{const n=document.getElementById('u'+i+'-name');const p=document.getElementById('u'+i+'-price');const hb=document.getElementById('u'+i+'-hb');const isi=document.getElementById('u'+i+'-isi');if(n)n.value=u.n||'';if(p)p.value=u.p||'';if(hb)hb.value=u.hb||'';if(isi)isi.value=u.isi||'';});}
    if(d.batches){batches=d.batches; renderBatches();}
    if(d.hpp){if($('#h-harga'))$('#h-harga').value=d.hpp.h||'';if($('#h-isi'))$('#h-isi').value=d.hpp.isi||'';if($('#h-jumlah'))$('#h-jumlah').value=d.hpp.jml||'';if($('#h-biaya'))$('#h-biaya').value=d.hpp.bi||'';if($('#h-susut'))$('#h-susut').value=d.hpp.susut||'';if($('#h-untung'))$('#h-untung').value=d.hpp.unt||'';if($('#h-mode'))$('#h-mode').value=d.hpp.mode||'markup';if($('#h-bulat'))$('#h-bulat').value=d.hpp.bul||'100';if($('#h-stok'))$('#h-stok').checked=!!d.hpp.stok;}
    refresh(); toast('Draf dimuat');
  }catch(e){}
}
`
c = c.replace("function persist(){\n  try { localStorage.setItem(KEY, JSON.stringify(S)); }\n  catch(e){ memOnly = true; $('#storage-note').hidden = false; }\n}", "function persist(){\n  try { localStorage.setItem(KEY, JSON.stringify(S)); }\n  catch(e){ memOnly = true; $('#storage-note').hidden = false; }\n}"+add)
c = c.replace("formEl.addEventListener('input', refresh);", "formEl.addEventListener('input', function(){ refresh(); saveDraft(); });")
c = c.replace("formEl.addEventListener('change', refresh);", "formEl.addEventListener('change', function(){ refresh(); saveDraft(); });")
c = c.replace("function clearForm(keep){\n  const kat = $('#f-kat').value, sat = $('#f-satuan').value;", "function clearForm(keep){\n  try{localStorage.removeItem(DRAFT_KEY);}catch(e){}\n  const kat = $('#f-kat').value, sat = $('#f-satuan').value;")
c = c.replace("refreshLists(); renderList(); refresh();\n  $('#f-nama').focus();", "refreshLists(); renderList(); refresh(); loadDraft();\n  $('#f-nama').focus();")
fs.writeFileSync(p, c)
console.log('ok')
