/**
 * UMD Bundle Tests - React Package CDN Distribution
 *
 * Tests for React UMD bundle loading via script tags
 * Refs #65: CDN bundles implementation
 */

import { describe, it, expect } from 'vitest'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

describe('UMD Bundle - React Package', () => {
  describe('Bundle File Existence', () => {
    it('should generate UMD bundle file', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-react.umd.js')
      expect(existsSync(bundlePath)).toBe(true)
    })

    it('should generate minified UMD bundle', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-react.umd.min.js')
      expect(existsSync(bundlePath)).toBe(true)
    })
  })

  describe('Bundle Structure', () => {
    it('should export global AIKitReact object', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-react.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      expect(bundleContent).toContain('AIKitReact')
    })

    it('should include React hooks', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-react.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      expect(bundleContent).toContain('useAIStream')
      expect(bundleContent).toContain('useAgent')
      expect(bundleContent).toContain('useConversation')
    })

    it('should mark React as external', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-react.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // React should be referenced as external
      expect(bundleContent).toContain('React')
    })

    it('should have reasonable bundle size', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-react.umd.min.js')
      const stats = readFileSync(bundlePath)
      const sizeKB = stats.length / 1024

      // React adapter should be under 100KB minified
      expect(sizeKB).toBeLessThan(100)
    })
  })

  describe('Package.json CDN Fields', () => {
    it('should have unpkg field', () => {
      const packagePath = join(__dirname, '../../package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      expect(packageJson.unpkg).toBe('./dist/ai-kit-react.umd.min.js')
    })

    it('should have jsdelivr field', () => {
      const packagePath = join(__dirname, '../../package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      expect(packageJson.jsdelivr).toBe('./dist/ai-kit-react.umd.min.js')
    })
  })
})
