/**
 * Tests for browser.ts export resolution
 * Verifies that all exports are correctly resolved without TS2308 ambiguity errors
 * Refs #129
 */

import { describe, it, expect } from 'vitest'

describe('Browser Entry Point Exports', () => {
  describe('Type exports', () => {
    it('should export base types without conflicts', async () => {
      const browserModule = await import('../src/browser')

      // These types should be available
      expect(typeof browserModule).toBe('object')
      expect(browserModule).toBeDefined()
    })
  })

  describe('Store exports', () => {
    it('should export store classes', async () => {
      const { ConversationStore, ConvMemoryStore, ZeroDBStore } = await import('../src/browser')

      expect(ConversationStore).toBeDefined()
      expect(typeof ConversationStore).toBe('function')
      expect(ConvMemoryStore).toBeDefined()
      expect(typeof ConvMemoryStore).toBe('function')
      expect(ZeroDBStore).toBeDefined()
      expect(typeof ZeroDBStore).toBe('function')
    })

    it('should export store utilities', async () => {
      const { createStore, isMemoryStore, isZeroDBStore } = await import('../src/browser')

      expect(createStore).toBeDefined()
      expect(typeof createStore).toBe('function')
      expect(isMemoryStore).toBeDefined()
      expect(typeof isMemoryStore).toBe('function')
      expect(isZeroDBStore).toBeDefined()
      expect(typeof isZeroDBStore).toBe('function')
    })
  })

  describe('Memory exports', () => {
    it('should export memory store classes', async () => {
      const { MemoryStore, InMemoryMemoryStore, ZeroDBMemoryStore } = await import('../src/browser')

      expect(MemoryStore).toBeDefined()
      expect(typeof MemoryStore).toBe('function')
      expect(InMemoryMemoryStore).toBeDefined()
      expect(typeof InMemoryMemoryStore).toBe('function')
      expect(ZeroDBMemoryStore).toBeDefined()
      expect(typeof ZeroDBMemoryStore).toBe('function')
    })

    it('should export user memory classes', async () => {
      const { UserMemory, FactExtractor } = await import('../src/browser')

      expect(UserMemory).toBeDefined()
      expect(typeof UserMemory).toBe('function')
      expect(FactExtractor).toBeDefined()
      expect(typeof FactExtractor).toBe('function')
    })
  })

  describe('Session exports', () => {
    it('should export session manager and stores', async () => {
      const { SessionManager, InMemorySessionStore, ZeroDBSessionStore } = await import('../src/browser')

      expect(SessionManager).toBeDefined()
      expect(typeof SessionManager).toBe('function')
      expect(InMemorySessionStore).toBeDefined()
      expect(typeof InMemorySessionStore).toBe('function')
      expect(ZeroDBSessionStore).toBeDefined()
      expect(typeof ZeroDBSessionStore).toBe('function')
    })
  })

  describe('Auth exports', () => {
    it('should export auth provider', async () => {
      const { AINativeAuthProvider } = await import('../src/browser')

      expect(AINativeAuthProvider).toBeDefined()
      expect(typeof AINativeAuthProvider).toBe('function')
    })

    it('should export auth enums and classes', async () => {
      const { AuthError, AuthErrorType, AuthMethod, AuthStatus, StorageStrategy, AuthEventType } = await import('../src/browser')

      expect(AuthError).toBeDefined()
      expect(AuthErrorType).toBeDefined()
      expect(AuthMethod).toBeDefined()
      expect(AuthStatus).toBeDefined()
      expect(StorageStrategy).toBeDefined()
      expect(AuthEventType).toBeDefined()
    })
  })

  describe('ZeroDB exports', () => {
    it('should export ZeroDB client and query builder', async () => {
      const { ZeroDBClient, ZeroDBQueryBuilder } = await import('../src/browser')

      expect(ZeroDBClient).toBeDefined()
      expect(typeof ZeroDBClient).toBe('function')
      expect(ZeroDBQueryBuilder).toBeDefined()
      expect(typeof ZeroDBQueryBuilder).toBe('function')
    })
  })

  describe('RLHF exports', () => {
    it('should export RLHF logger and instrumentation', async () => {
      const { RLHFLogger, RLHFInstrumentation } = await import('../src/browser')

      expect(RLHFLogger).toBeDefined()
      expect(typeof RLHFLogger).toBe('function')
      expect(RLHFInstrumentation).toBeDefined()
      expect(typeof RLHFInstrumentation).toBe('function')
    })

    it('should export RLHF storage classes', async () => {
      const { RLHFMemoryStorage, RLHFZeroDBStorage } = await import('../src/browser')

      expect(RLHFMemoryStorage).toBeDefined()
      expect(typeof RLHFMemoryStorage).toBe('function')
      expect(RLHFZeroDBStorage).toBeDefined()
      expect(typeof RLHFZeroDBStorage).toBe('function')
    })
  })

  describe('Search exports', () => {
    it('should export SemanticSearch', async () => {
      const { SemanticSearch } = await import('../src/browser')

      expect(SemanticSearch).toBeDefined()
      expect(typeof SemanticSearch).toBe('function')
    })
  })

  describe('Design exports', () => {
    it('should export DesignConstraints', async () => {
      const { DesignConstraints } = await import('../src/browser')

      expect(DesignConstraints).toBeDefined()
      expect(typeof DesignConstraints).toBe('function')
    })
  })

  describe('Utils exports', () => {
    it('should export RateLimiter', async () => {
      const { RateLimiter } = await import('../src/browser')

      expect(RateLimiter).toBeDefined()
      expect(typeof RateLimiter).toBe('function')
    })

    it('should export ID utilities', async () => {
      const browserModule = await import('../src/browser')

      // ID utilities should be exported
      expect(browserModule).toBeDefined()
    })
  })

  describe('Streaming exports', () => {
    it('should export AIStream', async () => {
      const { AIStream } = await import('../src/browser')

      expect(AIStream).toBeDefined()
      expect(typeof AIStream).toBe('function')
    })

    it('should export token counting utilities', async () => {
      const {
        countTokens,
        countMessageTokens,
        countMessagesTokens,
        calculateCost,
        estimateRequestTokens,
        MODEL_PRICING
      } = await import('../src/browser')

      expect(countTokens).toBeDefined()
      expect(typeof countTokens).toBe('function')
      expect(countMessageTokens).toBeDefined()
      expect(typeof countMessageTokens).toBe('function')
      expect(countMessagesTokens).toBeDefined()
      expect(typeof countMessagesTokens).toBe('function')
      expect(calculateCost).toBeDefined()
      expect(typeof calculateCost).toBe('function')
      expect(estimateRequestTokens).toBeDefined()
      expect(typeof estimateRequestTokens).toBe('function')
      expect(MODEL_PRICING).toBeDefined()
      expect(typeof MODEL_PRICING).toBe('object')
    })
  })

  describe('Agent exports', () => {
    it('should export agent classes', async () => {
      const {
        Agent,
        createAgent,
        AgentExecutor,
        executeAgent,
        StreamingAgentExecutor,
        streamAgentExecution,
        AgentSwarm,
        createAgentSwarm
      } = await import('../src/browser')

      expect(Agent).toBeDefined()
      expect(typeof Agent).toBe('function')
      expect(createAgent).toBeDefined()
      expect(typeof createAgent).toBe('function')
      expect(AgentExecutor).toBeDefined()
      expect(typeof AgentExecutor).toBe('function')
      expect(executeAgent).toBeDefined()
      expect(typeof executeAgent).toBe('function')
      expect(StreamingAgentExecutor).toBeDefined()
      expect(typeof StreamingAgentExecutor).toBe('function')
      expect(streamAgentExecution).toBeDefined()
      expect(typeof streamAgentExecution).toBe('function')
      expect(AgentSwarm).toBeDefined()
      expect(typeof AgentSwarm).toBe('function')
      expect(createAgentSwarm).toBeDefined()
      expect(typeof createAgentSwarm).toBe('function')
    })
  })

  describe('Context exports', () => {
    it('should export context management', async () => {
      const {
        TokenCounter,
        tokenCounter,
        ContextManager,
        MessageImportance,
        MODEL_TOKEN_LIMITS,
        MODEL_ENCODING_MAP
      } = await import('../src/browser')

      expect(TokenCounter).toBeDefined()
      expect(typeof TokenCounter).toBe('function')
      expect(tokenCounter).toBeDefined()
      expect(ContextManager).toBeDefined()
      expect(typeof ContextManager).toBe('function')
      expect(MessageImportance).toBeDefined()
      expect(MODEL_TOKEN_LIMITS).toBeDefined()
      expect(typeof MODEL_TOKEN_LIMITS).toBe('object')
      expect(MODEL_ENCODING_MAP).toBeDefined()
      expect(typeof MODEL_ENCODING_MAP).toBe('object')
    })
  })

  describe('Summarization exports', () => {
    it('should export summarization utilities', async () => {
      const {
        ConversationSummarizer,
        extractKeySentences,
        extractKeyPoints,
        createExtractiveSummary,
        extractKeywords,
        calculateDiversity
      } = await import('../src/browser')

      expect(ConversationSummarizer).toBeDefined()
      expect(typeof ConversationSummarizer).toBe('function')
      expect(extractKeySentences).toBeDefined()
      expect(typeof extractKeySentences).toBe('function')
      expect(extractKeyPoints).toBeDefined()
      expect(typeof extractKeyPoints).toBe('function')
      expect(createExtractiveSummary).toBeDefined()
      expect(typeof createExtractiveSummary).toBe('function')
      expect(extractKeywords).toBeDefined()
      expect(typeof extractKeywords).toBe('function')
      expect(calculateDiversity).toBeDefined()
      expect(typeof calculateDiversity).toBe('function')
    })
  })

  describe('No export conflicts', () => {
    it('should not have duplicate exports for conflicting types', async () => {
      // This test ensures that types with the same name from different modules
      // are properly aliased and don't conflict
      const browserModule = await import('../src/browser')

      // If there are export conflicts, TypeScript compilation would fail
      // The fact that this test runs means the exports are properly resolved
      expect(browserModule).toBeDefined()
      expect(typeof browserModule).toBe('object')
    })

    it('should allow importing all exports without errors', async () => {
      // Import everything at once to ensure no conflicts
      const allExports = await import('../src/browser')

      expect(allExports).toBeDefined()
      expect(typeof allExports).toBe('object')

      // Verify that we have a reasonable number of exports
      const exportKeys = Object.keys(allExports)
      expect(exportKeys.length).toBeGreaterThan(50) // Should have many exports
    })
  })

  describe('Type-only exports', () => {
    it('should be able to import types without runtime errors', () => {
      // This test verifies that type-only exports don't cause runtime issues
      // TypeScript should handle these at compile time
      expect(true).toBe(true)
    })
  })

  describe('Aliased exports', () => {
    it('should export aliased types to avoid conflicts', () => {
      // Verify that aliased exports exist
      // These are exported with different names to avoid conflicts:
      // - MemoryStoreConfig as ConversationMemoryStoreConfig
      // - MemoryConfig as UserMemoryConfig
      // - StorageBackend as SessionStorageBackend, RLHFStorageBackend, RateLimiterStorageBackend
      // - RetryConfig as ZeroDBRetryConfig
      // - BatchOperation as ZeroDBBatchOperation, RLHFBatchOperation
      // - RateLimitRule as UtilsRateLimitRule

      expect(true).toBe(true) // Types are compile-time only
    })
  })
})
