/**
 * ZeroDB CRUD Client
 *
 * Comprehensive client for performing CRUD operations on ZeroDB with support for:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Query builder with fluent API
 * - Transaction support
 * - Connection pooling
 * - Automatic retries
 * - Health checks
 */

import { EventEmitter } from 'events'
import { QueryBuilder } from './QueryBuilder'
import {
  ZeroDBConfig,
  IZeroDBClient,
  IQueryBuilder,
  InsertOptions,
  QueryOptions,
  UpdateOptions,
  DeleteOptions,
  TransactionOptions,
  BatchOperation,
  CRUDResult,
  QueryResult,
  TransactionResult,
  HealthStatus,
  PoolStats,
  RetryConfig,
  ZeroDBEvents,
} from './types'

/**
 * Connection pool for managing database connections
 */
class ConnectionPool {
  private config: Required<ZeroDBConfig>
  private activeConnections: number = 0
  private idleConnections: number = 0
  private waitingRequests: number = 0

  constructor(config: Required<ZeroDBConfig>) {
    this.config = config
    this.idleConnections = config.pool.min || 0
  }

  async acquire(): Promise<void> {
    if (this.activeConnections >= (this.config.pool.max || 10)) {
      this.waitingRequests++
      await this.waitForConnection()
      this.waitingRequests--
    }

    if (this.idleConnections > 0) {
      this.idleConnections--
    }
    this.activeConnections++
  }

  release(): void {
    if (this.activeConnections > 0) {
      this.activeConnections--
      this.idleConnections++
    }
  }

  private async waitForConnection(): Promise<void> {
    const timeout = this.config.pool.acquireTimeout || 5000
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const interval = setInterval(() => {
        if (this.activeConnections < (this.config.pool.max || 10)) {
          clearInterval(interval)
          resolve()
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          reject(new Error('Connection acquisition timeout'))
        }
      }, 100)
    })
  }

  getStats(): PoolStats {
    return {
      total: this.activeConnections + this.idleConnections,
      active: this.activeConnections,
      idle: this.idleConnections,
      waiting: this.waitingRequests,
    }
  }

  async close(): Promise<void> {
    // Wait for active connections to finish
    while (this.activeConnections > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    this.idleConnections = 0
  }
}

/**
 * ZeroDB Client implementation
 */
export class ZeroDBClient extends EventEmitter implements IZeroDBClient {
  private config: Required<ZeroDBConfig>
  private pool: ConnectionPool
  private closed: boolean = false
  private transactionId: string | null = null

  constructor(config: ZeroDBConfig) {
    super()

    // Set defaults
    this.config = {
      projectId: config.projectId,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.zerodb.io',
      pool: {
        min: config.pool?.min || 2,
        max: config.pool?.max || 10,
        idleTimeout: config.pool?.idleTimeout || 30000,
        acquireTimeout: config.pool?.acquireTimeout || 5000,
        validate: config.pool?.validate ?? true,
      },
      retry: {
        maxRetries: config.retry?.maxRetries || 3,
        initialDelay: config.retry?.initialDelay || 1000,
        maxDelay: config.retry?.maxDelay || 10000,
        backoffMultiplier: config.retry?.backoffMultiplier || 2,
        retryableErrors: config.retry?.retryableErrors || ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
      },
      timeout: config.timeout || 30000,
      debug: config.debug || false,
    }

    this.pool = new ConnectionPool(this.config)
    this.emit('connect')
  }

  /**
   * Execute API request with retry logic
   */
  private async executeRequest<T>(
    operation: string,
    params: any
  ): Promise<T> {
    if (this.closed) {
      throw new Error('Client is closed')
    }

    await this.pool.acquire()

    try {
      const result = await this.retryWithBackoff(async () => {
        const startTime = Date.now()

        // In a real implementation, this would make an HTTP request to ZeroDB API
        // For now, we'll simulate the response
        const response = await this.mockApiCall(operation, params)

        const duration = Date.now() - startTime
        this.emit('query', operation, duration)

        if (this.config.debug) {
          console.log(`[ZeroDB] ${operation} completed in ${duration}ms`)
        }

        return response as T
      })

      return result
    } finally {
      this.pool.release()
    }
  }

  /**
   * Mock API call (to be replaced with actual HTTP requests)
   */
  private async mockApiCall(operation: string, params: any): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100))

    // Mock responses based on operation
    switch (operation) {
      case 'insert':
        return {
          success: true,
          rowsAffected: Array.isArray(params.data) ? params.data.length : 1,
          rows: params.options?.returning ? params.data : undefined,
        }

      case 'select':
        return {
          rows: [],
          count: 0,
        }

      case 'update':
        return {
          success: true,
          rowsAffected: 0,
          rows: params.options?.returning ? [] : undefined,
        }

      case 'delete':
        return {
          success: true,
          rowsAffected: 0,
          rows: params.options?.returning ? [] : undefined,
        }

      case 'healthCheck':
        return {
          connected: true,
          responseTime: 10,
          pool: this.pool.getStats(),
        }

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      const isRetryable = this.isRetryableError(error)
      const shouldRetry = attempt < this.config.retry.maxRetries && isRetryable

      if (!shouldRetry) {
        throw error
      }

      const delay = Math.min(
        this.config.retry.initialDelay * Math.pow(this.config.retry.backoffMultiplier, attempt),
        this.config.retry.maxDelay
      )

      if (this.config.debug) {
        console.log(`[ZeroDB] Retrying after ${delay}ms (attempt ${attempt + 1}/${this.config.retry.maxRetries})`)
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      return this.retryWithBackoff(fn, attempt + 1)
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false

    const errorCode = error.code || error.errno
    return this.config.retry.retryableErrors.includes(errorCode)
  }

  /**
   * Insert records
   */
  async insert<T = any>(
    table: string,
    data: Record<string, any> | Record<string, any>[],
    options?: InsertOptions
  ): Promise<CRUDResult<T>> {
    const result = await this.executeRequest<CRUDResult<T>>('insert', {
      table,
      data,
      options,
      transactionId: this.transactionId,
    })

    return result
  }

  /**
   * Select records
   */
  async select<T = any>(
    table: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const result = await this.executeRequest<QueryResult<T>>('select', {
      table,
      options,
      transactionId: this.transactionId,
    })

    return result
  }

  /**
   * Update records
   */
  async update<T = any>(
    table: string,
    data: Record<string, any>,
    options?: UpdateOptions
  ): Promise<CRUDResult<T>> {
    if (!options?.filter) {
      throw new Error('Update requires a filter to prevent accidental full table updates')
    }

    const result = await this.executeRequest<CRUDResult<T>>('update', {
      table,
      data,
      options,
      transactionId: this.transactionId,
    })

    return result
  }

  /**
   * Delete records
   */
  async delete<T = any>(
    table: string,
    options?: DeleteOptions
  ): Promise<CRUDResult<T>> {
    if (!options?.filter) {
      throw new Error('Delete requires a filter to prevent accidental full table deletion')
    }

    const result = await this.executeRequest<CRUDResult<T>>('delete', {
      table,
      options,
      transactionId: this.transactionId,
    })

    return result
  }

  /**
   * Upsert records (insert or update on conflict)
   */
  async upsert<T = any>(
    table: string,
    data: Record<string, any> | Record<string, any>[],
    options?: InsertOptions
  ): Promise<CRUDResult<T>> {
    // Upsert is implemented as insert with onConflict option
    const upsertOptions: InsertOptions = {
      ...options,
      onConflict: options?.onConflict || {
        target: ['id'],
        action: 'update',
      },
    }

    return this.insert<T>(table, data, upsertOptions)
  }

  /**
   * Execute batch operations
   */
  async batch(operations: BatchOperation[]): Promise<TransactionResult> {
    return this.transaction(async (client) => {
      let totalRowsAffected = 0
      let operationsExecuted = 0

      for (const op of operations) {
        try {
          switch (op.type) {
            case 'insert':
              const insertResult = await client.insert(op.table, op.data!, op.options as InsertOptions)
              totalRowsAffected += insertResult.rowsAffected
              break

            case 'update':
              const updateResult = await client.update(op.table, op.data!, op.options as UpdateOptions)
              totalRowsAffected += updateResult.rowsAffected
              break

            case 'delete':
              const deleteResult = await client.delete(op.table, op.options as DeleteOptions)
              totalRowsAffected += deleteResult.rowsAffected
              break
          }
          operationsExecuted++
        } catch (error) {
          throw new Error(`Batch operation failed at index ${operationsExecuted}: ${error}`)
        }
      }

      return {
        success: true,
        operationsExecuted,
        totalRowsAffected,
      }
    })
  }

  /**
   * Create query builder
   */
  query<T = any>(table: string): IQueryBuilder<T> {
    return new QueryBuilder<T>(table, (tbl, opts) => this.select<T>(tbl, opts))
  }

  /**
   * Execute transaction
   */
  async transaction<T>(
    callback: (client: IZeroDBClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const txId = this.generateTransactionId()
    const previousTxId = this.transactionId

    try {
      this.transactionId = txId
      this.emit('transactionStart', txId)

      if (this.config.debug) {
        console.log(`[ZeroDB] Transaction started: ${txId}`)
      }

      const result = await callback(this)

      this.emit('transactionCommit', txId)

      if (this.config.debug) {
        console.log(`[ZeroDB] Transaction committed: ${txId}`)
      }

      return result
    } catch (error) {
      this.emit('transactionRollback', txId)

      if (this.config.debug) {
        console.log(`[ZeroDB] Transaction rolled back: ${txId}`)
      }

      throw error
    } finally {
      this.transactionId = previousTxId
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check connection health
   */
  async healthCheck(): Promise<HealthStatus> {
    try {
      const startTime = Date.now()
      const result = await this.executeRequest<HealthStatus>('healthCheck', {})
      const responseTime = Date.now() - startTime

      return {
        connected: true,
        responseTime,
        pool: this.pool.getStats(),
      }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        pool: this.pool.getStats(),
      }
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.closed) {
      return
    }

    this.closed = true
    await this.pool.close()
    this.emit('disconnect')

    if (this.config.debug) {
      console.log('[ZeroDB] Connection closed')
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): PoolStats {
    return this.pool.getStats()
  }

  /**
   * Check if client is closed
   */
  isClosed(): boolean {
    return this.closed
  }

  /**
   * Get configuration (excluding sensitive data)
   */
  getConfig(): Partial<ZeroDBConfig> {
    return {
      projectId: this.config.projectId,
      baseUrl: this.config.baseUrl,
      pool: this.config.pool,
      retry: this.config.retry,
      timeout: this.config.timeout,
      debug: this.config.debug,
    }
  }
}

/**
 * Create a new ZeroDB client
 */
export function createZeroDBClient(config: ZeroDBConfig): ZeroDBClient {
  return new ZeroDBClient(config)
}
