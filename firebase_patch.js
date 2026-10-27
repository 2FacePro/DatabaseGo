const fs = require('fs')
const p = 'D:/Kasgodb/public/input-produk-kasgo.html'
let c = fs.readFileSync(p, 'utf8')

// Add firebase scripts before </head>
const fb = `  <script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js"></script>
`
if(!c.includes('firebase-app-compat')) c = c.replace('</head>', fb + '</head>')

// Add cloud controls in header
const cloud = `  <div class="acts" style="align-items:center;gap:6px">
    <button class="btn" id="btn-cloud" type="button">Koneksi Firebase</button>
    <span class="kbd" id="cloud-status">Offline (lokal)</span>
    <button class="btn" id="btn-load" type="button">Muat file produk lama</button>
    <input class="sr" type="file" id="file" accept=".xlsx,.xls" aria-label="Pilih file Excel produk">
    <button class="btn primary" id="btn-export" type="button" disabled>Unduh Excel</button>
  </div>`
c = c.replace(/<div class="acts">[\s\S]*?<\/div>/, cloud)

// Add modal
const modal = `
<div id="fb-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.4);display:none;align-items:center;justify-content:center;z-index:99">
  <div style="background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:10px;max-width:520px;width:92%;padding:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b>Konfigurasi Firebase</b><button class="btn quiet" id="fb-close">Tutup</button></div>
    <div style="display:grid;gap:8px">
      <input id="fb-key" placeholder="apiKey">
      <input id="fb-auth" placeholder="authDomain">
      <input id="fb-db" placeholder="databaseURL">
      <input id="fb-proj" placeholder="projectId">
      <input id="fb-bucket" placeholder="storageBucket">
      <input id="fb-sender" placeholder="messagingSenderId">
      <input id="fb-app" placeholder="appId">
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn primary" id="fb-save">Simpan & Hubungkan</button>
      <button class="btn" id="fb-disconnect">Putuskan</button>
      <button class="btn" id="fb-export-json">Ekspor JSON</button>
      <label class="btn">Impor JSON<input type="file" id="fb-import-json" accept="application/json" style="display:none"></label>
    </div>
    <div class="hint" style="margin-top:8px">Data disimpan di Realtime Database path: databasego/</div>
  </div>
</div>
`
c = c.replace('</body>', modal + '</body>')

// Add firebase code
const code = `
/* ---------- FIREBASE SYNC ---------- */
let fbApp=null, fbDb=null, fbRef=null, fbSync=false;
const FBKEY='kasgo-fb-config-v1';
function fbLoad(){
  try{
    const t=localStorage.getItem(FBKEY); if(!t)return;
    const cfg=JSON.parse(t);
    $('#fb-key').value=cfg.apiKey||'';$('#fb-auth').value=cfg.authDomain||'';$('#fb-db').value=cfg.databaseURL||'';$('#fb-proj').value=cfg.projectId||'';$('#fb-bucket').value=cfg.storageBucket||'';$('#fb-sender').value=cfg.messagingSenderId||'';$('#fb-app').value=cfg.appId||'';
    if(cfg.apiKey && cfg.databaseURL){ fbConnect(cfg); }
  }catch(e){}
}
function fbConnect(cfg){
  try{
    if(fbApp) try{ firebase.app().delete(); }catch(e){}
    fbApp = firebase.initializeApp(cfg);
    fbDb = firebase.database();
    fbRef = fbDb.ref('databasego');
    fbSync=true;
    $('#cloud-status').textContent='Terhubung ke Firebase';
    fbRef.on('value', snap=>{
      if(!fbSync) return;
      const v=snap.val(); if(!v) return;
      if(v.products) S.products=v.products;
      if(v.known) S.known=v.known;
      if(typeof v.sticky==='boolean') S.sticky=v.sticky;
      if(v.calc) S.calc=v.calc;
      persist(); refreshLists(); renderList(); refresh(); toast('Sinkron dari Cloud');
    });
  }catch(e){ toast('Gagal konek Firebase'); }
}
function fbPush(){
  if(!fbSync||!fbRef) return;
  try{
    fbRef.set({ products:S.products, known:S.known, sticky:S.sticky, calc:S.calc, updated:Date.now() });
  }catch(e){}
}
$('#btn-cloud').addEventListener('click',()=>{$('#fb-modal').style.display='flex';});
$('#fb-close').addEventListener('click',()=>{$('#fb-modal').style.display='none';});
$('#fb-save').addEventListener('click',()=>{
  const cfg={apiKey:$('#fb-key').value.trim(),authDomain:$('#fb-auth').value.trim(),databaseURL:$('#fb-db').value.trim(),projectId:$('#fb-proj').value.trim(),storageBucket:$('#fb-bucket').value.trim(),messagingSenderId:$('#fb-sender').value.trim(),appId:$('#fb-app').value.trim()};
  if(!cfg.apiKey||!cfg.databaseURL){ toast('apiKey & databaseURL wajib'); return; }
  try{localStorage.setItem(FBKEY,JSON.stringify(cfg));}catch(e){}
  fbConnect(cfg); $('#fb-modal').style.display='none';
});
$('#fb-disconnect').addEventListener('click',()=>{
  try{localStorage.removeItem(FBKEY);}catch(e){}
  fbSync=false; if(fbApp) try{firebase.app().delete();}catch(e){}
  fbApp=null;fbDb=null;fbRef=null; $('#cloud-status').textContent='Offline (lokal)';
});
$('#fb-export-json').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({products:S.products,known:S.known,sticky:S.sticky,calc:S.calc},null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='databasego-backup-'+Date.now()+'.json'; a.click();
});
$('#fb-import-json').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader(); r.onload=ev=>{
    try{
      const o=JSON.parse(ev.target.result);
      if(o.products) S.products=o.products; if(o.known) S.known=o.known; if(typeof o.sticky==='boolean') S.sticky=o.sticky; if(o.calc) S.calc=o.calc;
      persist(); fbPush(); refreshLists(); renderList(); refresh(); toast('Impor JSON berhasil');
    }catch(ex){toast('File JSON tidak valid');}
    e.target.value='';
  }; r.readAsText(f);
});
const _persist=persist; persist=function(){ _persist(); fbPush(); };
fbLoad();
`
c = c.replace("/* ---------- mulai ---------- */", code + "\n/* ---------- mulai ---------- */")
fs.writeFileSync(p, c)
console.log('ok')
