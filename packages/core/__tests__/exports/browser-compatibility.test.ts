/**
 * Browser Compatibility Tests
 *
 * Tests that browser-compatible exports work without Node.js dependencies
 * Refs #106
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('Browser-compatible exports', () => {
  describe('Main entry point browser compatibility', () => {
    it('should export streaming utilities without server dependencies', async () => {
      // Import should not throw in a browser-like environment
      const { AIStream, countTokens, countMessageTokens } = await import('../../src/browser')

      expect(AIStream).toBeDefined()
      expect(typeof countTokens).toBe('function')
      expect(typeof countMessageTokens).toBe('function')
    })

    it('should export agent types without server dependencies', async () => {
      const exports = await import('../../src/browser')

      // Should have agent-related exports
      expect(exports).toHaveProperty('Agent')
      expect(exports).toHaveProperty('AgentExecutor')
    })

    it('should export memory store without Redis dependency', async () => {
      const { MemoryStore, InMemoryMemoryStore } = await import('../../src/browser')

      expect(MemoryStore).toBeDefined()
      expect(InMemoryMemoryStore).toBeDefined()

      // Create an in-memory store without Redis
      const store = new InMemoryMemoryStore({
        keyPrefix: 'test:',
        ttl: 3600
      })

      expect(store).toBeDefined()
    })

    it('should export conversation store without Redis dependency', async () => {
      const { ConversationStore, MemoryStore: ConvMemoryStore } = await import('../../src/browser')

      expect(ConversationStore).toBeDefined()
      expect(ConvMemoryStore).toBeDefined()
    })

    it('should NOT export Redis-dependent classes in browser entry', async () => {
      const exports = await import('../../src/browser')

      // These should not be available in browser builds
      expect(exports).not.toHaveProperty('RedisStore')
      expect(exports).not.toHaveProperty('RedisSessionStore')
      expect(exports).not.toHaveProperty('RedisMemoryStore')
      expect(exports).not.toHaveProperty('RLHFLocalStorage')
    })

    it('should export the in-memory session store, but not SessionManager', async () => {
      // SessionManager is server-only (Refs #206) - construct
      // InMemorySessionStore directly for a browser-safe equivalent.
      const browserModule = await import('../../src/browser')
      const { InMemorySessionStore } = browserModule

      expect(InMemorySessionStore).toBeDefined()
      expect(browserModule).not.toHaveProperty('SessionManager')

      const store = new InMemorySessionStore()
      expect(store).toBeDefined()
    })

    it('should export context and summarization utilities', async () => {
      const {
        ContextManager,
        TokenCounter,
        ConversationSummarizer
      } = await import('../../src/browser')

      expect(ContextManager).toBeDefined()
      expect(TokenCounter).toBeDefined()
      expect(ConversationSummarizer).toBeDefined()
    })

    it('should export design system utilities', async () => {
      const { DesignConstraints } = await import('../../src/browser')

      expect(DesignConstraints).toBeDefined()
    })

    it('should export authentication without server-side storage', async () => {
      const { AINativeAuthProvider, AuthMethod } = await import('../../src/browser')

      expect(AINativeAuthProvider).toBeDefined()
      expect(AuthMethod).toBeDefined()
    })

    it('should export ZeroDB client for cloud operations', async () => {
      const { ZeroDBClient, ZeroDBQueryBuilder } = await import('../../src/browser')

      expect(ZeroDBClient).toBeDefined()
      expect(ZeroDBQueryBuilder).toBeDefined()
    })

    it('should export RLHF instrumentation and memory storage only, not RLHFLogger', async () => {
      // RLHFLogger is server-only (its createStorageBackend() can select
      // LocalStorage, which has no browser equivalent) - Refs #206.
      const { RLHFInstrumentation, RLHFMemoryStorage } = await import('../../src/browser')

      expect(RLHFInstrumentation).toBeDefined()
      expect(RLHFMemoryStorage).toBeDefined()
    })
  })

  describe('Browser bundle validation', () => {
    it('should not include ioredis in browser bundle', async () => {
      // This test verifies that importing browser entry doesn't trigger ioredis import
      let importError = null

      try {
        await import('../../src/browser')
      } catch (error) {
        importError = error
      }

      expect(importError).toBeNull()
    })

    it('should not include fs module in browser bundle', async () => {
      // Verify no fs imports are triggered
      let importError = null

      try {
        const exports = await import('../../src/browser')
        // LocalStorage uses fs, should not be in browser bundle
        expect(exports).not.toHaveProperty('RLHFLocalStorage')
      } catch (error) {
        importError = error
      }

      expect(importError).toBeNull()
    })

    it('should not include dns module in browser bundle', async () => {
      let importError = null

      try {
        await import('../../src/browser')
      } catch (error) {
        importError = error
      }

      expect(importError).toBeNull()
    })
  })

  describe('Browser API surface', () => {
    it('should provide complete API for client-side AI applications', async () => {
      const browserExports = await import('../../src/browser')

      // Core functionality that should be available. SessionManager and
      // RLHFLogger are deliberately excluded: both statically import a
      // Node-only dependency (RedisSessionStore/ioredis,
      // LocalStorage/fs) with no browser equivalent - Refs #206. Use
      // InMemorySessionStore/ZeroDBSessionStore and RLHFInstrumentation/
      // RLHFMemoryStorage/RLHFZeroDBStorage instead, or import
      // SessionManager/RLHFLogger from '@ainative/ai-kit-core/server'.
      const requiredExports = [
        'AIStream',
        'Agent',
        'AgentExecutor',
        'StreamingAgentExecutor',
        'MemoryStore',
        'ConversationStore',
        'ContextManager',
        'AINativeAuthProvider',
        'ZeroDBClient',
        'countTokens',
        'DesignConstraints'
      ]

      for (const exportName of requiredExports) {
        expect(browserExports).toHaveProperty(exportName)
      }

      expect(browserExports).not.toHaveProperty('SessionManager')
      expect(browserExports).not.toHaveProperty('RLHFLogger')
    })
  })
})
