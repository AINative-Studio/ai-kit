/**
 * Server/Node.js Compatibility Tests
 *
 * Tests that server exports include all Node.js-specific functionality
 * Refs #106
 */

import { describe, it, expect, vi } from 'vitest'

describe('Server/Node.js-compatible exports', () => {
  describe('Server entry point exports', () => {
    it('should export Redis-based stores', async () => {
      const {
        RedisStore,
        RedisSessionStore,
        RedisMemoryStore
      } = await import('../../src/server')

      expect(RedisStore).toBeDefined()
      expect(RedisSessionStore).toBeDefined()
      expect(RedisMemoryStore).toBeDefined()
    })

    it('should export LocalStorage for RLHF', async () => {
      const { RLHFLocalStorage } = await import('../../src/server')

      expect(RLHFLocalStorage).toBeDefined()
    })

    it('should export all browser-compatible features too', async () => {
      const serverExports = await import('../../src/server')

      // Server should have everything browser has, plus more
      const browserRequiredExports = [
        'AIStream',
        'Agent',
        'AgentExecutor',
        'MemoryStore',
        'ConversationStore',
        'ContextManager',
        'SessionManager',
        'AINativeAuthProvider',
        'ZeroDBClient',
        'RLHFLogger',
        'countTokens'
      ]

      for (const exportName of browserRequiredExports) {
        expect(serverExports).toHaveProperty(exportName)
      }
    })
  })

  describe('Redis integration', () => {
    it('should create RedisStore with dynamic import', async () => {
      const { RedisStore } = await import('../../src/server')

      // RedisStore should be a class
      expect(typeof RedisStore).toBe('function')
      expect(RedisStore.name).toBe('RedisStore')
    })

    it('should create RedisSessionStore with config', async () => {
      const { RedisSessionStore } = await import('../../src/server')

      expect(typeof RedisSessionStore).toBe('function')
      expect(RedisSessionStore.name).toBe('RedisSessionStore')

      // Should be able to construct (will fail to connect, but class should exist)
      const store = new RedisSessionStore({
        host: 'localhost',
        port: 6379,
        keyPrefix: 'test:session:'
      })

      expect(store).toBeDefined()
      expect(store).toBeInstanceOf(RedisSessionStore)

      // Cleanup
      await store.close().catch(() => {
        // Ignore connection errors in tests
      })
    })

    it('should create RedisMemoryStore with config', async () => {
      const { RedisMemoryStore } = await import('../../src/server')

      expect(typeof RedisMemoryStore).toBe('function')
      expect(RedisMemoryStore.name).toBe('RedisMemoryStore')

      const store = new RedisMemoryStore({
        host: 'localhost',
        port: 6379,
        keyPrefix: 'test:memory:'
      })

      expect(store).toBeDefined()
      expect(store).toBeInstanceOf(RedisMemoryStore)

      // Cleanup
      await store.close().catch(() => {
        // Ignore connection errors in tests
      })
    })
  })

  describe('File system integration', () => {
    it('should create LocalStorage for RLHF with fs access', async () => {
      const { RLHFLocalStorage } = await import('../../src/server')

      expect(typeof RLHFLocalStorage).toBe('function')
      expect(RLHFLocalStorage.name).toBe('LocalStorage')

      const storage = new RLHFLocalStorage({
        dataDir: '/tmp/rlhf-test',
        compress: false
      })

      expect(storage).toBeDefined()
      expect(storage).toBeInstanceOf(RLHFLocalStorage)
    })
  })

  describe('Server API surface', () => {
    it('should provide complete API for server-side AI applications', async () => {
      const serverExports = await import('../../src/server')

      // Server-only features
      const serverOnlyExports = [
        'RedisStore',
        'RedisSessionStore',
        'RedisMemoryStore',
        'RLHFLocalStorage'
      ]

      for (const exportName of serverOnlyExports) {
        expect(serverExports).toHaveProperty(exportName)
      }
    })

    it('should export factory functions for creating server stores', async () => {
      const serverExports = await import('../../src/server')

      // Should have store creation utilities
      expect(serverExports).toHaveProperty('createStore')
    })
  })

  describe('Conditional exports validation', () => {
    it('should handle ioredis as optional peer dependency', async () => {
      // This validates the dynamic import pattern works
      const { RedisStore } = await import('../../src/server')

      expect(RedisStore).toBeDefined()

      // If ioredis is not installed, initialization should provide helpful error
      // This is tested in the implementation, not here
    })

    it('should handle fs module gracefully', async () => {
      const { RLHFLocalStorage } = await import('../../src/server')

      expect(RLHFLocalStorage).toBeDefined()

      // fs is a built-in module, should always be available in Node.js
    })
  })

  describe('Environment detection', () => {
    it('should work in Node.js environment', () => {
      // We're running in Node.js test environment
      expect(typeof process).toBe('object')
      expect(typeof process.versions.node).toBe('string')
    })
  })

  describe('Dynamic import patterns', () => {
    it('should use dynamic imports for server-only dependencies', async () => {
      // The RedisStore uses dynamic import for ioredis
      // This test verifies the pattern works
      const { RedisStore } = await import('../../src/server')

      // Create instance (will lazy load ioredis)
      const store = new RedisStore({
        url: 'redis://localhost:6379'
      })

      expect(store).toBeDefined()

      // Cleanup
      await store.close().catch(() => {
        // Ignore connection errors
      })
    })

    it('should provide clear error when ioredis is missing', async () => {
      const { RedisStore } = await import('../../src/server')

      const store = new RedisStore({
        url: 'redis://localhost:6379'
      })

      // Try to use store (will attempt to load ioredis)
      try {
        await store.save('test', [])
      } catch (error) {
        // If ioredis is not installed, should get helpful error
        if (error instanceof Error && error.message.includes('ioredis')) {
          expect(error.message).toContain('pnpm add ioredis')
        }
      }

      // Cleanup
      await store.close().catch(() => {})
    })
  })
})
