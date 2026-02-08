/**
 * Transport Manager
 * Manages transport lifecycle, connection pooling, and health monitoring
 */

import { EventEmitter } from 'events'
import { SSETransport } from './SSE'
import { WebSocketTransport } from './WebSocket'
import { HTTPStreamTransport } from './HTTPStream'
import type {
  Transport,
  TransportType,
  TransportConfig,
  TransportMetrics,
  TransportHealth,
  TransportState,
} from './types'

/**
 * Transport pool configuration
 */
export interface TransportPoolConfig {
  /** Maximum number of transports to pool */
  maxPoolSize?: number

  /** Maximum idle time before closing transport (ms) */
  maxIdleTime?: number

  /** Health check interval (ms) */
  healthCheckInterval?: number

  /** Enable automatic cleanup of closed transports */
  autoCleanup?: boolean

  /** Debug mode */
  debug?: boolean
}

/**
 * Transport Manager
 * Centralized management of all transports
 */
export class TransportManager extends EventEmitter {
  private transports: Map<string, Transport> = new Map()
  private config: Required<TransportPoolConfig>
  private healthCheckInterval?: NodeJS.Timeout
  private cleanupInterval?: NodeJS.Timeout

  constructor(config: TransportPoolConfig = {}) {
    super()

    this.config = {
      maxPoolSize: 100,
      maxIdleTime: 300000, // 5 minutes
      healthCheckInterval: 30000, // 30 seconds
      autoCleanup: true,
      debug: false,
      ...config,
    }

    if (this.config.autoCleanup) {
      this.startAutoCleanup()
    }

    if (this.config.healthCheckInterval > 0) {
      this.startHealthChecks()
    }
  }

  /**
   * Create a new transport
   */
  createTransport(type: TransportType, config: TransportConfig): Transport {
    // Check pool size limit
    if (this.transports.size >= this.config.maxPoolSize) {
      this.log('Pool size limit reached, cleaning up idle transports', 'warn')
      this.cleanupIdleTransports()

      if (this.transports.size >= this.config.maxPoolSize) {
        throw new Error(
          `Transport pool size limit reached (${this.config.maxPoolSize})`
        )
      }
    }

    // Create transport based on type
    let transport: Transport

    switch (type) {
      case 'sse':
        transport = new SSETransport(config)
        break

      case 'websocket':
        transport = new WebSocketTransport(config)
        break

      case 'http-stream':
        transport = new HTTPStreamTransport(config)
        break

      default:
        throw new Error(`Unknown transport type: ${type}`)
    }

    // Store in pool
    this.transports.set(transport.id, transport)

    // Setup event forwarding
    this.setupTransportEvents(transport)

    this.log(`Created ${type} transport: ${transport.id}`)
    this.emit('transport:created', { id: transport.id, type })

    return transport
  }

  /**
   * Get transport by ID
   */
  getTransport(id: string): Transport | undefined {
    return this.transports.get(id)
  }

  /**
   * Get all transports
   */
  getAllTransports(): Transport[] {
    return Array.from(this.transports.values())
  }

  /**
   * Get transports by type
   */
  getTransportsByType(type: TransportType): Transport[] {
    return this.getAllTransports().filter((t) => t.type === type)
  }

  /**
   * Get transports by state
   */
  getTransportsByState(state: TransportState): Transport[] {
    return this.getAllTransports().filter((t) => t.getState() === state)
  }

  /**
   * Close specific transport
   */
  closeTransport(id: string): void {
    const transport = this.transports.get(id)
    if (transport) {
      transport.close()
      this.transports.delete(id)
      this.log(`Closed transport: ${id}`)
      this.emit('transport:closed', { id })
    }
  }

  /**
   * Close all transports
   */
  closeAll(): void {
    this.log(`Closing all transports (${this.transports.size})`)

    for (const transport of this.transports.values()) {
      try {
        transport.close()
      } catch (error) {
        this.log(`Error closing transport ${transport.id}: ${error}`, 'error')
      }
    }

    this.transports.clear()
    this.emit('transports:all-closed')
  }

  /**
   * Get aggregated metrics for all transports
   */
  getMetrics(): TransportMetrics[] {
    return this.getAllTransports().map((t) => t.getMetrics())
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const transports = this.getAllTransports()

    const byType = transports.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byState = transports.reduce((acc, t) => {
      const state = t.getState()
      acc[state] = (acc[state] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const metrics = this.getMetrics()
    const totalMessages = metrics.reduce(
      (sum, m) => sum + m.messagesSent + m.messagesReceived,
      0
    )
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0)

    return {
      totalTransports: transports.length,
      byType,
      byState,
      totalMessages,
      totalErrors,
      poolUtilization: (transports.length / this.config.maxPoolSize) * 100,
    }
  }

  /**
   * Get health status for all transports
   */
  getHealth(): Record<string, TransportHealth> {
    const health: Record<string, TransportHealth> = {}

    for (const transport of this.transports.values()) {
      const metrics = transport.getMetrics()

      health[transport.id] = {
        healthy: transport.isConnected(),
        state: transport.getState(),
        uptime: metrics.connectionDuration,
        consecutiveErrors: metrics.errors,
      }
    }

    return health
  }

  /**
   * Cleanup idle transports
   */
  private cleanupIdleTransports(): void {
    const now = Date.now()
    const toRemove: string[] = []

    for (const [id, transport] of this.transports.entries()) {
      const metrics = transport.getMetrics()
      const state = transport.getState()

      // Remove closed transports
      if (state === 'closed') {
        toRemove.push(id)
        continue
      }

      // Remove idle transports
      if (
        metrics.connectedAt &&
        now - metrics.connectedAt > this.config.maxIdleTime &&
        metrics.messagesReceived === 0 &&
        metrics.messagesSent === 0
      ) {
        this.log(`Removing idle transport: ${id}`)
        transport.close()
        toRemove.push(id)
      }
    }

    for (const id of toRemove) {
      this.transports.delete(id)
      this.emit('transport:removed', { id })
    }

    if (toRemove.length > 0) {
      this.log(`Cleaned up ${toRemove.length} idle transports`)
    }
  }

  /**
   * Setup event forwarding from transport to manager
   */
  private setupTransportEvents(transport: Transport): void {
    const events = [
      'connecting',
      'connected',
      'reconnecting',
      'event',
      'done',
      'error',
      'closed',
      'backpressure',
      'drain',
    ]

    for (const event of events) {
      transport.on(event, (...args: any[]) => {
        this.emit(`transport:${event}`, {
          id: transport.id,
          type: transport.type,
          ...args[0],
        })
      })
    }

    // Remove transport when closed
    transport.on('closed', () => {
      if (this.config.autoCleanup) {
        setTimeout(() => {
          if (transport.getState() === 'closed') {
            this.transports.delete(transport.id)
            this.emit('transport:removed', { id: transport.id })
          }
        }, 5000) // Delay to allow event processing
      }
    })
  }

  /**
   * Start automatic cleanup interval
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleTransports()
    }, 60000) // Every minute
  }

  /**
   * Start health check interval
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      const health = this.getHealth()
      const unhealthy = Object.entries(health).filter(([, h]) => !h.healthy)

      if (unhealthy.length > 0) {
        this.log(`Health check: ${unhealthy.length} unhealthy transports`, 'warn')
        this.emit('health:unhealthy', unhealthy)
      }

      this.emit('health:check', health)
    }, this.config.healthCheckInterval)
  }

  /**
   * Stop all intervals and cleanup
   */
  destroy(): void {
    this.log('Destroying transport manager')

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.closeAll()
    this.removeAllListeners()
  }

  /**
   * Debug logging
   */
  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'debug'): void {
    if (this.config.debug) {
      console[level](`[TransportManager] ${message}`)
    }
  }
}
