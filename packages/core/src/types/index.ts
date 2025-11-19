/**
 * Core types for AI Kit
 */

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface Usage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost?: number
  latency?: number
  model?: string
  cacheHit?: boolean
}

export interface StreamConfig {
  endpoint: string
  model?: string
  systemPrompt?: string
  onToken?: (token: string) => void
  onCost?: (usage: Usage) => void
  onError?: (error: Error) => void
  retry?: RetryConfig
  cache?: boolean | CacheConfig
  timeout?: number
  headers?: Record<string, string>
}

export interface RetryConfig {
  maxRetries?: number
  backoff?: 'linear' | 'exponential'
  initialDelay?: number
  maxDelay?: number
}

export interface CacheConfig {
  enabled: boolean
  ttl?: number
  storage?: 'memory' | 'redis'
}

export interface StreamResult {
  messages: Message[]
  isStreaming: boolean
  error: Error | null
  send: (content: string) => Promise<void>
  reset: () => void
  retry: () => Promise<void>
  usage: Usage
}

export interface StreamEvent {
  type: 'token' | 'error' | 'done' | 'metadata'
  data: any
  timestamp: number
}

export type StreamTransport = 'sse' | 'websocket'

export interface StreamOptions {
  transport?: StreamTransport
  reconnect?: boolean
  maxReconnectAttempts?: number
  reconnectDelay?: number
}
