/**
 * Message buffer implementation for transport backpressure handling
 */

import type { MessageBuffer, TransportEvent, BufferingStrategy } from './types'

/**
 * Default buffer configuration
 */
const DEFAULT_MAX_SIZE = 1000
const DEFAULT_STRATEGY: BufferingStrategy = 'drop-oldest'
const DEFAULT_HIGH_WATER_RATIO = 0.8

/**
 * Circular buffer implementation for message queuing
 */
export class CircularMessageBuffer implements MessageBuffer {
  private buffer: TransportEvent[] = []
  private readonly maxSize: number
  private readonly strategy: BufferingStrategy
  private readonly highWaterMark: number

  constructor(
    maxSize: number = DEFAULT_MAX_SIZE,
    strategy: BufferingStrategy = DEFAULT_STRATEGY,
    highWaterMarkRatio: number = DEFAULT_HIGH_WATER_RATIO
  ) {
    this.maxSize = maxSize
    this.strategy = strategy
    this.highWaterMark = Math.floor(maxSize * highWaterMarkRatio)
  }

  /**
   * Add message to buffer
   * Returns true if message was added, false if dropped
   */
  push(message: TransportEvent): boolean {
    if (this.strategy === 'unlimited') {
      this.buffer.push(message)
      return true
    }

    if (this.buffer.length >= this.maxSize) {
      switch (this.strategy) {
        case 'drop-oldest':
          this.buffer.shift()
          this.buffer.push(message)
          return true

        case 'drop-newest':
          // Don't add the new message
          return false

        case 'block':
          // Don't add, caller should handle backpressure
          return false

        default:
          return false
      }
    }

    this.buffer.push(message)
    return true
  }

  /**
   * Get next message from buffer (FIFO)
   */
  shift(): TransportEvent | undefined {
    return this.buffer.shift()
  }

  /**
   * Get buffer size
   */
  size(): number {
    return this.buffer.length
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.buffer.length === 0
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    if (this.strategy === 'unlimited') {
      return false
    }
    return this.buffer.length >= this.maxSize
  }

  /**
   * Check if above high water mark
   */
  isHighWater(): boolean {
    return this.buffer.length >= this.highWaterMark
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.buffer = []
  }

  /**
   * Get all messages (for inspection)
   */
  getAll(): TransportEvent[] {
    return [...this.buffer]
  }

  /**
   * Get buffer configuration
   */
  getConfig() {
    return {
      maxSize: this.maxSize,
      strategy: this.strategy,
      highWaterMark: this.highWaterMark,
      currentSize: this.buffer.length,
    }
  }
}
