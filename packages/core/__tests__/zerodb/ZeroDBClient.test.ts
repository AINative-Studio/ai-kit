/**
 * Comprehensive test suite for ZeroDB CRUD operations
 *
 * Tests cover:
 * - Connection management
 * - CRUD operations
 * - Query builder
 * - Transactions
 * - Batch operations
 * - Error handling
 * - Connection pooling
 * - Health checks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ZeroDBClient, createZeroDBClient } from '../../src/zerodb/ZeroDBClient'
import { QueryBuilder } from '../../src/zerodb/QueryBuilder'
import {
  ZeroDBConfig,
  CRUDResult,
  QueryResult,
  TransactionResult,
  HealthStatus,
} from '../../src/zerodb/types'

describe('ZeroDBClient', () => {
  let client: ZeroDBClient
  let config: ZeroDBConfig

  beforeEach(() => {
    config = {
      projectId: 'test-project',
      apiKey: 'test-api-key',
      baseUrl: 'https://api.test.zerodb.io',
      debug: false,
    }
    client = new ZeroDBClient(config)
  })

  afterEach(async () => {
    await client.close()
  })

  describe('Connection Management', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(ZeroDBClient)
      expect(client.isClosed()).toBe(false)
    })

    it('should create client using factory function', () => {
      const factoryClient = createZeroDBClient(config)
      expect(factoryClient).toBeInstanceOf(ZeroDBClient)
    })

    it('should apply default configuration', () => {
      const clientConfig = client.getConfig()
      expect(clientConfig.baseUrl).toBe('https://api.test.zerodb.io')
      expect(clientConfig.timeout).toBe(30000)
      expect(clientConfig.pool?.min).toBe(2)
      expect(clientConfig.pool?.max).toBe(10)
    })

    it('should allow custom pool configuration', () => {
      const customClient = new ZeroDBClient({
        ...config,
        pool: {
          min: 5,
          max: 20,
          idleTimeout: 60000,
        },
      })
      const clientConfig = customClient.getConfig()
      expect(clientConfig.pool?.min).toBe(5)
      expect(clientConfig.pool?.max).toBe(20)
      expect(clientConfig.pool?.idleTimeout).toBe(60000)
    })

    it('should emit connect event on initialization', (done) => {
      const newClient = new ZeroDBClient(config)
      newClient.on('connect', () => {
        expect(true).toBe(true)
        done()
      })
    })

    it('should close connection successfully', async () => {
      await client.close()
      expect(client.isClosed()).toBe(true)
    })

    it('should emit disconnect event on close', async () => {
      const newClient = new ZeroDBClient(config)
      let disconnected = false
      newClient.on('disconnect', () => {
        disconnected = true
      })
      await newClient.close()
      expect(disconnected).toBe(true)
    })

    it('should not allow operations after close', async () => {
      await client.close()
      await expect(client.insert('users', { name: 'Test' })).rejects.toThrow('Client is closed')
    })

    it('should handle multiple close calls', async () => {
      await client.close()
      await client.close() // Should not throw
      expect(client.isClosed()).toBe(true)
    })
  })

  describe('Insert Operations', () => {
    it('should insert single record', async () => {
      const data = { name: 'John Doe', email: 'john@example.com' }
      const result = await client.insert('users', data)

      expect(result.success).toBe(true)
      expect(result.rowsAffected).toBe(1)
    })

    it('should insert multiple records', async () => {
      const data = [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
      ]
      const result = await client.insert('users', data)

      expect(result.success).toBe(true)
      expect(result.rowsAffected).toBe(2)
    })

    it('should insert with returning option', async () => {
      const data = { name: 'John Doe', email: 'john@example.com' }
      const result = await client.insert('users', data, { returning: true })

      expect(result.success).toBe(true)
      expect(result.rows).toBeDefined()
    })

    it('should handle insert with onConflict ignore', async () => {
      const data = { id: 1, name: 'John Doe' }
      const result = await client.insert('users', data, {
        onConflict: {
          target: ['id'],
          action: 'ignore',
        },
      })

      expect(result.success).toBe(true)
    })

    it('should handle insert with onConflict update', async () => {
      const data = { id: 1, name: 'John Doe Updated' }
      const result = await client.insert('users', data, {
        onConflict: {
          target: ['id'],
          action: 'update',
          updateFields: ['name'],
        },
      })

      expect(result.success).toBe(true)
    })

    it('should insert empty array', async () => {
      const result = await client.insert('users', [])
      expect(result.rowsAffected).toBe(0)
    })
  })

  describe('Select Operations', () => {
    it('should select all records', async () => {
      const result = await client.select('users')

      expect(result.rows).toBeDefined()
      expect(Array.isArray(result.rows)).toBe(true)
    })

    it('should select with field selection', async () => {
      const result = await client.select('users', {
        select: ['id', 'name', 'email'],
      })

      expect(result.rows).toBeDefined()
    })

    it('should select with filter', async () => {
      const result = await client.select('users', {
        filter: {
          condition: {
            field: 'status',
            operator: 'eq',
            value: 'active',
          },
        },
      })

      expect(result.rows).toBeDefined()
    })

    it('should select with sorting', async () => {
      const result = await client.select('users', {
        sort: [
          { field: 'created_at', direction: 'desc' },
          { field: 'name', direction: 'asc' },
        ],
      })

      expect(result.rows).toBeDefined()
    })

    it('should select with pagination', async () => {
      const result = await client.select('users', {
        limit: 10,
        offset: 20,
      })

      expect(result.rows).toBeDefined()
    })

    it('should select with count', async () => {
      const result = await client.select('users', {
        count: true,
      })

      expect(result.count).toBeDefined()
      expect(typeof result.count).toBe('number')
    })

    it('should select with joins', async () => {
      const result = await client.select('users', {
        joins: [
          {
            table: 'profiles',
            type: 'left',
            on: { left: 'id', right: 'user_id' },
          },
        ],
      })

      expect(result.rows).toBeDefined()
    })

    it('should select with complex filter', async () => {
      const result = await client.select('users', {
        filter: {
          and: [
            {
              condition: {
                field: 'age',
                operator: 'gte',
                value: 18,
              },
            },
            {
              or: [
                {
                  condition: {
                    field: 'status',
                    operator: 'eq',
                    value: 'active',
                  },
                },
                {
                  condition: {
                    field: 'status',
                    operator: 'eq',
                    value: 'pending',
                  },
                },
              ],
            },
          ],
        },
      })

      expect(result.rows).toBeDefined()
    })
  })

  describe('Update Operations', () => {
    it('should update records with filter', async () => {
      const result = await client.update(
        'users',
        { status: 'inactive' },
        {
          filter: {
            condition: {
              field: 'id',
              operator: 'eq',
              value: 1,
            },
          },
        }
      )

      expect(result.success).toBe(true)
      expect(result.rowsAffected).toBeGreaterThanOrEqual(0)
    })

    it('should require filter for update', async () => {
      await expect(
        client.update('users', { status: 'inactive' })
      ).rejects.toThrow('Update requires a filter')
    })

    it('should update with returning option', async () => {
      const result = await client.update(
        'users',
        { status: 'inactive' },
        {
          filter: {
            condition: {
              field: 'id',
              operator: 'eq',
              value: 1,
            },
          },
          returning: true,
        }
      )

      expect(result.success).toBe(true)
    })

    it('should update multiple fields', async () => {
      const result = await client.update(
        'users',
        {
          name: 'Updated Name',
          email: 'updated@example.com',
          updated_at: new Date().toISOString(),
        },
        {
          filter: {
            condition: {
              field: 'id',
              operator: 'eq',
              value: 1,
            },
          },
        }
      )

      expect(result.success).toBe(true)
    })
  })

  describe('Delete Operations', () => {
    it('should delete records with filter', async () => {
      const result = await client.delete('users', {
        filter: {
          condition: {
            field: 'id',
            operator: 'eq',
            value: 1,
          },
        },
      })

      expect(result.success).toBe(true)
      expect(result.rowsAffected).toBeGreaterThanOrEqual(0)
    })

    it('should require filter for delete', async () => {
      await expect(client.delete('users')).rejects.toThrow('Delete requires a filter')
    })

    it('should delete with returning option', async () => {
      const result = await client.delete('users', {
        filter: {
          condition: {
            field: 'id',
            operator: 'eq',
            value: 1,
          },
        },
        returning: true,
      })

      expect(result.success).toBe(true)
    })

    it('should delete with complex filter', async () => {
      const result = await client.delete('users', {
        filter: {
          and: [
            {
              condition: {
                field: 'status',
                operator: 'eq',
                value: 'deleted',
              },
            },
            {
              condition: {
                field: 'created_at',
                operator: 'lt',
                value: '2023-01-01',
              },
            },
          ],
        },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Upsert Operations', () => {
    it('should upsert single record', async () => {
      const data = { id: 1, name: 'John Doe', email: 'john@example.com' }
      const result = await client.upsert('users', data)

      expect(result.success).toBe(true)
      expect(result.rowsAffected).toBeGreaterThanOrEqual(1)
    })

    it('should upsert multiple records', async () => {
      const data = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ]
      const result = await client.upsert('users', data)

      expect(result.success).toBe(true)
      expect(result.rowsAffected).toBeGreaterThanOrEqual(2)
    })

    it('should upsert with custom conflict target', async () => {
      const data = { email: 'john@example.com', name: 'John Doe' }
      const result = await client.upsert('users', data, {
        onConflict: {
          target: ['email'],
          action: 'update',
        },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Query Builder', () => {
    it('should create query builder', () => {
      const query = client.query('users')
      expect(query).toBeInstanceOf(QueryBuilder)
    })

    it('should build query with where clause', async () => {
      const query = client.query('users').where('status', 'eq', 'active')
      const result = await query.execute()
      expect(result.rows).toBeDefined()
    })

    it('should chain multiple conditions', async () => {
      const query = client
        .query('users')
        .where('status', 'eq', 'active')
        .and('age', 'gte', 18)
        .orderBy('created_at', 'desc')
        .limit(10)

      const result = await query.execute()
      expect(result.rows).toBeDefined()
    })

    it('should support OR conditions', async () => {
      const query = client
        .query('users')
        .where('status', 'eq', 'active')
        .or('status', 'eq', 'pending')

      const result = await query.execute()
      expect(result.rows).toBeDefined()
    })

    it('should support NOT conditions', async () => {
      const query = client.query('users').not('status', 'eq', 'deleted')

      const result = await query.execute()
      expect(result.rows).toBeDefined()
    })

    it('should select specific fields', async () => {
      const query = client.query('users').select('id', 'name', 'email')

      const result = await query.execute()
      expect(result.rows).toBeDefined()
    })

    it('should support sorting', async () => {
      const query = client.query('users').orderBy('name', 'asc').orderBy('created_at', 'desc')

      const result = await query.execute()
      expect(result.rows).toBeDefined()
    })

    it('should support pagination', async () => {
      const query = client.query('users').limit(20).offset(40)

      const result = await query.execute()
      expect(result.rows).toBeDefined()
    })

    it('should get first result', async () => {
      const result = await client.query('users').where('id', 'eq', 1).first()

      expect(result === null || typeof result === 'object').toBe(true)
    })

    it('should get all results', async () => {
      const results = await client.query('users').where('status', 'eq', 'active').all()

      expect(Array.isArray(results)).toBe(true)
    })

    it('should count results', async () => {
      const count = await client.query('users').where('status', 'eq', 'active').count()

      expect(typeof count).toBe('number')
    })

    it('should support joins', async () => {
      const query = client
        .query('users')
        .join('profiles', { left: 'id', right: 'user_id' }, 'left')

      const result = await query.execute()
      expect(result.rows).toBeDefined()
    })

    it('should support method chaining', () => {
      const query = client
        .query('users')
        .select('id', 'name')
        .where('status', 'eq', 'active')
        .and('age', 'gte', 18)
        .orderBy('created_at', 'desc')
        .limit(10)
        .offset(0)

      expect(query).toBeInstanceOf(QueryBuilder)
    })

    it('should clone query builder', () => {
      const original = client.query('users').where('status', 'eq', 'active')
      const cloned = original.clone()

      expect(cloned).toBeInstanceOf(QueryBuilder)
      expect(cloned).not.toBe(original)
    })

    it('should reset query builder', () => {
      const query = client
        .query('users')
        .where('status', 'eq', 'active')
        .limit(10)
        .reset()

      const options = query.getOptions()
      expect(options.filter).toBeUndefined()
      expect(options.limit).toBeUndefined()
    })

    it('should support paginate helper', async () => {
      const query = client.query('users').paginate(2, 10) // Page 2, 10 per page

      const options = query.getOptions()
      expect(options.limit).toBe(10)
      expect(options.offset).toBe(10)
    })
  })

  describe('Transactions', () => {
    it('should execute transaction successfully', async () => {
      const result = await client.transaction(async (tx) => {
        await tx.insert('users', { name: 'John' })
        await tx.insert('users', { name: 'Jane' })
        return { success: true }
      })

      expect(result.success).toBe(true)
    })

    it('should rollback on error', async () => {
      await expect(
        client.transaction(async (tx) => {
          await tx.insert('users', { name: 'John' })
          throw new Error('Transaction error')
        })
      ).rejects.toThrow('Transaction error')
    })

    it('should emit transaction events', async () => {
      const events: string[] = []

      client.on('transactionStart', (id) => events.push('start'))
      client.on('transactionCommit', (id) => events.push('commit'))

      await client.transaction(async (tx) => {
        await tx.insert('users', { name: 'John' })
      })

      expect(events).toContain('start')
      expect(events).toContain('commit')
    })

    it('should emit rollback event on error', async () => {
      let rolledBack = false

      client.on('transactionRollback', (id) => {
        rolledBack = true
      })

      try {
        await client.transaction(async (tx) => {
          throw new Error('Test error')
        })
      } catch (error) {
        // Expected
      }

      expect(rolledBack).toBe(true)
    })

    it('should support nested transactions', async () => {
      const result = await client.transaction(async (tx1) => {
        await tx1.insert('users', { name: 'User 1' })

        await tx1.transaction(async (tx2) => {
          await tx2.insert('users', { name: 'User 2' })
        })

        return { success: true }
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Batch Operations', () => {
    it('should execute batch insert operations', async () => {
      const result = await client.batch([
        { type: 'insert', table: 'users', data: { name: 'John' } },
        { type: 'insert', table: 'users', data: { name: 'Jane' } },
      ])

      expect(result.success).toBe(true)
      expect(result.operationsExecuted).toBe(2)
    })

    it('should execute mixed batch operations', async () => {
      const result = await client.batch([
        { type: 'insert', table: 'users', data: { name: 'John' } },
        {
          type: 'update',
          table: 'users',
          data: { status: 'active' },
          options: {
            filter: { condition: { field: 'id', operator: 'eq', value: 1 } },
          },
        },
        {
          type: 'delete',
          table: 'users',
          options: {
            filter: { condition: { field: 'id', operator: 'eq', value: 2 } },
          },
        },
      ])

      expect(result.success).toBe(true)
      expect(result.operationsExecuted).toBe(3)
    })

    it('should rollback batch on error', async () => {
      // Mock an error in the second operation
      const originalInsert = client.insert.bind(client)
      let callCount = 0

      client.insert = vi.fn(async (...args) => {
        callCount++
        if (callCount === 2) {
          throw new Error('Batch operation failed')
        }
        return originalInsert(...args)
      }) as any

      await expect(
        client.batch([
          { type: 'insert', table: 'users', data: { name: 'John' } },
          { type: 'insert', table: 'users', data: { name: 'Jane' } },
        ])
      ).rejects.toThrow('Batch operation failed')
    })

    it('should handle empty batch', async () => {
      const result = await client.batch([])

      expect(result.success).toBe(true)
      expect(result.operationsExecuted).toBe(0)
      expect(result.totalRowsAffected).toBe(0)
    })
  })

  describe('Health Checks', () => {
    it('should perform health check', async () => {
      const health = await client.healthCheck()

      expect(health.connected).toBe(true)
      expect(health.responseTime).toBeDefined()
      expect(typeof health.responseTime).toBe('number')
    })

    it('should include pool stats in health check', async () => {
      const health = await client.healthCheck()

      expect(health.pool).toBeDefined()
      expect(health.pool?.total).toBeGreaterThanOrEqual(0)
      expect(health.pool?.active).toBeGreaterThanOrEqual(0)
      expect(health.pool?.idle).toBeGreaterThanOrEqual(0)
    })

    it('should get pool statistics', () => {
      const stats = client.getPoolStats()

      expect(stats.total).toBeGreaterThanOrEqual(0)
      expect(stats.active).toBeGreaterThanOrEqual(0)
      expect(stats.idle).toBeGreaterThanOrEqual(0)
      expect(stats.waiting).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Close the client to simulate connection error
      await client.close()

      await expect(client.insert('users', { name: 'Test' })).rejects.toThrow()
    })

    it('should emit error events', async () => {
      const errorPromise = new Promise<Error>((resolve) => {
        client.on('error', (error) => {
          resolve(error)
        })
      })

      client.emit('error', new Error('Test error'))

      const error = await errorPromise
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('Configuration', () => {
    it('should get configuration without sensitive data', () => {
      const config = client.getConfig()

      expect(config.projectId).toBe('test-project')
      expect(config.baseUrl).toBe('https://api.test.zerodb.io')
      expect(config.apiKey).toBeUndefined() // Should not expose API key
    })

    it('should support custom retry configuration', () => {
      const customClient = new ZeroDBClient({
        ...config,
        retry: {
          maxRetries: 5,
          initialDelay: 500,
          maxDelay: 5000,
          backoffMultiplier: 3,
        },
      })

      const clientConfig = customClient.getConfig()
      expect(clientConfig.retry?.maxRetries).toBe(5)
      expect(clientConfig.retry?.initialDelay).toBe(500)
    })

    it('should support custom timeout', () => {
      const customClient = new ZeroDBClient({
        ...config,
        timeout: 60000,
      })

      const clientConfig = customClient.getConfig()
      expect(clientConfig.timeout).toBe(60000)
    })

    it('should support debug mode', () => {
      const debugClient = new ZeroDBClient({
        ...config,
        debug: true,
      })

      const clientConfig = debugClient.getConfig()
      expect(clientConfig.debug).toBe(true)
    })
  })
})
