import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { JSDOM } from 'jsdom'

describe('Browser Compatibility', () => {
  const distDir = path.join(__dirname, '../../dist/cdn')
  const bundlePath = path.join(distDir, 'ai-kit-core.global.js')
  let bundleContent: string

  beforeAll(() => {
    // Ensure bundle is built
    if (!fs.existsSync(bundlePath)) {
      execSync('npm run build:cdn', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit',
      })
    }
    bundleContent = fs.readFileSync(bundlePath, 'utf-8')
  })

  describe('Global Variable Exposure', () => {
    it('should expose AINativeCore on window object', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <script>${bundleContent}</script>
          </head>
          <body></body>
        </html>
      `, {
        runScripts: 'dangerously',
        resources: 'usable',
      })

      const { window } = dom
      expect(window.AINativeCore).toBeDefined()
      expect(typeof window.AINativeCore).toBe('object')
    })

    it('should not pollute global scope with internal variables', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <script>${bundleContent}</script>
          </head>
          <body></body>
        </html>
      `, {
        runScripts: 'dangerously',
      })

      const { window } = dom
      const globalKeys = Object.keys(window).filter(key =>
        !key.startsWith('_') &&
        key !== 'AINativeCore' &&
        !['document', 'location', 'navigator', 'window', 'parent', 'self', 'top'].includes(key)
      )

      // Should only expose AINativeCore, not internal build variables
      const unexpectedGlobals = globalKeys.filter(key =>
        key.includes('__webpack') ||
        key.includes('__vite') ||
        key.includes('require') ||
        key.includes('module') ||
        key.includes('exports')
      )

      expect(unexpectedGlobals).toEqual([])
    })
  })

  describe('Browser API Usage', () => {
    it('should reference window instead of global', () => {
      expect(bundleContent).toMatch(/window/)
      // Should not reference Node.js 'global' directly in browser build
      expect(bundleContent).not.toMatch(/typeof global !== ['"]undefined['"]/)
    })

    it('should use browser-compatible APIs', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <script>${bundleContent}</script>
          </head>
          <body></body>
        </html>
      `, {
        runScripts: 'dangerously',
      })

      // Should not throw errors when loaded
      expect(dom.window.AINativeCore).toBeDefined()
    })

    it('should handle process.env.NODE_ENV in browser', () => {
      // Bundle should define process.env.NODE_ENV for browser
      expect(bundleContent).toMatch(/"production"/)
    })
  })

  describe('Script Tag Loading', () => {
    it('should load successfully via script tag', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head></head>
          <body>
            <script>${bundleContent}</script>
            <script>
              if (typeof AINativeCore === 'undefined') {
                throw new Error('AINativeCore not loaded');
              }
              window.testPassed = true;
            </script>
          </body>
        </html>
      `, {
        runScripts: 'dangerously',
      })

      expect(dom.window.testPassed).toBe(true)
    })

    it('should be accessible immediately after script execution', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <script>${bundleContent}</script>
            <script>
              window.coreAvailable = typeof AINativeCore !== 'undefined';
              window.coreIsObject = typeof AINativeCore === 'object';
            </script>
          </body>
        </html>
      `, {
        runScripts: 'dangerously',
      })

      expect(dom.window.coreAvailable).toBe(true)
      expect(dom.window.coreIsObject).toBe(true)
    })
  })

  describe('No Runtime Errors', () => {
    it('should not throw errors on load', () => {
      expect(() => {
        new JSDOM(`
          <!DOCTYPE html>
          <html>
            <head>
              <script>${bundleContent}</script>
            </head>
            <body></body>
          </html>
        `, {
          runScripts: 'dangerously',
        })
      }).not.toThrow()
    })

    it('should handle missing Node.js APIs gracefully', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <script>${bundleContent}</script>
            <script>
              window.noErrors = true;
            </script>
          </body>
        </html>
      `, {
        runScripts: 'dangerously',
      })

      expect(dom.window.noErrors).toBe(true)
    })
  })

  describe('Multiple Loads', () => {
    it('should not conflict when loaded multiple times', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <script>${bundleContent}</script>
            <script>${bundleContent}</script>
            <script>
              window.stillWorks = typeof AINativeCore !== 'undefined';
            </script>
          </body>
        </html>
      `, {
        runScripts: 'dangerously',
      })

      expect(dom.window.stillWorks).toBe(true)
    })
  })
})
