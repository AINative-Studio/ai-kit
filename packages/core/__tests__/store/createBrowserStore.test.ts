/**
 * Tests for createBrowserStore factory — the browser-safe subset of
 * createStore() that never imports RedisStore, so it can be reached from
 * src/browser.ts without pulling ioredis into a client bundle (#206).
 */

import { describe, it, expect } from 'vitest'
import { createBrowserStore, isMemoryStore, isZeroDBStore } from '../../src/store/createBrowserStore'
import { MemoryStore } from '../../src/store/MemoryStore'
import { ZeroDBStore } from '../../src/store/ZeroDBStore'

describe('createBrowserStore', () => {
  describe('Memory store creation', () => {
    it('should create a memory store', () => {
      const store = createBrowserStore({ type: 'memory' })
      expect(store).toBeInstanceOf(MemoryStore)
    })

    it('should create a memory store with config', () => {
      const store = createBrowserStore({
        type: 'memory',
        maxConversations: 100,
        defaultTTL: 3600,
        namespace: 'test',
      })
      expect(store).toBeInstanceOf(MemoryStore)
    })
  })

  describe('ZeroDB store creation', () => {
    it('should create a zerodb store', () => {
      const store = createBrowserStore({
        type: 'zerodb',
        projectId: 'test-project',
        apiKey: 'test-key',
      })
      expect(store).toBeInstanceOf(ZeroDBStore)
    })

    it('should create a zerodb store with full config', () => {
      const store = createBrowserStore({
        type: 'zerodb',
        projectId: 'test-project',
        apiKey: 'test-key',
        tableName: 'conversations',
        defaultTTL: 7200,
      })
      expect(store).toBeInstanceOf(ZeroDBStore)
    })
  })

  describe('Redis store rejection', () => {
    it('throws a clear, actionable error for type: redis instead of constructing RedisStore', () => {
      expect(() =>
        createBrowserStore({ type: 'redis', host: 'localhost' } as never)
      ).toThrow(/@ainative\/ai-kit-core\/server/)
    })

    it('does not mention "Unknown store type" for redis (it is a known type, just unsupported here)', () => {
      expect(() =>
        createBrowserStore({ type: 'redis', host: 'localhost' } as never)
      ).not.toThrow(/Unknown store type/)
    })
  })

  describe('Validation', () => {
    it('should throw error for invalid config type', () => {
      expect(() => createBrowserStore(null as never)).toThrow()
    })

    it('should throw error for missing type', () => {
      expect(() => createBrowserStore({} as never)).toThrow()
    })

    it('should throw error for invalid type', () => {
      expect(() => createBrowserStore({ type: 'bogus' } as never)).toThrow()
    })
  })

  describe('Type guards', () => {
    it('isMemoryStore identifies a MemoryStore instance', () => {
      const store = createBrowserStore({ type: 'memory' })
      expect(isMemoryStore(store)).toBe(true)
    })

    it('isZeroDBStore identifies a ZeroDBStore instance', () => {
      const store = createBrowserStore({
        type: 'zerodb',
        projectId: 'p',
        apiKey: 'k',
      })
      expect(isZeroDBStore(store)).toBe(true)
    })

    it('isMemoryStore returns false for a ZeroDBStore instance', () => {
      const store = createBrowserStore({
        type: 'zerodb',
        projectId: 'p',
        apiKey: 'k',
      })
      expect(isMemoryStore(store)).toBe(false)
    })
  })
})
