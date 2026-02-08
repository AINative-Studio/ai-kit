import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { gzipSync, brotliCompressSync } from 'zlib'

describe('Bundle Size Limits', () => {
  const distDir = path.join(__dirname, '../../dist/cdn')
  const bundlePath = path.join(distDir, 'ai-kit-core.global.js')

  // Size limits in KB
  const SIZE_LIMITS = {
    uncompressed: 500, // 500KB max uncompressed
    gzipped: 100,      // 100KB max gzipped (CRITICAL REQUIREMENT)
    brotli: 90,        // 90KB max with brotli
  }

  beforeAll(() => {
    if (!fs.existsSync(bundlePath)) {
      execSync('npm run build:cdn', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit',
      })
    }
  })

  describe('Size Enforcement', () => {
    it('should enforce uncompressed size limit', () => {
      const stats = fs.statSync(bundlePath)
      const sizeKB = stats.size / 1024

      console.log(`\n📏 Uncompressed Size: ${sizeKB.toFixed(2)} KB / ${SIZE_LIMITS.uncompressed} KB`)

      expect(sizeKB).toBeLessThan(SIZE_LIMITS.uncompressed)
    })

    it('should enforce gzipped size limit (CRITICAL)', () => {
      const content = fs.readFileSync(bundlePath)
      const compressed = gzipSync(content, { level: 9 })
      const sizeKB = compressed.length / 1024

      console.log(`\n📦 Gzipped Size: ${sizeKB.toFixed(2)} KB / ${SIZE_LIMITS.gzipped} KB`)

      // CRITICAL: Must be under 100KB gzipped
      expect(sizeKB).toBeLessThan(SIZE_LIMITS.gzipped)
    })

    it('should report brotli compression size', () => {
      const content = fs.readFileSync(bundlePath)
      const compressed = brotliCompressSync(content)
      const sizeKB = compressed.length / 1024

      console.log(`\n🗜️  Brotli Size: ${sizeKB.toFixed(2)} KB / ${SIZE_LIMITS.brotli} KB`)

      expect(sizeKB).toBeLessThan(SIZE_LIMITS.brotli)
    })
  })

  describe('Size Comparison', () => {
    it('should show compression efficiency', () => {
      const content = fs.readFileSync(bundlePath)
      const uncompressed = content.length
      const gzipped = gzipSync(content, { level: 9 }).length
      const brotli = brotliCompressSync(content).length

      const gzipRatio = ((1 - gzipped / uncompressed) * 100).toFixed(2)
      const brotliRatio = ((1 - brotli / uncompressed) * 100).toFixed(2)

      console.log('\n📊 Compression Statistics:')
      console.log(`  Uncompressed: ${(uncompressed / 1024).toFixed(2)} KB`)
      console.log(`  Gzipped:      ${(gzipped / 1024).toFixed(2)} KB (${gzipRatio}% reduction)`)
      console.log(`  Brotli:       ${(brotli / 1024).toFixed(2)} KB (${brotliRatio}% reduction)`)

      expect(parseFloat(gzipRatio)).toBeGreaterThan(50) // At least 50% compression
      expect(parseFloat(brotliRatio)).toBeGreaterThan(parseFloat(gzipRatio)) // Brotli should be better
    })
  })

  describe('Size Budget Tracking', () => {
    it('should track size budget usage', () => {
      const content = fs.readFileSync(bundlePath)
      const gzipped = gzipSync(content, { level: 9 })
      const sizeKB = gzipped.length / 1024
      const budgetUsed = (sizeKB / SIZE_LIMITS.gzipped) * 100

      console.log(`\n💰 Budget Usage: ${budgetUsed.toFixed(2)}% of ${SIZE_LIMITS.gzipped}KB limit`)

      if (budgetUsed > 90) {
        console.warn(`⚠️  Warning: Using ${budgetUsed.toFixed(2)}% of size budget`)
      }

      expect(budgetUsed).toBeLessThan(100)
    })

    it('should warn if approaching size limit', () => {
      const content = fs.readFileSync(bundlePath)
      const gzipped = gzipSync(content, { level: 9 })
      const sizeKB = gzipped.length / 1024
      const budgetRemaining = SIZE_LIMITS.gzipped - sizeKB

      console.log(`\n📉 Remaining Budget: ${budgetRemaining.toFixed(2)} KB`)

      if (budgetRemaining < 10) {
        console.warn(`⚠️  Warning: Only ${budgetRemaining.toFixed(2)}KB remaining!`)
      }

      expect(budgetRemaining).toBeGreaterThan(0)
    })
  })

  describe('Size Breakdown', () => {
    it('should provide detailed size metrics', () => {
      const content = fs.readFileSync(bundlePath)
      const uncompressedKB = content.length / 1024
      const gzippedKB = gzipSync(content, { level: 9 }).length / 1024
      const brotliKB = brotliCompressSync(content).length / 1024

      const metrics = {
        uncompressed: {
          size: uncompressedKB,
          limit: SIZE_LIMITS.uncompressed,
          status: uncompressedKB < SIZE_LIMITS.uncompressed ? 'PASS' : 'FAIL',
        },
        gzipped: {
          size: gzippedKB,
          limit: SIZE_LIMITS.gzipped,
          status: gzippedKB < SIZE_LIMITS.gzipped ? 'PASS' : 'FAIL',
        },
        brotli: {
          size: brotliKB,
          limit: SIZE_LIMITS.brotli,
          status: brotliKB < SIZE_LIMITS.brotli ? 'PASS' : 'FAIL',
        },
      }

      console.log('\n📋 Size Limits Report:')
      console.log(`  Uncompressed: ${metrics.uncompressed.size.toFixed(2)}KB / ${metrics.uncompressed.limit}KB [${metrics.uncompressed.status}]`)
      console.log(`  Gzipped:      ${metrics.gzipped.size.toFixed(2)}KB / ${metrics.gzipped.limit}KB [${metrics.gzipped.status}]`)
      console.log(`  Brotli:       ${metrics.brotli.size.toFixed(2)}KB / ${metrics.brotli.limit}KB [${metrics.brotli.status}]`)

      expect(metrics.uncompressed.status).toBe('PASS')
      expect(metrics.gzipped.status).toBe('PASS')
      expect(metrics.brotli.status).toBe('PASS')
    })
  })
})
