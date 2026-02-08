# Quick Start Guide - Streaming Transports

## Installation

```bash
npm install @ainative/ai-kit-core
```

## 30-Second Quick Start

### SSE (Server-Sent Events)

```typescript
import { SSETransport } from '@ainative/ai-kit-core/streaming/transports'

const transport = new SSETransport({ endpoint: '/api/stream' })

transport.on('event', (data) => console.log('Received:', data))
transport.on('error', (err) => console.error('Error:', err))

await transport.connect()
```

### WebSocket

```typescript
import { WebSocketTransport } from '@ainative/ai-kit-core/streaming/transports'

const transport = new WebSocketTransport({
  endpoint: 'wss://api.example.com',
  heartbeatInterval: 30000
})

transport.on('event', (data) => console.log('Received:', data))
await transport.connect()

// Send messages
await transport.send({ message: 'Hello!' })
```

### HTTP Streaming

```typescript
import { HTTPStreamTransport } from '@ainative/ai-kit-core/streaming/transports'

const transport = new HTTPStreamTransport({
  endpoint: '/api/stream',
  longPolling: true // Fallback option
})

transport.on('event', (data) => console.log('Received:', data))
await transport.connect()
```

## Common Configurations

### Production Ready

```typescript
const transport = new SSETransport({
  endpoint: '/api/stream',

  // Auto-reconnection
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  backoffMultiplier: 2,
  jitter: true,

  // Backpressure handling
  buffer: {
    maxSize: 1000,
    strategy: 'drop-oldest',
    highWaterMark: 800
  },

  // Authentication
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },

  // Debug in development
  debug: process.env.NODE_ENV === 'development'
})
```

### With Connection Pooling

```typescript
import { TransportManager } from '@ainative/ai-kit-core/streaming/transports'

const manager = new TransportManager({
  maxPoolSize: 100,
  autoCleanup: true,
  healthCheckInterval: 30000
})

const transport = manager.createTransport('sse', {
  endpoint: '/api/stream'
})

// Get metrics
const summary = manager.getSummary()
console.log('Pool usage:', summary.poolUtilization)
```

## Events Reference

```typescript
transport.on('connecting', () => {})      // Connection starting
transport.on('connected', () => {})       // Connected successfully
transport.on('event', (data) => {})       // Data received
transport.on('done', () => {})            // Stream complete
transport.on('error', (err) => {})        // Error occurred
transport.on('closed', () => {})          // Connection closed
transport.on('backpressure', (evt) => {}) // Buffer filling up
transport.on('drain', () => {})           // Buffer drained
transport.on('reconnecting', (evt) => {}) // Reconnection attempt
```

## React Hook Pattern

```typescript
import { useEffect, useState } from 'react'
import { SSETransport } from '@ainative/ai-kit-core/streaming/transports'

function useSSE(endpoint: string) {
  const [data, setData] = useState<any[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const transport = new SSETransport({ endpoint })

    transport.on('connected', () => setConnected(true))
    transport.on('event', (d) => setData(prev => [...prev, d]))
    transport.on('closed', () => setConnected(false))

    transport.connect()

    return () => transport.close()
  }, [endpoint])

  return { data, connected }
}

// Usage
function MyComponent() {
  const { data, connected } = useSSE('/api/stream')
  return <div>{connected ? 'Connected' : 'Disconnected'}: {data.length} messages</div>
}
```

## Vue Composable Pattern

```typescript
import { ref, onMounted, onUnmounted } from 'vue'
import { WebSocketTransport } from '@ainative/ai-kit-core/streaming/transports'

export function useWebSocket(endpoint: string) {
  const data = ref<any[]>([])
  const connected = ref(false)
  let transport: WebSocketTransport | null = null

  onMounted(async () => {
    transport = new WebSocketTransport({ endpoint })

    transport.on('connected', () => connected.value = true)
    transport.on('event', (d) => data.value.push(d))
    transport.on('closed', () => connected.value = false)

    await transport.connect()
  })

  onUnmounted(() => {
    transport?.close()
  })

  const send = async (msg: any) => {
    await transport?.send(msg)
  }

  return { data, connected, send }
}
```

## Error Handling

```typescript
transport.on('error', (event) => {
  console.error('Error:', event.error.message)
  console.log('Recoverable:', event.recoverable)
  console.log('Code:', event.code)

  // Handle specific errors
  if (event.code === 401) {
    // Authentication error - refresh token
    refreshToken().then(() => transport.connect())
  } else if (!event.recoverable) {
    // Fatal error - give up
    console.error('Fatal error, stopping')
  }
})
```

## Backpressure Management

```typescript
transport.on('backpressure', (event) => {
  console.warn(`Buffer ${event.bufferSize}/${event.bufferLimit}`)

  // Pause processing
  transport.pause()

  // Process backlog
  processBacklog().then(() => {
    transport.resume()
  })
})

transport.on('drain', () => {
  console.log('Buffer drained, normal operation resumed')
})
```

## Metrics and Monitoring

```typescript
// Get transport metrics
const metrics = transport.getMetrics()

console.log({
  id: metrics.id,
  state: metrics.state,
  uptime: metrics.connectionDuration,
  messagesSent: metrics.messagesSent,
  messagesReceived: metrics.messagesReceived,
  errors: metrics.errors,
  bufferSize: metrics.bufferSize,
  avgLatency: metrics.avgLatency
})

// Check connection state
if (transport.isConnected()) {
  console.log('Transport is connected')
}

// Get current state
const state = transport.getState()
// States: 'idle', 'connecting', 'connected', 'reconnecting', 'error', 'closed'
```

## Common Patterns

### Retry Logic

```typescript
const transport = new SSETransport({
  endpoint: '/api/stream',
  shouldRetry: (error, attempt) => {
    // Don't retry on auth errors
    if (error.message.includes('401')) return false

    // Don't retry after 10 attempts
    if (attempt >= 10) return false

    return true
  }
})
```

### Custom Buffering

```typescript
const transport = new WebSocketTransport({
  endpoint: 'wss://api.example.com',
  buffer: {
    maxSize: 10000,      // Large buffer for high throughput
    strategy: 'unlimited', // Never drop messages
    highWaterMark: 8000   // Warn at 80%
  }
})
```

### Environment Detection

```typescript
function createTransport(endpoint: string) {
  // Use WebSocket in browsers, SSE on Node.js
  if (typeof window !== 'undefined' && 'WebSocket' in window) {
    return new WebSocketTransport({ endpoint })
  } else {
    return new SSETransport({ endpoint })
  }
}
```

## Testing

```typescript
import { vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

const mockStream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode('data: {"value":"test"}\n\n'))
    controller.close()
  }
})

;(global.fetch as any).mockResolvedValue({
  ok: true,
  body: mockStream
})

const transport = new SSETransport({ endpoint: '/test' })
await transport.connect()
```

## TypeScript Types

```typescript
import type {
  Transport,
  TransportConfig,
  TransportState,
  TransportEvent,
  TransportMetrics,
  TransportType,
  BufferingStrategy
} from '@ainative/ai-kit-core/streaming/transports'

// Strongly typed event handlers
transport.on('event', (data: TransportEvent) => {
  // data is typed
})

// Type-safe configuration
const config: TransportConfig = {
  endpoint: '/api',
  reconnect: true,
  buffer: {
    maxSize: 1000,
    strategy: 'drop-oldest' // Type checked!
  }
}
```

## Performance Tips

1. **Use Connection Pooling** for multiple streams
2. **Enable Jitter** to prevent thundering herd
3. **Tune Buffer Size** based on message rate
4. **Monitor Metrics** to detect issues early
5. **Use Binary** (WebSocket) for large data
6. **Enable Compression** for text payloads
7. **Cleanup Properly** to prevent memory leaks

## Troubleshooting

### Connection Fails
```typescript
transport.on('error', (e) => console.error(e.error.message))
// Enable debug mode
const transport = new SSETransport({ endpoint: '/api', debug: true })
```

### Memory Growing
```typescript
// Check buffer size
console.log('Buffer:', transport.getMetrics().bufferSize)

// Reduce buffer size
const transport = new SSETransport({
  endpoint: '/api',
  buffer: { maxSize: 100 }
})
```

### Slow Performance
```typescript
// Check latency
const metrics = transport.getMetrics()
console.log('Avg latency:', metrics.avgLatency, 'ms')

// Use WebSocket instead of SSE for bidirectional
const ws = new WebSocketTransport({ endpoint: 'wss://api' })
```

## Next Steps

- Read [Complete Documentation](./README.md)
- See [Examples](./EXAMPLES.md)
- Review [Architecture](../../../../../STREAMING-TRANSPORTS-ARCHITECTURE.md)

## Support

- Issues: https://github.com/AINative-Studio/ai-kit/issues
- Docs: https://ainative.studio/ai-kit
