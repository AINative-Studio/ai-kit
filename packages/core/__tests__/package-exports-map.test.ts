/**
 * Tests for package.json's exports map itself - not just runtime behavior.
 *
 * #206: the browser/server split (Refs #106) built dist/browser.mjs and
 * dist/server.mjs correctly, but package.json's exports map never actually
 * pointed a `browser` condition at the browser build, so every consumer
 * (including bundlers that respect "use client" boundaries) still resolved
 * the undifferentiated dist/index.mjs regardless of target.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('package.json exports map', () => {
  const pkgPath = join(__dirname, '../package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  const packageDir = join(__dirname, '..')

  it('the "." export has a browser condition pointing at the browser build', () => {
    const dotExport = pkg.exports['.']
    expect(dotExport).toHaveProperty('browser')
    expect(dotExport.browser).toMatchObject({
      import: './dist/browser.mjs',
      require: './dist/browser.js',
    })
  })

  it('the browser condition is listed before the plain import/require conditions', () => {
    // Node's exports resolution is first-match-wins across condition keys
    // at the same level, but documentation/tooling consistency matters:
    // browser must be checked before falling through to import/require.
    const dotExport = pkg.exports['.']
    const keys = Object.keys(dotExport)
    const browserIndex = keys.indexOf('browser')
    const importIndex = keys.indexOf('import')
    expect(browserIndex).toBeGreaterThanOrEqual(0)
    expect(browserIndex).toBeLessThan(importIndex)
  })

  it('exposes an explicit "./browser" subpath for consumers that want to opt in directly', () => {
    expect(pkg.exports).toHaveProperty('./browser')
    expect(pkg.exports['./browser']).toMatchObject({
      import: './dist/browser.mjs',
      require: './dist/browser.js',
    })
  })

  it('exposes an explicit "./server" subpath for consumers that want to opt in directly', () => {
    expect(pkg.exports).toHaveProperty('./server')
    expect(pkg.exports['./server']).toMatchObject({
      import: './dist/server.mjs',
      require: './dist/server.js',
    })
  })

  it('every file referenced by the browser/server exports exists after a build', () => {
    // Guards against the exports map pointing at files the build doesn't
    // actually produce - mirrors the publish-time intent of
    // scripts/check-dist-has-types.ts (#211), applied to the JS/ESM
    // outputs too.
    const pathsToCheck = [
      pkg.exports['.'].browser.import,
      pkg.exports['.'].browser.require,
      pkg.exports['./server'].import,
      pkg.exports['./server'].require,
    ]

    for (const relativePath of pathsToCheck) {
      const absolutePath = join(packageDir, relativePath)
      expect(existsSync(absolutePath), `${relativePath} should exist after a build`).toBe(true)
    }
  })
})
