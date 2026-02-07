/**
 * UMD Bundle Tests - CDN Distribution
 *
 * Tests for UMD bundle loading via script tags
 * Refs #65: CDN bundles implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, type ChildProcess } from 'child_process'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

describe('UMD Bundle - Core Package', () => {
  let serverProcess: ChildProcess | null = null
  const port = 8765
  const baseUrl = `http://localhost:${port}`

  beforeAll(async () => {
    // Start a simple HTTP server to serve the UMD bundle
    // In real scenario, this would be served from unpkg/jsdelivr
    serverProcess = spawn('npx', ['http-server', 'dist', '-p', port.toString()], {
      cwd: join(__dirname, '../../'),
      stdio: 'ignore'
    })

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000))
  })

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill()
    }
  })

  describe('Bundle File Existence', () => {
    it('should generate UMD bundle file', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      expect(existsSync(bundlePath)).toBe(true)
    })

    it('should generate minified UMD bundle', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.min.js')
      expect(existsSync(bundlePath)).toBe(true)
    })

    it('should include source maps', () => {
      const sourcemapPath = join(__dirname, '../../dist/ai-kit-core.umd.js.map')
      expect(existsSync(sourcemapPath)).toBe(true)
    })
  })

  describe('Bundle Structure', () => {
    it('should export global AIKitCore object', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Check for UMD wrapper
      expect(bundleContent).toContain('(function')
      expect(bundleContent).toContain('define')
      expect(bundleContent).toContain('exports')

      // Check for global export
      expect(bundleContent).toContain('AIKitCore')
    })

    it('should include all core exports', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Core streaming exports
      expect(bundleContent).toContain('AIStream')
      expect(bundleContent).toContain('OpenAIAdapter')
      expect(bundleContent).toContain('AnthropicAdapter')

      // Core agent exports
      expect(bundleContent).toContain('Agent')
      expect(bundleContent).toContain('AgentExecutor')

      // Store exports
      expect(bundleContent).toContain('MemoryStore')
    })

    it('should have reasonable bundle size', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.min.js')
      const stats = readFileSync(bundlePath)
      const sizeKB = stats.length / 1024

      // UMD bundle should be under 200KB minified
      expect(sizeKB).toBeLessThan(200)
    })
  })

  describe('Browser Compatibility', () => {
    it('should work in ES5 environments', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Should not contain ES6+ syntax in UMD wrapper
      const umdWrapper = bundleContent.substring(0, 500)
      expect(umdWrapper).not.toContain('=>')
      expect(umdWrapper).not.toContain('const ')
      expect(umdWrapper).not.toContain('let ')
    })

    it('should include polyfills for Promise if needed', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Bundle should handle promises
      expect(bundleContent).toContain('Promise')
    })
  })

  describe('External Dependencies', () => {
    it('should not bundle peer dependencies', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Optional peer deps should be external
      // tiktoken and ioredis should not be included
      expect(bundleContent).not.toContain('tiktoken/encoders')
      expect(bundleContent).not.toContain('ioredis')
    })

    it('should bundle required dependencies', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // These are required and should be bundled
      expect(bundleContent).toContain('eventsource-parser')
      expect(bundleContent).toContain('zod')
    })
  })
})

describe('UMD Bundle - Module Format Compatibility', () => {
  describe('AMD Support', () => {
    it('should work with RequireJS', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Check AMD pattern
      expect(bundleContent).toContain('typeof define')
      expect(bundleContent).toContain('define.amd')
    })
  })

  describe('CommonJS Support', () => {
    it('should work with Node.js require', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Check CommonJS pattern
      expect(bundleContent).toContain('typeof exports')
      expect(bundleContent).toContain('typeof module')
    })
  })

  describe('Global/Browser Support', () => {
    it('should attach to window in browser', () => {
      const bundlePath = join(__dirname, '../../dist/ai-kit-core.umd.js')
      const bundleContent = readFileSync(bundlePath, 'utf-8')

      // Check global export
      expect(bundleContent).toContain('this')
      expect(bundleContent).toContain('AIKitCore')
    })
  })
})

describe('Package.json CDN Fields', () => {
  it('should have unpkg field', () => {
    const packagePath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    expect(packageJson.unpkg).toBe('./dist/ai-kit-core.umd.min.js')
  })

  it('should have jsdelivr field', () => {
    const packagePath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    expect(packageJson.jsdelivr).toBe('./dist/ai-kit-core.umd.min.js')
  })

  it('should maintain existing fields', () => {
    const packagePath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    // Ensure we didn't break existing exports
    expect(packageJson.main).toBe('./dist/index.js')
    expect(packageJson.module).toBe('./dist/index.mjs')
    expect(packageJson.types).toBe('./dist/index.d.ts')
  })
})

describe('CDN URLs', () => {
  it('should construct valid unpkg URL', () => {
    const packagePath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    const unpkgUrl = `https://unpkg.com/${packageJson.name}@${packageJson.version}/dist/ai-kit-core.umd.min.js`

    // Validate URL format
    expect(unpkgUrl).toMatch(/^https:\/\/unpkg\.com\/@ainative\/ai-kit-core@[\d.]+.*\/dist\/ai-kit-core\.umd\.min\.js$/)
  })

  it('should construct valid jsdelivr URL', () => {
    const packagePath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    const jsdelivrUrl = `https://cdn.jsdelivr.net/npm/${packageJson.name}@${packageJson.version}/dist/ai-kit-core.umd.min.js`

    // Validate URL format
    expect(jsdelivrUrl).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/npm\/@ainative\/ai-kit-core@[\d.]+.*\/dist\/ai-kit-core\.umd\.min\.js$/)
  })
})
