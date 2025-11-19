/**
 * Tests for createStore factory
 */

import { describe, it, expect } from 'vitest'
import {
  createStore,
  isMemoryStore,
  isRedisStore,
  isZeroDBStore,
} from '../../src/store/createStore'
import { MemoryStore } from '../../src/store/MemoryStore'
import { RedisStore } from '../../src/store/RedisStore'
import { ZeroDBStore } from '../../src/store/ZeroDBStore'

describe('createStore', () => {
  describe('Memory store creation', () => {
    it('should create a memory store', () => {
      const store = createStore({ type: 'memory' })

      expect(store).toBeInstanceOf(MemoryStore)
    })

    it('should create a memory store with config', () => {
      const store = createStore({
        type: 'memory',
        maxConversations: 100,
        defaultTTL: 3600,
        namespace: 'test',
      })

      expect(store).toBeInstanceOf(MemoryStore)
    })
  })

  describe('Redis store creation', () => {
    it('should create a redis store with host', () => {
      const store = createStore({
        type: 'redis',
        host: 'localhost',
      })

      expect(store).toBeInstanceOf(RedisStore)
    })

    it('should create a redis store with URL', () => {
      const store = createStore({
        type: 'redis',
        url: 'redis://localhost:6379',
      })

      expect(store).toBeInstanceOf(RedisStore)
    })

    it('should create a redis store with full config', () => {
      const store = createStore({
        type: 'redis',
        host: 'localhost',
        port: 6379,
        password: 'secret',
        db: 1,
        keyPrefix: 'myapp',
        defaultTTL: 7200,
      })

      expect(store).toBeInstanceOf(RedisStore)
    })
  })

  describe('ZeroDB store creation', () => {
    it('should create a zerodb store', () => {
      const store = createStore({
        type: 'zerodb',
        projectId: 'test-project',
        apiKey: 'test-api-key',
      })

      expect(store).toBeInstanceOf(ZeroDBStore)
    })

    it('should create a zerodb store with full config', () => {
      const store = createStore({
        type: 'zerodb',
        projectId: 'test-project',
        apiKey: 'test-api-key',
        tableName: 'conversations',
        defaultTTL: 3600,
        namespace: 'test',
      })

      expect(store).toBeInstanceOf(ZeroDBStore)
    })
  })

  describe('Validation', () => {
    it('should throw error for invalid config type', () => {
      expect(() => createStore(null as any)).toThrow(
        'Store configuration must be an object'
      )

      expect(() => createStore(undefined as any)).toThrow(
        'Store configuration must be an object'
      )

      expect(() => createStore('memory' as any)).toThrow(
        'Store configuration must be an object'
      )
    })

    it('should throw error for missing type', () => {
      expect(() => createStore({} as any)).toThrow(
        'Store configuration must include a "type" field'
      )
    })

    it('should throw error for invalid type', () => {
      expect(() => createStore({ type: 'invalid' } as any)).toThrow(
        'Invalid store type: invalid'
      )
    })

    it('should throw error for invalid defaultTTL', () => {
      expect(() =>
        createStore({ type: 'memory', defaultTTL: -1 })
      ).toThrow('defaultTTL must be a non-negative number')

      expect(() =>
        createStore({ type: 'memory', defaultTTL: 'invalid' as any })
      ).toThrow('defaultTTL must be a non-negative number')
    })

    it('should throw error for invalid namespace', () => {
      expect(() =>
        createStore({ type: 'memory', namespace: '' })
      ).toThrow('namespace must be a non-empty string')

      expect(() =>
        createStore({ type: 'memory', namespace: 123 as any })
      ).toThrow('namespace must be a non-empty string')
    })
  })

  describe('Memory store validation', () => {
    it('should throw error for invalid maxConversations', () => {
      expect(() =>
        createStore({ type: 'memory', maxConversations: 0 })
      ).toThrow('maxConversations must be a positive number')

      expect(() =>
        createStore({ type: 'memory', maxConversations: -1 })
      ).toThrow('maxConversations must be a positive number')

      expect(() =>
        createStore({ type: 'memory', maxConversations: 'invalid' as any })
      ).toThrow('maxConversations must be a positive number')
    })
  })

  describe('Redis store validation', () => {
    it('should throw error for missing host and url', () => {
      expect(() => createStore({ type: 'redis' })).toThrow(
        'Redis configuration must include either "url" or "host"'
      )
    })

    it('should throw error for invalid port', () => {
      expect(() =>
        createStore({ type: 'redis', host: 'localhost', port: 0 })
      ).toThrow('Redis port must be between 1 and 65535')

      expect(() =>
        createStore({ type: 'redis', host: 'localhost', port: 70000 })
      ).toThrow('Redis port must be between 1 and 65535')

      expect(() =>
        createStore({ type: 'redis', host: 'localhost', port: 'invalid' as any })
      ).toThrow('Redis port must be between 1 and 65535')
    })

    it('should throw error for invalid db', () => {
      expect(() =>
        createStore({ type: 'redis', host: 'localhost', db: -1 })
      ).toThrow('Redis db must be a non-negative number')

      expect(() =>
        createStore({ type: 'redis', host: 'localhost', db: 'invalid' as any })
      ).toThrow('Redis db must be a non-negative number')
    })
  })

  describe('ZeroDB store validation', () => {
    it('should throw error for missing projectId', () => {
      expect(() =>
        createStore({ type: 'zerodb', apiKey: 'test-key' } as any)
      ).toThrow('ZeroDB configuration must include "projectId"')
    })

    it('should throw error for empty projectId', () => {
      expect(() =>
        createStore({ type: 'zerodb', projectId: '', apiKey: 'test-key' })
      ).toThrow('ZeroDB configuration must include "projectId"')
    })

    it('should throw error for missing apiKey', () => {
      expect(() =>
        createStore({ type: 'zerodb', projectId: 'test-project' } as any)
      ).toThrow('ZeroDB configuration must include "apiKey"')
    })

    it('should throw error for empty apiKey', () => {
      expect(() =>
        createStore({ type: 'zerodb', projectId: 'test-project', apiKey: '' })
      ).toThrow('ZeroDB configuration must include "apiKey"')
    })

    it('should throw error for invalid tableName', () => {
      expect(() =>
        createStore({
          type: 'zerodb',
          projectId: 'test-project',
          apiKey: 'test-key',
          tableName: '',
        })
      ).toThrow('ZeroDB tableName must be a non-empty string')

      expect(() =>
        createStore({
          type: 'zerodb',
          projectId: 'test-project',
          apiKey: 'test-key',
          tableName: 123 as any,
        })
      ).toThrow('ZeroDB tableName must be a non-empty string')
    })
  })

  describe('Type guards', () => {
    it('should correctly identify MemoryStore', () => {
      const memoryStore = createStore({ type: 'memory' })
      const redisStore = createStore({ type: 'redis', host: 'localhost' })
      const zerodbStore = createStore({
        type: 'zerodb',
        projectId: 'test',
        apiKey: 'key',
      })

      expect(isMemoryStore(memoryStore)).toBe(true)
      expect(isMemoryStore(redisStore)).toBe(false)
      expect(isMemoryStore(zerodbStore)).toBe(false)
    })

    it('should correctly identify RedisStore', () => {
      const memoryStore = createStore({ type: 'memory' })
      const redisStore = createStore({ type: 'redis', host: 'localhost' })
      const zerodbStore = createStore({
        type: 'zerodb',
        projectId: 'test',
        apiKey: 'key',
      })

      expect(isRedisStore(memoryStore)).toBe(false)
      expect(isRedisStore(redisStore)).toBe(true)
      expect(isRedisStore(zerodbStore)).toBe(false)
    })

    it('should correctly identify ZeroDBStore', () => {
      const memoryStore = createStore({ type: 'memory' })
      const redisStore = createStore({ type: 'redis', host: 'localhost' })
      const zerodbStore = createStore({
        type: 'zerodb',
        projectId: 'test',
        apiKey: 'key',
      })

      expect(isZeroDBStore(memoryStore)).toBe(false)
      expect(isZeroDBStore(redisStore)).toBe(false)
      expect(isZeroDBStore(zerodbStore)).toBe(true)
    })

    it('should provide type narrowing', () => {
      const store = createStore({ type: 'memory' })

      if (isMemoryStore(store)) {
        // TypeScript should know this is a MemoryStore
        expect(store.size()).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
