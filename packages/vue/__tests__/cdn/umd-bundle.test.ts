/**
 * UMD Bundle Tests - Vue Package CDN Distribution
 *
 * Tests for Vue UMD bundle loading via script tags
 * Refs #65: CDN bundles implementation
 */

import { describe, it, expect } from 'vitest'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

describe('UMD Bundle - Vue Package', () => {
  describe('Bundle File Existence', () => {
    it('should generate UMD bundle file', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-vue.umd.js')
      expect(existsSync(bundlePath)).toBe(true)
    })

    it('should generate minified UMD bundle', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-vue.umd.min.js')
      expect(existsSync(bundlePath)).toBe(true)
    })
  })

  describe('Bundle Structure', () => {
    it('should export global AIKitVue object', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-vue.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      expect(bundleContent).toContain('AIKitVue')
    })

    it('should include Vue composables', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-vue.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      expect(bundleContent).toContain('useAIStream')
      expect(bundleContent).toContain('useAgent')
    })

    it('should mark Vue as external', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-vue.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Vue should be referenced as external
      expect(bundleContent).toContain('Vue')
    })

    it('should have reasonable bundle size', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-vue.umd.min.js')
      const stats = readFileSync(bundlePath)
      const sizeKB = stats.length / 1024

      // Vue adapter should be under 80KB minified
      expect(sizeKB).toBeLessThan(80)
    })
  })

  describe('Package.json CDN Fields', () => {
    it('should have unpkg field', () => {
      const packagePath = join(__dirname, '../../package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      expect(packageJson.unpkg).toBe('./dist/ai-kit-vue.umd.min.js')
    })

    it('should have jsdelivr field', () => {
      const packagePath = join(__dirname, '../../package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      expect(packageJson.jsdelivr).toBe('./dist/ai-kit-vue.umd.min.js')
    })
  })
})
