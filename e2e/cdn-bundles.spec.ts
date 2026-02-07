/**
 * E2E Tests for CDN Bundle Loading
 *
 * Tests actual script tag loading in browser environment
 * Refs #65: CDN bundles implementation
 */

import { test, expect } from '@playwright/test'

test.describe('CDN Bundle Loading - Script Tags', () => {
  test.describe('Core Package', () => {
    test('should load AIKitCore from script tag', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="/packages/core/dist/ai-kit-core.umd.js"></script>
          </head>
          <body>
            <script>
              window.testResult = {
                loaded: typeof AIKitCore !== 'undefined',
                hasAIStream: typeof AIKitCore?.AIStream !== 'undefined',
                hasAgent: typeof AIKitCore?.Agent !== 'undefined',
                hasMemoryStore: typeof AIKitCore?.MemoryStore !== 'undefined'
              }
            </script>
          </body>
        </html>
      `)

      const result = await page.evaluate(() => window.testResult)

      expect(result.loaded).toBe(true)
      expect(result.hasAIStream).toBe(true)
      expect(result.hasAgent).toBe(true)
      expect(result.hasMemoryStore).toBe(true)
    })

    test('should create AIStream instance from CDN', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="/packages/core/dist/ai-kit-core.umd.js"></script>
          </head>
          <body>
            <script>
              try {
                const stream = new AIKitCore.AIStream({
                  apiKey: 'test-key',
                  model: 'gpt-4'
                })
                window.testResult = {
                  success: true,
                  hasStream: !!stream,
                  hasOn: typeof stream.on === 'function'
                }
              } catch (error) {
                window.testResult = {
                  success: false,
                  error: error.message
                }
              }
            </script>
          </body>
        </html>
      `)

      const result = await page.evaluate(() => window.testResult)

      expect(result.success).toBe(true)
      expect(result.hasStream).toBe(true)
      expect(result.hasOn).toBe(true)
    })
  })

  test.describe('React Package', () => {
    test('should load AIKitReact with React dependency', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
            <script src="/packages/core/dist/ai-kit-core.umd.js"></script>
            <script src="/packages/react/dist/ai-kit-react.umd.js"></script>
          </head>
          <body>
            <script>
              window.testResult = {
                loaded: typeof AIKitReact !== 'undefined',
                hasUseAIStream: typeof AIKitReact?.useAIStream !== 'undefined',
                hasUseAgent: typeof AIKitReact?.useAgent !== 'undefined',
                hasReact: typeof React !== 'undefined'
              }
            </script>
          </body>
        </html>
      `)

      const result = await page.evaluate(() => window.testResult)

      expect(result.loaded).toBe(true)
      expect(result.hasUseAIStream).toBe(true)
      expect(result.hasUseAgent).toBe(true)
      expect(result.hasReact).toBe(true)
    })
  })

  test.describe('Vue Package', () => {
    test('should load AIKitVue with Vue dependency', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
            <script src="/packages/core/dist/ai-kit-core.umd.js"></script>
            <script src="/packages/vue/dist/ai-kit-vue.umd.js"></script>
          </head>
          <body>
            <script>
              window.testResult = {
                loaded: typeof AIKitVue !== 'undefined',
                hasUseAIStream: typeof AIKitVue?.useAIStream !== 'undefined',
                hasUseAgent: typeof AIKitVue?.useAgent !== 'undefined',
                hasVue: typeof Vue !== 'undefined'
              }
            </script>
          </body>
        </html>
      `)

      const result = await page.evaluate(() => window.testResult)

      expect(result.loaded).toBe(true)
      expect(result.hasUseAIStream).toBe(true)
      expect(result.hasUseAgent).toBe(true)
      expect(result.hasVue).toBe(true)
    })
  })

  test.describe('Svelte Package', () => {
    test('should load AIKitSvelte', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="/packages/core/dist/ai-kit-core.umd.js"></script>
            <script src="/packages/svelte/dist/ai-kit-svelte.umd.js"></script>
          </head>
          <body>
            <script>
              window.testResult = {
                loaded: typeof AIKitSvelte !== 'undefined',
                hasCreateAIStream: typeof AIKitSvelte?.createAIStream !== 'undefined',
                hasCreateAgent: typeof AIKitSvelte?.createAgent !== 'undefined'
              }
            </script>
          </body>
        </html>
      `)

      const result = await page.evaluate(() => window.testResult)

      expect(result.loaded).toBe(true)
      expect(result.hasCreateAIStream).toBe(true)
      expect(result.hasCreateAgent).toBe(true)
    })
  })

  test.describe('Multiple Packages Together', () => {
    test('should load all packages without conflicts', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
            <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
            <script src="/packages/core/dist/ai-kit-core.umd.js"></script>
            <script src="/packages/react/dist/ai-kit-react.umd.js"></script>
            <script src="/packages/vue/dist/ai-kit-vue.umd.js"></script>
            <script src="/packages/svelte/dist/ai-kit-svelte.umd.js"></script>
          </head>
          <body>
            <script>
              window.testResult = {
                core: typeof AIKitCore !== 'undefined',
                react: typeof AIKitReact !== 'undefined',
                vue: typeof AIKitVue !== 'undefined',
                svelte: typeof AIKitSvelte !== 'undefined',
                noConflicts: true
              }
            </script>
          </body>
        </html>
      `)

      const result = await page.evaluate(() => window.testResult)

      expect(result.core).toBe(true)
      expect(result.react).toBe(true)
      expect(result.vue).toBe(true)
      expect(result.svelte).toBe(true)
      expect(result.noConflicts).toBe(true)
    })
  })

  test.describe('Minified Bundles', () => {
    test('should load minified core bundle', async ({ page }) => {
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <script src="/packages/core/dist/ai-kit-core.umd.min.js"></script>
          </head>
          <body>
            <script>
              window.testResult = {
                loaded: typeof AIKitCore !== 'undefined',
                functional: typeof AIKitCore.AIStream !== 'undefined'
              }
            </script>
          </body>
        </html>
      `)

      const result = await page.evaluate(() => window.testResult)

      expect(result.loaded).toBe(true)
      expect(result.functional).toBe(true)
    })
  })
})
