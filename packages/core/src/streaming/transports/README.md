# Framework-Agnostic Streaming Transports

Enterprise-grade streaming transport layer for real-time AI applications. Supports SSE, WebSocket, and HTTP Streaming with automatic reconnection, backpressure handling, and connection pooling.

## Features

- **Multiple Protocols**: SSE, WebSocket, HTTP Streaming
- **Framework-Agnostic**: Works with React, Vue, Svelte, Vanilla JS, Node.js
- **Automatic Reconnection**: Exponential backoff with jitter
- **Backpressure Handling**: Built-in flow control and message buffering
- **Connection Pooling**: Centralized lifecycle management
- **Health Monitoring**: Real-time health checks and metrics
- **TypeScript First**: Full type safety

## Quick Start

### Basic SSE Usage

```typescript
import { SSETransport } from '@ainative/ai-kit-core/streaming/transports'

const transport = new SSETransport({
  endpoint: '/api/chat/stream',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Listen for events
transport.on('connected', () => {
  console.log('Connected to stream')
})

transport.on('event', (data) => {
  console.log('Received:', data)
})

transport.on('error', (error) => {
  console.error('Error:', error.error.message)
})

transport.on('done', () => {
  console.log('Stream completed')
})

// Connect
await transport.connect()
```

### Basic WebSocket Usage

```typescript
import { WebSocketTransport } from '@ainative/ai-kit-core/streaming/transports'

const transport = new WebSocketTransport({
  endpoint: 'wss://api.example.com/chat',
  heartbeatInterval: 30000, // 30 second heartbeat
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

await transport.connect()

// Send messages
await transport.send({
  message: 'Hello, AI!',
  model: 'gpt-4'
})

// Receive messages
transport.on('event', (data) => {
  console.log('AI Response:', data)
})
```

### HTTP Streaming with Long-Polling Fallback

```typescript
import { HTTPStreamTransport } from '@ainative/ai-kit-core/streaming/transports'

const transport = new HTTPStreamTransport({
  endpoint: '/api/stream',
  longPolling: true, // Enable fallback
  longPollingInterval: 1000,
  chunkSize: 8192
})

await transport.connect()
```

## Advanced Configuration

### Reconnection Strategy

```typescript
const transport = new SSETransport({
  endpoint: '/api/stream',

  // Reconnection settings
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000, // Initial delay
  backoffMultiplier: 2, // Exponential backoff
  maxReconnectDelay: 30000, // Cap at 30 seconds
  jitter: true, // Add randomness to prevent thundering herd

  // Custom retry logic
  shouldRetry: (error, attempt) => {
    // Don't retry on authentication errors
    if (error.message.includes('401')) return false
    return attempt < 5
  }
})
```

### Backpressure Handling

```typescript
const transport = new WebSocketTransport({
  endpoint: 'wss://api.example.com',

  buffer: {
    maxSize: 1000, // Maximum buffer size
    strategy: 'drop-oldest', // Options: drop-oldest, drop-newest, block, unlimited
    highWaterMark: 800 // Emit backpressure warning at 80%
  }
})

// Monitor backpressure
transport.on('backpressure', (event) => {
  console.warn(`Buffer at ${event.bufferSize}/${event.bufferLimit}`)
  transport.pause() // Pause processing
})

transport.on('drain', () => {
  console.log('Buffer drained, resuming')
  transport.resume()
})
```

### Transport Manager (Connection Pooling)

```typescript
import { TransportManager } from '@ainative/ai-kit-core/streaming/transports'

const manager = new TransportManager({
  maxPoolSize: 100,
  maxIdleTime: 300000, // 5 minutes
  healthCheckInterval: 30000,
  autoCleanup: true,
  debug: true
})

// Create transports
const sseTransport = manager.createTransport('sse', {
  endpoint: '/api/sse'
})

const wsTransport = manager.createTransport('websocket', {
  endpoint: 'wss://api.example.com'
})

// Monitor all transports
manager.on('transport:error', ({ id, error }) => {
  console.error(`Transport ${id} error:`, error)
})

manager.on('health:unhealthy', (unhealthy) => {
  console.warn('Unhealthy transports:', unhealthy)
})

// Get metrics
const summary = manager.getSummary()
console.log('Pool usage:', summary.poolUtilization)
console.log('Total messages:', summary.totalMessages)

// Cleanup
manager.closeAll()
manager.destroy()
```

## Framework Integrations

### React Hook

```typescript
import { useEffect, useState } from 'react'
import { SSETransport } from '@ainative/ai-kit-core/streaming/transports'

function useSSE(endpoint: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const transport = new SSETransport({ endpoint })

    transport.on('connected', () => setConnected(true))
    transport.on('event', (data) => {
      setMessages(prev => [...prev, data])
    })
    transport.on('error', (err) => setError(err.error))
    transport.on('closed', () => setConnected(false))

    transport.connect()

    return () => {
      transport.close()
    }
  }, [endpoint])

  return { messages, connected, error }
}

// Usage in component
function ChatComponent() {
  const { messages, connected } = useSSE('/api/chat/stream')

  return (
    <div>
      {connected ? 'Connected' : 'Disconnected'}
      {messages.map((msg, i) => <div key={i}>{msg.content}</div>)}
    </div>
  )
}
```

### Vue Composable

```typescript
import { ref, onMounted, onUnmounted } from 'vue'
import { WebSocketTransport } from '@ainative/ai-kit-core/streaming/transports'

export function useWebSocket(endpoint: string) {
  const messages = ref<any[]>([])
  const connected = ref(false)
  const error = ref<Error | null>(null)
  let transport: WebSocketTransport | null = null

  const connect = async () => {
    transport = new WebSocketTransport({ endpoint })

    transport.on('connected', () => connected.value = true)
    transport.on('event', (data) => {
      messages.value.push(data)
    })
    transport.on('error', (err) => error.value = err.error)
    transport.on('closed', () => connected.value = false)

    await transport.connect()
  }

  const send = async (data: any) => {
    if (transport) {
      await transport.send(data)
    }
  }

  const disconnect = () => {
    if (transport) {
      transport.close()
      transport = null
    }
  }

  onMounted(connect)
  onUnmounted(disconnect)

  return { messages, connected, error, send, disconnect }
}
```

### Svelte Store

```typescript
import { writable } from 'svelte/store'
import { SSETransport } from '@ainative/ai-kit-core/streaming/transports'

export function createSSEStore(endpoint: string) {
  const { subscribe, set, update } = writable({
    messages: [],
    connected: false,
    error: null
  })

  const transport = new SSETransport({ endpoint })

  transport.on('connected', () => {
    update(state => ({ ...state, connected: true }))
  })

  transport.on('event', (data) => {
    update(state => ({
      ...state,
      messages: [...state.messages, data]
    }))
  })

  transport.on('error', (err) => {
    update(state => ({ ...state, error: err.error }))
  })

  transport.connect()

  return {
    subscribe,
    close: () => transport.close()
  }
}

// Usage in Svelte component
// <script>
//   import { createSSEStore } from './stores'
//   const store = createSSEStore('/api/stream')
// </script>
//
// {#if $store.connected}
//   Connected
// {/if}
```

### Vanilla JavaScript

```typescript
import { WebSocketTransport } from '@ainative/ai-kit-core/streaming/transports'

class ChatClient {
  private transport: WebSocketTransport
  private messageHandlers: ((data: any) => void)[] = []

  constructor(endpoint: string) {
    this.transport = new WebSocketTransport({
      endpoint,
      reconnect: true,
      maxReconnectAttempts: 5
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.transport.on('event', (data) => {
      this.messageHandlers.forEach(handler => handler(data))
    })

    this.transport.on('error', (error) => {
      console.error('Transport error:', error)
    })
  }

  async connect() {
    await this.transport.connect()
  }

  async sendMessage(message: string) {
    await this.transport.send({ message })
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler)
  }

  disconnect() {
    this.transport.close()
  }

  getMetrics() {
    return this.transport.getMetrics()
  }
}

// Usage
const client = new ChatClient('wss://api.example.com/chat')
client.onMessage((data) => {
  console.log('Received:', data)
})
await client.connect()
await client.sendMessage('Hello!')
```

## Events

All transports emit the following events:

### Connection Events

- **`connecting`**: Connection is being established
- **`connected`**: Connection established successfully
- **`reconnecting`**: Attempting to reconnect (includes `ReconnectEvent`)
- **`closed`**: Connection closed

### Data Events

- **`event`**: Data received (includes `TransportEvent`)
- **`done`**: Stream completed

### Error Events

- **`error`**: Error occurred (includes `TransportErrorEvent`)

### Backpressure Events

- **`backpressure`**: Buffer high water mark reached (includes `BackpressureEvent`)
- **`drain`**: Buffer drained below high water mark

## Metrics and Monitoring

```typescript
const metrics = transport.getMetrics()

console.log({
  id: metrics.id,
  type: metrics.type,
  state: metrics.state,
  uptime: metrics.connectionDuration,
  messagesSent: metrics.messagesSent,
  messagesReceived: metrics.messagesReceived,
  errors: metrics.errors,
  reconnectAttempts: metrics.reconnectAttempts,
  bufferSize: metrics.bufferSize,
  avgLatency: metrics.avgLatency
})
```

## Error Handling

```typescript
transport.on('error', (event) => {
  const { error, recoverable, code, context } = event

  if (!recoverable) {
    // Fatal error, don't retry
    console.error('Fatal error:', error.message)
    return
  }

  if (code === 401) {
    // Authentication error
    console.error('Authentication failed')
    return
  }

  // Log context
  console.log('Error context:', {
    state: context?.state,
    attempt: context?.attempt,
    timestamp: context?.timestamp
  })
})
```

## Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { SSETransport } from '@ainative/ai-kit-core/streaming/transports'

describe('SSE Transport', () => {
  it('should connect and receive messages', async () => {
    const transport = new SSETransport({
      endpoint: '/api/stream'
    })

    const onEvent = vi.fn()
    transport.on('event', onEvent)

    await transport.connect()

    expect(transport.isConnected()).toBe(true)
    expect(onEvent).toHaveBeenCalled()

    transport.close()
  })
})
```

## Performance Tuning

### Buffer Configuration

```typescript
// High-throughput scenario
const transport = new WebSocketTransport({
  endpoint: 'wss://api.example.com',
  buffer: {
    maxSize: 10000, // Large buffer
    strategy: 'drop-oldest',
    highWaterMark: 8000
  }
})

// Low-latency scenario
const transport = new WebSocketTransport({
  endpoint: 'wss://api.example.com',
  buffer: {
    maxSize: 100, // Small buffer
    strategy: 'block', // Block when full
    highWaterMark: 50
  }
})
```

### Connection Pooling

```typescript
const manager = new TransportManager({
  maxPoolSize: 1000, // Large pool for high concurrency
  maxIdleTime: 600000, // 10 minutes idle time
  healthCheckInterval: 60000 // Check every minute
})
```

## Security Best Practices

```typescript
// Use TLS/SSL
const transport = new WebSocketTransport({
  endpoint: 'wss://secure.example.com', // wss:// not ws://
  headers: {
    'Authorization': `Bearer ${getSecureToken()}`,
    'X-Client-Version': '1.0.0'
  }
})

// Handle authentication errors
transport.on('error', (event) => {
  if (event.code === 401 || event.code === 403) {
    // Redirect to login or refresh token
    refreshAuthToken().then(() => {
      transport.connect()
    })
  }
})
```

## Troubleshooting

### Connection Issues

```typescript
// Enable debug mode
const transport = new SSETransport({
  endpoint: '/api/stream',
  debug: true // Verbose logging
})

// Monitor connection state
transport.on('connecting', () => console.log('Connecting...'))
transport.on('connected', () => console.log('Connected!'))
transport.on('error', (e) => console.error('Error:', e))
```

### Backpressure Issues

```typescript
// Monitor buffer levels
transport.on('backpressure', (event) => {
  console.warn('Buffer filling up:', {
    size: event.bufferSize,
    limit: event.bufferLimit,
    percentage: (event.bufferSize / event.bufferLimit) * 100
  })
})

// Pause processing when overwhelmed
if (transport.getMetrics().bufferSize > 800) {
  transport.pause()
  processBacklog().then(() => transport.resume())
}
```

### Memory Leaks

```typescript
// Always clean up
useEffect(() => {
  const transport = new SSETransport({ endpoint })
  transport.connect()

  return () => {
    transport.close() // Important!
  }
}, [])

// Use TransportManager for automatic cleanup
const manager = new TransportManager({
  autoCleanup: true,
  maxIdleTime: 300000
})
```

## API Reference

See [types.ts](./types.ts) for complete TypeScript definitions.

## License

MIT
