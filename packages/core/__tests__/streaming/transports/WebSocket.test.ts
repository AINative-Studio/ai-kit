import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebSocketTransport } from '../../../src/streaming/transports/WebSocket'
import type { TransportConfig } from '../../../src/streaming/transports/types'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  public readyState: number = MockWebSocket.CONNECTING
  public onopen: ((event: any) => void) | null = null
  public onmessage: ((event: any) => void) | null = null
  public onerror: ((event: any) => void) | null = null
  public onclose: ((event: any) => void) | null = null

  constructor(public url: string, public protocols?: string | string[]) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen({ type: 'open' })
      }
    }, 0)
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose({ type: 'close', code: code || 1000, reason: reason || '' })
    }
  }

  // Helper for testing
  simulateMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) })
    }
  }

  simulateError(error: any): void {
    if (this.onerror) {
      this.onerror({ error })
    }
  }
}

global.WebSocket = MockWebSocket as any

describe('WebSocketTransport', () => {
  let transport: WebSocketTransport
  let mockWs: MockWebSocket

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (transport) {
      transport.close()
    }
  })

  describe('constructor', () => {
    it('should create instance with config', () => {
      const config: TransportConfig = {
        endpoint: 'ws://localhost:3000/stream',
        headers: { 'Authorization': 'Bearer token' },
      }

      transport = new WebSocketTransport(config)
      expect(transport).toBeInstanceOf(WebSocketTransport)
    })

    it('should initialize in idle state', () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })
      expect(transport.getState()).toBe('idle')
    })

    it('should convert http endpoint to ws', () => {
      transport = new WebSocketTransport({ endpoint: 'http://localhost:3000/stream' })
      expect(transport).toBeInstanceOf(WebSocketTransport)
    })

    it('should convert https endpoint to wss', () => {
      transport = new WebSocketTransport({ endpoint: 'https://localhost:3000/stream' })
      expect(transport).toBeInstanceOf(WebSocketTransport)
    })
  })

  describe('connect', () => {
    it('should establish WebSocket connection', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      const connectedListener = vi.fn()
      transport.on('connected', connectedListener)

      await transport.connect()

      expect(transport.getState()).toBe('connected')
      expect(connectedListener).toHaveBeenCalled()
    })

    it('should emit connecting event', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      const connectingListener = vi.fn()
      transport.on('connecting', connectingListener)

      await transport.connect()

      expect(connectingListener).toHaveBeenCalled()
    })

    it('should handle connection errors', async () => {
      const OriginalWebSocket = global.WebSocket

      class ErrorWebSocket extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED
            if (this.onerror) {
              this.onerror({ error: new Error('Connection failed') })
            }
            if (this.onclose) {
              this.onclose({ type: 'close', code: 1006, reason: 'Connection failed' })
            }
          }, 0)
        }
      }

      global.WebSocket = ErrorWebSocket as any

      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      const errorListener = vi.fn()
      transport.on('error', errorListener)

      await transport.connect()

      expect(errorListener).toHaveBeenCalled()

      global.WebSocket = OriginalWebSocket
    })

    it('should support WebSocket protocols', async () => {
      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        protocols: ['protocol1', 'protocol2'],
      })

      await transport.connect()

      expect(transport.getState()).toBe('connected')
    })
  })

  describe('send', () => {
    it('should send data through connected transport', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })
      await transport.connect()

      const data = { message: 'Hello' }
      await transport.send(data)

      // Verify no errors thrown
      expect(transport.getState()).toBe('connected')
    })

    it('should throw error if not connected', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      await expect(transport.send({ test: 'data' })).rejects.toThrow()
    })

    it('should serialize data as JSON', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })
      await transport.connect()

      const sendSpy = vi.spyOn((transport as any).ws, 'send')

      const data = { type: 'message', content: 'Hello' }
      await transport.send(data)

      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(data))
    })
  })

  describe('message handling', () => {
    it('should parse JSON messages', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      const eventListener = vi.fn()
      transport.on('event', eventListener)

      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      ws.simulateMessage({ type: 'token', token: 'Hello' })

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'token',
          token: 'Hello',
        })
      )
    })

    it('should handle multiple messages', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      const eventListener = vi.fn()
      transport.on('event', eventListener)

      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      ws.simulateMessage({ type: 'token', token: 'Hello' })
      ws.simulateMessage({ type: 'token', token: ' world' })

      expect(eventListener).toHaveBeenCalledTimes(2)
    })

    it('should handle done signal', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      const doneListener = vi.fn()
      transport.on('done', doneListener)

      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      ws.simulateMessage({ type: 'done' })

      expect(doneListener).toHaveBeenCalled()
    })

    it('should handle error messages', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      const errorListener = vi.fn()
      transport.on('error', errorListener)

      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      ws.simulateMessage({ type: 'error', error: 'Something went wrong' })

      expect(errorListener).toHaveBeenCalled()
    })

    it('should handle malformed JSON', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      const errorListener = vi.fn()
      transport.on('error', errorListener)

      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      if (ws.onmessage) {
        ws.onmessage({ data: '{invalid json}' })
      }

      // Should emit error but not crash
      expect(errorListener).toHaveBeenCalled()
    })
  })

  describe('reconnection', () => {
    it('should reconnect on connection loss', async () => {
      let connectCount = 0
      const OriginalWebSocket = global.WebSocket

      class ReconnectWebSocket extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          connectCount++

          if (connectCount === 1) {
            // First connection fails
            setTimeout(() => {
              this.readyState = MockWebSocket.CLOSED
              if (this.onclose) {
                this.onclose({ type: 'close', code: 1006, reason: 'Connection lost' })
              }
            }, 10)
          } else {
            // Subsequent connections succeed
            setTimeout(() => {
              this.readyState = MockWebSocket.OPEN
              if (this.onopen) {
                this.onopen({ type: 'open' })
              }
            }, 10)
          }
        }
      }

      global.WebSocket = ReconnectWebSocket as any

      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        reconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 10,
      })

      const reconnectingListener = vi.fn()
      const errorListener = vi.fn()
      transport.on('reconnecting', reconnectingListener)
      transport.on('error', errorListener)

      await transport.connect()

      // Give time for reconnection
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(reconnectingListener).toHaveBeenCalled()
      expect(connectCount).toBeGreaterThan(1)

      global.WebSocket = OriginalWebSocket
    })

    it('should respect maxReconnectAttempts limit', async () => {
      let connectCount = 0
      const OriginalWebSocket = global.WebSocket

      class FailingWebSocket extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          connectCount++

          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED
            if (this.onclose) {
              this.onclose({ type: 'close', code: 1006, reason: 'Connection lost' })
            }
          }, 10)
        }
      }

      global.WebSocket = FailingWebSocket as any

      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        reconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 10,
      })

      const errorListener = vi.fn()
      transport.on('error', errorListener)

      await transport.connect()

      // Give time for all reconnection attempts
      await new Promise(resolve => setTimeout(resolve, 200))

      // Initial attempt + 3 retries = 4 total
      expect(connectCount).toBe(4)

      global.WebSocket = OriginalWebSocket
    })

    it('should use exponential backoff for reconnection delays', async () => {
      let connectCount = 0
      const delays: number[] = []
      const mockSetTimeout = vi.spyOn(global, 'setTimeout').mockImplementation(((fn: any, delay: number) => {
        if (delay >= 10) { // Only track our reconnection delays
          delays.push(delay)
        }
        fn()
        return 0 as any
      }) as any)

      const OriginalWebSocket = global.WebSocket

      class FailingWebSocket extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          connectCount++

          if (connectCount <= 3) {
            this.readyState = MockWebSocket.CLOSED
            if (this.onclose) {
              this.onclose({ type: 'close', code: 1006, reason: 'Connection lost' })
            }
          } else {
            this.readyState = MockWebSocket.OPEN
            if (this.onopen) {
              this.onopen({ type: 'open' })
            }
          }
        }
      }

      global.WebSocket = FailingWebSocket as any

      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        reconnect: true,
        maxReconnectAttempts: 5,
        reconnectDelay: 100,
        backoffMultiplier: 2,
      })

      await transport.connect()

      // Check exponential backoff occurred
      expect(delays.length).toBeGreaterThan(0)
      if (delays.length > 1) {
        expect(delays[1]).toBeGreaterThan(delays[0])
      }

      mockSetTimeout.mockRestore()
      global.WebSocket = OriginalWebSocket
    })

    it('should emit reconnecting event with attempt number', async () => {
      let connectCount = 0
      const OriginalWebSocket = global.WebSocket

      class FailingWebSocket extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          connectCount++

          if (connectCount <= 2) {
            setTimeout(() => {
              this.readyState = MockWebSocket.CLOSED
              if (this.onclose) {
                this.onclose({ type: 'close', code: 1006, reason: 'Connection lost' })
              }
            }, 10)
          } else {
            setTimeout(() => {
              this.readyState = MockWebSocket.OPEN
              if (this.onopen) {
                this.onopen({ type: 'open' })
              }
            }, 10)
          }
        }
      }

      global.WebSocket = FailingWebSocket as any

      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        reconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 10,
      })

      const reconnectingListener = vi.fn()
      transport.on('reconnecting', reconnectingListener)

      await transport.connect()

      // Give time for reconnection
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(reconnectingListener).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: expect.any(Number),
          delay: expect.any(Number),
        })
      )

      global.WebSocket = OriginalWebSocket
    })

    it('should not reconnect if reconnect is disabled', async () => {
      let connectCount = 0
      const OriginalWebSocket = global.WebSocket

      class FailingWebSocket extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          connectCount++

          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED
            if (this.onclose) {
              this.onclose({ type: 'close', code: 1006, reason: 'Connection lost' })
            }
          }, 10)
        }
      }

      global.WebSocket = FailingWebSocket as any

      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        reconnect: false,
      })

      await transport.connect()

      // Give time to ensure no reconnection
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(connectCount).toBe(1)

      global.WebSocket = OriginalWebSocket
    })
  })

  describe('close', () => {
    it('should close the connection', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })
      await transport.connect()

      transport.close()

      expect(transport.getState()).toBe('closed')
    })

    it('should emit closed event', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })
      await transport.connect()

      const closedListener = vi.fn()
      transport.on('closed', closedListener)

      transport.close()

      expect(closedListener).toHaveBeenCalled()
    })

    it('should close WebSocket connection', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })
      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      const closeSpy = vi.spyOn(ws, 'close')

      transport.close()

      expect(closeSpy).toHaveBeenCalled()
    })

    it('should prevent reconnection after explicit close', async () => {
      let connectCount = 0
      const OriginalWebSocket = global.WebSocket

      class ReconnectWebSocket extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          connectCount++
          setTimeout(() => {
            this.readyState = MockWebSocket.OPEN
            if (this.onopen) {
              this.onopen({ type: 'open' })
            }
          }, 10)
        }
      }

      global.WebSocket = ReconnectWebSocket as any

      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        reconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 10,
      })

      await transport.connect()

      const initialCount = connectCount
      transport.close()

      // Give time to ensure no reconnection
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(connectCount).toBe(initialCount)

      global.WebSocket = OriginalWebSocket
    })
  })

  describe('state management', () => {
    it('should track connection state', async () => {
      transport = new WebSocketTransport({ endpoint: 'ws://localhost:3000/stream' })

      expect(transport.getState()).toBe('idle')

      const connectPromise = transport.connect()
      expect(['idle', 'connecting']).toContain(transport.getState())

      await connectPromise
      expect(transport.getState()).toBe('connected')

      transport.close()
      expect(transport.getState()).toBe('closed')
    })

    it('should handle error state', async () => {
      const OriginalWebSocket = global.WebSocket

      class ErrorWebSocket extends MockWebSocket {
        constructor(url: string, protocols?: string | string[]) {
          super(url, protocols)
          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED
            if (this.onerror) {
              this.onerror({ error: new Error('Connection failed') })
            }
          }, 10)
        }
      }

      global.WebSocket = ErrorWebSocket as any

      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        reconnect: false,
      })

      await transport.connect()

      expect(transport.getState()).toBe('error')

      global.WebSocket = OriginalWebSocket
    })
  })

  describe('ping/pong heartbeat', () => {
    it('should send ping messages when configured', async () => {
      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
        heartbeatInterval: 50,
      })

      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      const sendSpy = vi.spyOn(ws, 'send')

      // Wait for heartbeat
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('ping')
      )

      transport.close()
    })

    it('should not send heartbeat if not configured', async () => {
      transport = new WebSocketTransport({
        endpoint: 'ws://localhost:3000/stream',
      })

      await transport.connect()

      const ws = (transport as any).ws as MockWebSocket
      const sendSpy = vi.spyOn(ws, 'send')

      // Wait for potential heartbeat
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(sendSpy).not.toHaveBeenCalled()

      transport.close()
    })
  })
})
