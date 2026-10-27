const fs = require('fs')
const p = 'D:/Kasgodb/public/input-produk-kasgo.html'
let c = fs.readFileSync(p, 'utf8')
c = c.replace(/<input([^>]*type="text"[^>]*)>/g, (m,a)=>{
  if(a.includes('style=')) return m
  if(a.includes('class="search"')) return m
  if(a.includes('class="keep"')) return m
  return '<input'+a+' style="text-transform:capitalize">'
})
fs.writeFileSync(p, c)
console.log('ok')
