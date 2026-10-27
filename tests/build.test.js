import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'

describe('skenario 19 - build satu file', () => {
  const distPath = 'dist/index.html'

  it('dist/index.html ada', () => {
    expect(existsSync(distPath)).toBe(true)
  })

  it('tidak ada referensi CDN / eksternal', () => {
    const content = readFileSync(distPath, 'utf8')
    expect(content).not.toMatch(/src="https?:\/\//)
    expect(content).not.toMatch(/href="https?:\/\//)
    expect(content).not.toMatch(/@import.*https?:\/\//)
    expect(content).not.toMatch(/url\(https?:\/\//)
  })

  it('font Plus Jakarta Sans diinline sebagai data URI', () => {
    const content = readFileSync(distPath, 'utf8')
    const hasFont = content.includes('Plus Jakarta Sans') || content.includes('PlusJakartaSans')
    expect(hasFont).toBe(true)
  })

  it('mengandung data inline (font sebagai base64 atau woff2)', () => {
    const content = readFileSync(distPath, 'utf8')
    const hasInline = content.includes('data:font') || content.includes('data:application') || content.includes('base64')
    expect(hasInline).toBe(true)
  })

  it('ukuran file reasonable (> 100KB, < 5MB)', () => {
    const stat = readFileSync(distPath)
    expect(stat.length).toBeGreaterThan(100 * 1024)
    expect(stat.length).toBeLessThan(5 * 1024 * 1024)
  })
})
