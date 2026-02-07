/**
 * UMD Bundle Tests - Svelte Package CDN Distribution
 *
 * Tests for Svelte UMD bundle loading via script tags
 * Refs #65: CDN bundles implementation
 */

import { describe, it, expect } from 'vitest'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

describe('UMD Bundle - Svelte Package', () => {
  describe('Bundle File Existence', () => {
    it('should generate UMD bundle file', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-svelte.umd.js')
      expect(existsSync(bundlePath)).toBe(true)
    })

    it('should generate minified UMD bundle', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-svelte.umd.min.js')
      expect(existsSync(bundlePath)).toBe(true)
    })
  })

  describe('Bundle Structure', () => {
    it('should export global AIKitSvelte object', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-svelte.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      expect(bundleContent).toContain('AIKitSvelte')
    })

    it('should include Svelte stores', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-svelte.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      expect(bundleContent).toContain('createAIStream')
      expect(bundleContent).toContain('createAgent')
    })

    it('should mark Svelte as external', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-svelte.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Svelte store should be referenced as external
      expect(bundleContent).toContain('svelte/store')
    })

    it('should have reasonable bundle size', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-svelte.umd.min.js')
      const stats = readFileSync(bundlePath)
      const sizeKB = stats.length / 1024

      // Svelte adapter should be under 80KB minified
      expect(sizeKB).toBeLessThan(80)
    })
  })

  describe('Package.json CDN Fields', () => {
    it('should have unpkg field', () => {
      const packagePath = join(__dirname, '../../package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      expect(packageJson.unpkg).toBe('./dist/ai-kit-svelte.umd.min.js')
    })

    it('should have jsdelivr field', () => {
      const packagePath = join(__dirname, '../../package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      expect(packageJson.jsdelivr).toBe('./dist/ai-kit-svelte.umd.min.js')
    })
  })
})
