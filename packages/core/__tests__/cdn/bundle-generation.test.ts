import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { gzipSync } from 'zlib'

describe('CDN Bundle Generation', () => {
  const distDir = path.join(__dirname, '../../dist/cdn')
  const bundlePath = path.join(distDir, 'ai-kit-core.global.js')
  const sourcemapPath = path.join(distDir, 'ai-kit-core.global.js.map')

  beforeAll(() => {
    // Build CDN bundle
    try {
      execSync('npm run build:cdn', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit',
      })
    } catch (error) {
      console.error('Failed to build CDN bundle:', error)
      throw error
    }
  })

  afterAll(() => {
    // Clean up dist directory after tests
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true })
    }
  })

  describe('Bundle Files', () => {
    it('should generate CDN bundle file', () => {
      expect(fs.existsSync(bundlePath)).toBe(true)
    })

    it('should generate sourcemap file', () => {
      expect(fs.existsSync(sourcemapPath)).toBe(true)
    })

    it('should create bundle in correct output directory', () => {
      expect(fs.existsSync(distDir)).toBe(true)
      const files = fs.readdirSync(distDir)
      expect(files.some(f => f.includes('ai-kit-core'))).toBe(true)
    })
  })

  describe('Bundle Content', () => {
    it('should contain IIFE wrapper', () => {
      const content = fs.readFileSync(bundlePath, 'utf-8')
      // IIFE pattern: (function() {...})()
      expect(content).toMatch(/\(function\s*\(/)
      expect(content).toMatch(/\}\)\(\)/)
    })

    it('should expose AINativeCore global variable', () => {
      const content = fs.readFileSync(bundlePath, 'utf-8')
      expect(content).toMatch(/AINativeCore/)
    })

    it('should be minified (no unnecessary whitespace)', () => {
      const content = fs.readFileSync(bundlePath, 'utf-8')
      const lines = content.split('\n')
      // Minified files typically have fewer lines
      expect(lines.length).toBeLessThan(100)
    })

    it('should include sourcemap reference', () => {
      const content = fs.readFileSync(bundlePath, 'utf-8')
      expect(content).toMatch(/\/\/# sourceMappingURL=/)
    })

    it('should not include Node.js-specific imports', () => {
      const content = fs.readFileSync(bundlePath, 'utf-8')
      // Should not include tiktoken or ioredis (marked as external)
      expect(content).not.toMatch(/require\(['"]tiktoken['"]\)/)
      expect(content).not.toMatch(/require\(['"]ioredis['"]\)/)
    })

    it('should define process.env.NODE_ENV as production', () => {
      const content = fs.readFileSync(bundlePath, 'utf-8')
      expect(content).toMatch(/"production"/)
    })
  })

  describe('Bundle Size', () => {
    it('should be less than 500KB uncompressed', () => {
      const stats = fs.statSync(bundlePath)
      const sizeKB = stats.size / 1024
      expect(sizeKB).toBeLessThan(500)
    })

    it('should be less than 100KB when gzipped (core requirement)', () => {
      const content = fs.readFileSync(bundlePath)
      const compressed = gzipSync(content, { level: 9 })
      const sizeKB = compressed.length / 1024

      console.log(`Gzipped bundle size: ${sizeKB.toFixed(2)} KB`)
      expect(sizeKB).toBeLessThan(100)
    })

    it('should report bundle size statistics', () => {
      const content = fs.readFileSync(bundlePath)
      const uncompressedKB = content.length / 1024
      const compressed = gzipSync(content, { level: 9 })
      const compressedKB = compressed.length / 1024
      const compressionRatio = ((1 - compressed.length / content.length) * 100).toFixed(2)

      console.log('\n📦 Bundle Size Report:')
      console.log(`  Uncompressed: ${uncompressedKB.toFixed(2)} KB`)
      console.log(`  Gzipped: ${compressedKB.toFixed(2)} KB`)
      console.log(`  Compression Ratio: ${compressionRatio}%`)

      expect(uncompressedKB).toBeGreaterThan(0)
      expect(compressedKB).toBeGreaterThan(0)
    })
  })

  describe('Sourcemap Validation', () => {
    it('should have valid sourcemap JSON', () => {
      const sourcemapContent = fs.readFileSync(sourcemapPath, 'utf-8')
      expect(() => JSON.parse(sourcemapContent)).not.toThrow()
    })

    it('should contain source references', () => {
      const sourcemapContent = fs.readFileSync(sourcemapPath, 'utf-8')
      const sourcemap = JSON.parse(sourcemapContent)
      expect(sourcemap.sources).toBeDefined()
      expect(Array.isArray(sourcemap.sources)).toBe(true)
      expect(sourcemap.sources.length).toBeGreaterThan(0)
    })

    it('should have correct version and mappings', () => {
      const sourcemapContent = fs.readFileSync(sourcemapPath, 'utf-8')
      const sourcemap = JSON.parse(sourcemapContent)
      expect(sourcemap.version).toBe(3)
      expect(sourcemap.mappings).toBeDefined()
      expect(typeof sourcemap.mappings).toBe('string')
    })
  })

  describe('Build Configuration', () => {
    it('should use correct output format (iife)', () => {
      const content = fs.readFileSync(bundlePath, 'utf-8')
      // IIFE should assign to global/window
      expect(content).toMatch(/window\.AINativeCore|global\.AINativeCore|globalThis\.AINativeCore/)
    })

    it('should enable tree-shaking (no unused exports)', () => {
      const content = fs.readFileSync(bundlePath, 'utf-8')
      // Tree-shaken bundles should not contain obvious unused code markers
      // This is a basic check - real tree-shaking verification requires bundle analysis
      expect(content.length).toBeLessThan(1024 * 1024) // < 1MB suggests tree-shaking worked
    })
  })
})
