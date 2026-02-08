# Streaming Transports - Complete Examples

## Table of Contents

1. [Simple Chat Application](#simple-chat-application)
2. [Real-time AI Streaming](#real-time-ai-streaming)
3. [Multi-Client Dashboard](#multi-client-dashboard)
4. [Production Setup](#production-setup)
5. [Testing Examples](#testing-examples)

## Simple Chat Application

### Client (React)

```typescript
import { useState, useEffect } from 'react'
import { WebSocketTransport } from '@ainative/ai-kit-core/streaming/transports'

interface Message {
  id: string
  sender: string
  content: string
  timestamp: number
}

export function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [transport, setTransport] = useState<WebSocketTransport | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Initialize transport
    const ws = new WebSocketTransport({
      endpoint: 'wss://your-server.com/chat',
      heartbeatInterval: 30000,
      reconnect: true,
      maxReconnectAttempts: 5,
      buffer: {
        maxSize: 100,
        strategy: 'drop-oldest'
      }
    })

    // Setup event listeners
    ws.on('connected', () => {
      setConnected(true)
      console.log('Connected to chat')
    })

    ws.on('event', (data: Message) => {
      setMessages(prev => [...prev, data])
    })

    ws.on('error', (error) => {
      console.error('Chat error:', error.error.message)
    })

    ws.on('closed', () => {
      setConnected(false)
      console.log('Disconnected from chat')
    })

    // Connect
    ws.connect()
    setTransport(ws)

    // Cleanup
    return () => {
      ws.close()
    }
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || !transport) return

    await transport.send({
      type: 'message',
      content: input,
      sender: 'User'
    })

    setInput('')
  }

  return (
    <div className="chat-container">
      <div className="status">
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button onClick={sendMessage} disabled={!connected}>
          Send
        </button>
      </div>
    </div>
  )
}
```

### Server (Node.js + Express + ws)

```typescript
import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

interface ChatMessage {
  type: string
  content: string
  sender: string
}

// Store connected clients
const clients = new Set<any>()

wss.on('connection', (ws) => {
  console.log('Client connected')
  clients.add(ws)

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message: ChatMessage = JSON.parse(data.toString())

      if (message.type === 'ping') {
        // Respond to heartbeat
        ws.send(JSON.stringify({ type: 'pong' }))
        return
      }

      if (message.type === 'message') {
        // Broadcast to all clients
        const broadcast = {
          id: Date.now().toString(),
          sender: message.sender,
          content: message.content,
          timestamp: Date.now()
        }

        clients.forEach((client) => {
          if (client.readyState === 1) { // OPEN
            client.send(JSON.stringify(broadcast))
          }
        })
      }
    } catch (error) {
      console.error('Invalid message:', error)
    }
  })

  ws.on('close', () => {
    console.log('Client disconnected')
    clients.delete(ws)
  })

  // Send welcome message
  ws.send(JSON.stringify({
    id: Date.now().toString(),
    sender: 'System',
    content: 'Welcome to the chat!',
    timestamp: Date.now()
  }))
})

server.listen(3000, () => {
  console.log('Chat server running on http://localhost:3000')
})
```

## Real-time AI Streaming

### OpenAI Chat Completion Streaming

```typescript
import { SSETransport } from '@ainative/ai-kit-core/streaming/transports'

interface StreamingChatOptions {
  apiKey: string
  model?: string
  messages: Array<{ role: string; content: string }>
  onToken?: (token: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: Error) => void
}

export async function streamChatCompletion(options: StreamingChatOptions) {
  const {
    apiKey,
    model = 'gpt-4',
    messages,
    onToken,
    onComplete,
    onError
  } = options

  let fullResponse = ''

  const transport = new SSETransport({
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    reconnect: false, // OpenAI doesn't support reconnection mid-stream
  })

  transport.on('connected', async () => {
    // Send request
    await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      })
    })
  })

  transport.on('event', (data) => {
    if (data.choices && data.choices[0]?.delta?.content) {
      const token = data.choices[0].delta.content
      fullResponse += token
      onToken?.(token)
    }
  })

  transport.on('done', () => {
    onComplete?.(fullResponse)
    transport.close()
  })

  transport.on('error', (error) => {
    onError?.(error.error)
    transport.close()
  })

  await transport.connect()

  return {
    cancel: () => transport.close(),
    getResponse: () => fullResponse
  }
}

// Usage in React component
function AIChat() {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const askAI = async (question: string) => {
    setLoading(true)
    setResponse('')

    await streamChatCompletion({
      apiKey: process.env.OPENAI_API_KEY!,
      messages: [{ role: 'user', content: question }],
      onToken: (token) => {
        setResponse(prev => prev + token)
      },
      onComplete: () => {
        setLoading(false)
      },
      onError: (error) => {
        console.error('AI Error:', error)
        setLoading(false)
      }
    })
  }

  return (
    <div>
      <button onClick={() => askAI('What is AI?')} disabled={loading}>
        Ask AI
      </button>
      <div className="response">
        {response}
        {loading && <span className="cursor">▋</span>}
      </div>
    </div>
  )
}
```

## Multi-Client Dashboard

### Using Transport Manager for Multiple Connections

```typescript
import {
  TransportManager,
  SSETransport,
  WebSocketTransport
} from '@ainative/ai-kit-core/streaming/transports'

interface DashboardData {
  metrics: any[]
  logs: any[]
  alerts: any[]
  status: any
}

export class Dashboard {
  private manager: TransportManager
  private data: DashboardData = {
    metrics: [],
    logs: [],
    alerts: [],
    status: null
  }
  private listeners: Map<string, Set<Function>> = new Map()

  constructor() {
    this.manager = new TransportManager({
      maxPoolSize: 10,
      healthCheckInterval: 30000,
      autoCleanup: true,
      debug: true
    })

    // Monitor transport health
    this.manager.on('health:unhealthy', (unhealthy) => {
      console.warn('Unhealthy transports:', unhealthy)
    })
  }

  async initialize() {
    // Create metrics stream (SSE)
    const metricsTransport = this.manager.createTransport('sse', {
      endpoint: '/api/metrics/stream'
    })

    metricsTransport.on('event', (data) => {
      this.data.metrics.push(data)
      this.notify('metrics', data)
    })

    await metricsTransport.connect()

    // Create logs stream (WebSocket)
    const logsTransport = this.manager.createTransport('websocket', {
      endpoint: 'wss://api.example.com/logs',
      heartbeatInterval: 30000
    })

    logsTransport.on('event', (data) => {
      this.data.logs.push(data)
      this.notify('logs', data)
    })

    await logsTransport.connect()

    // Create alerts stream (HTTP Stream with long-polling)
    const alertsTransport = this.manager.createTransport('http-stream', {
      endpoint: '/api/alerts/stream',
      longPolling: true,
      longPollingInterval: 5000
    })

    alertsTransport.on('event', (data) => {
      this.data.alerts.push(data)
      this.notify('alerts', data)
    })

    await alertsTransport.connect()

    // Log connection status
    const summary = this.manager.getSummary()
    console.log('Dashboard initialized:', summary)
  }

  // Subscribe to data updates
  subscribe(channel: keyof DashboardData, callback: Function) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(channel)?.delete(callback)
    }
  }

  private notify(channel: keyof DashboardData, data: any) {
    this.listeners.get(channel)?.forEach(callback => callback(data))
  }

  // Get current metrics
  getMetrics() {
    return this.manager.getMetrics()
  }

  // Cleanup
  destroy() {
    this.manager.destroy()
    this.listeners.clear()
  }
}

// Usage in React
function DashboardComponent() {
  const [dashboard] = useState(() => new Dashboard())
  const [metrics, setMetrics] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    dashboard.initialize()

    const unsubMetrics = dashboard.subscribe('metrics', (data: any) => {
      setMetrics(prev => [...prev.slice(-100), data])
    })

    const unsubLogs = dashboard.subscribe('logs', (data: any) => {
      setLogs(prev => [...prev.slice(-50), data])
    })

    const unsubAlerts = dashboard.subscribe('alerts', (data: any) => {
      setAlerts(prev => [...prev, data])
    })

    return () => {
      unsubMetrics()
      unsubLogs()
      unsubAlerts()
      dashboard.destroy()
    }
  }, [])

  return (
    <div className="dashboard">
      <div className="metrics">
        <h2>Metrics ({metrics.length})</h2>
        {/* Render metrics */}
      </div>
      <div className="logs">
        <h2>Logs ({logs.length})</h2>
        {/* Render logs */}
      </div>
      <div className="alerts">
        <h2>Alerts ({alerts.length})</h2>
        {/* Render alerts */}
      </div>
    </div>
  )
}
```

## Production Setup

### With Error Handling and Monitoring

```typescript
import {
  SSETransport,
  TransportManager
} from '@ainative/ai-kit-core/streaming/transports'

class ProductionTransportService {
  private manager: TransportManager
  private errorCallback?: (error: Error) => void
  private metricsCallback?: (metrics: any) => void

  constructor() {
    this.manager = new TransportManager({
      maxPoolSize: 100,
      maxIdleTime: 300000, // 5 minutes
      healthCheckInterval: 30000,
      autoCleanup: true,
      debug: process.env.NODE_ENV === 'development'
    })

    this.setupMonitoring()
  }

  private setupMonitoring() {
    // Monitor all transport errors
    this.manager.on('transport:error', ({ id, error }) => {
      console.error(`Transport ${id} error:`, error)
      this.errorCallback?.(error.error)

      // Send to error tracking (Sentry, etc.)
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(error.error, {
          extra: {
            transportId: id,
            recoverable: error.recoverable,
            code: error.code
          }
        })
      }
    })

    // Monitor transport lifecycle
    this.manager.on('transport:created', ({ id, type }) => {
      console.log(`Transport created: ${type} (${id})`)
    })

    this.manager.on('transport:closed', ({ id }) => {
      console.log(`Transport closed: ${id}`)
    })

    // Health monitoring
    this.manager.on('health:check', (health) => {
      const unhealthyCount = Object.values(health).filter(
        h => !h.healthy
      ).length

      if (unhealthyCount > 0) {
        console.warn(`${unhealthyCount} unhealthy transports`)
      }

      // Send metrics
      this.metricsCallback?.({
        totalTransports: Object.keys(health).length,
        unhealthyTransports: unhealthyCount,
        timestamp: Date.now()
      })
    })

    // Periodic metrics reporting
    setInterval(() => {
      const summary = this.manager.getSummary()
      console.log('Transport Summary:', summary)

      // Send to monitoring service
      this.metricsCallback?.(summary)
    }, 60000) // Every minute
  }

  createSSE(endpoint: string, config?: any) {
    return this.manager.createTransport('sse', {
      endpoint,
      reconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      backoffMultiplier: 2,
      maxReconnectDelay: 30000,
      jitter: true,
      buffer: {
        maxSize: 1000,
        strategy: 'drop-oldest',
        highWaterMark: 800
      },
      ...config
    })
  }

  createWebSocket(endpoint: string, config?: any) {
    return this.manager.createTransport('websocket', {
      endpoint,
      heartbeatInterval: 30000,
      reconnect: true,
      maxReconnectAttempts: 5,
      buffer: {
        maxSize: 1000,
        strategy: 'drop-oldest'
      },
      ...config
    })
  }

  onError(callback: (error: Error) => void) {
    this.errorCallback = callback
  }

  onMetrics(callback: (metrics: any) => void) {
    this.metricsCallback = callback
  }

  destroy() {
    this.manager.destroy()
  }
}

// Singleton instance
export const transportService = new ProductionTransportService()

// Usage
export function useProductionSSE(endpoint: string) {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const transport = transportService.createSSE(endpoint)

    transport.on('event', (event) => {
      setData(prev => [...prev, event])
    })

    transport.on('error', (err) => {
      setError(err.error)
    })

    transport.connect()

    return () => {
      transport.close()
    }
  }, [endpoint])

  return { data, error }
}
```

## Testing Examples

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SSETransport } from '@ainative/ai-kit-core/streaming/transports'

describe('SSE Transport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('should connect and receive messages', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('data: {"type":"token","value":"Hello"}\n\n')
        )
        controller.close()
      }
    })

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      body: mockStream
    })

    const transport = new SSETransport({
      endpoint: '/api/stream'
    })

    const events: any[] = []
    transport.on('event', (data) => events.push(data))

    await transport.connect()

    expect(events).toHaveLength(1)
    expect(events[0]).toEqual({ type: 'token', value: 'Hello' })

    transport.close()
  })

  it('should handle backpressure', async () => {
    const transport = new SSETransport({
      endpoint: '/api/stream',
      buffer: {
        maxSize: 10,
        strategy: 'drop-oldest',
        highWaterMark: 8
      }
    })

    const backpressureEvents: any[] = []
    transport.on('backpressure', (event) => {
      backpressureEvents.push(event)
    })

    // Pause to trigger backpressure
    transport.pause()

    // Send many messages
    for (let i = 0; i < 15; i++) {
      transport['bufferMessage']({ value: i })
    }

    expect(backpressureEvents.length).toBeGreaterThan(0)
    expect(transport.getMetrics().bufferSize).toBe(10) // Max size

    transport.close()
  })
})
```

### Integration Tests

```typescript
import { describe, it, expect } from 'vitest'
import { TransportManager } from '@ainative/ai-kit-core/streaming/transports'

describe('Transport Manager Integration', () => {
  it('should manage multiple transports', async () => {
    const manager = new TransportManager({
      maxPoolSize: 5,
      autoCleanup: true
    })

    // Create multiple transports
    const sse = manager.createTransport('sse', {
      endpoint: '/api/sse'
    })

    const ws = manager.createTransport('websocket', {
      endpoint: 'wss://api.example.com'
    })

    const summary = manager.getSummary()

    expect(summary.totalTransports).toBe(2)
    expect(summary.byType.sse).toBe(1)
    expect(summary.byType.websocket).toBe(1)

    // Cleanup
    manager.closeAll()
    manager.destroy()
  })
})
```

---

These examples demonstrate the full capabilities of the streaming transport system in real-world scenarios.
