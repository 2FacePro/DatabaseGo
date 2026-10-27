import { describe, it, expect } from 'vitest'
import { icons } from '../src/icons/icons.js'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { glob } from 'fs/promises'

describe('icons registri', () => {
  it('semua icon yang diregistrasi adalah komponen valid (bukan undefined)', () => {
    for (const [name, comp] of Object.entries(icons)) {
      expect(comp, `Ikon "${name}" tidak ditemukan di lucide-vue-next`).toBeDefined()
    }
  })

  it('registri punya semua ikon semantik yang dibutuhkan', () => {
    const required = [
      'add', 'remove', 'edit', 'duplicate', 'save', 'cancel',
      'download', 'upload', 'spreadsheet', 'search', 'hpp',
      'price-tag', 'variant', 'unit', 'batch', 'barcode',
      'product', 'warning', 'error', 'info', 'success',
      'expand', 'close', 'clear',
    ]
    for (const name of required) {
      expect(icons[name], `Ikon semantik "${name}" tidak ada di registri`).toBeDefined()
    }
  })
})

describe('komponen Vue tidak import langsung dari lucide-vue-next', () => {
  it('hanya icons.js yang boleh import dari lucide-vue-next', () => {
    // Baca semua file .vue di src/
    const vueFiles = []
    function walk(dir) {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const e of entries) {
        const full = join(dir, e.name)
        if (e.isDirectory() && !e.name.includes('node_modules')) walk(full)
        else if (e.name.endsWith('.vue')) vueFiles.push(full)
      }
    }
    walk('src')

    const violations = []
    for (const file of vueFiles) {
      const content = readFileSync(file, 'utf8')
      if (content.includes('lucide-vue-next')) {
        violations.push(file)
      }
    }
    expect(violations, `File Vue berikut import langsung dari lucide-vue-next:\n${violations.join('\n')}`).toHaveLength(0)
  })
})
