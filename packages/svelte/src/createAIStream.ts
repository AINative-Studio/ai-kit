import { writable, type Readable } from 'svelte/store'
import { AIStream } from '@ainative/ai-kit-core'
import type { Message, Usage, StreamConfig } from '@ainative/ai-kit-core'

export interface AIStreamStore {
  messages: Readable<Message[]>
  isStreaming: Readable<boolean>
  error: Readable<Error | null>
  usage: Readable<Usage>
  send: (content: string) => Promise<void>
  reset: () => void
  retry: () => Promise<void>
  stop: () => void
  destroy: () => void
}

/**
 * Svelte store for AI streaming
 * Manages messages state and streaming lifecycle using Svelte's reactive stores
 *
 * @example
 * ```ts
 * import { createAIStream } from '@ainative/ai-kit-svelte'
 *
 * const aiStream = createAIStream({ endpoint: '/api/chat' })
 *
 * // Subscribe to messages
 * aiStream.messages.subscribe($messages => {
 *   console.log('Messages:', $messages)
 * })
 *
 * // Send a message
 * await aiStream.send('Hello!')
 *
 * // Clean up when done
 * aiStream.destroy()
 * ```
 */
export function createAIStream(config: StreamConfig): AIStreamStore {
  // Create writable stores for internal state
  const messages = writable<Message[]>([])
  const isStreaming = writable<boolean>(false)
  const error = writable<Error | null>(null)
  const usage = writable<Usage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  })

  // Initialize the core AIStream instance
  const stream = new AIStream(config)

  // Set up event listeners
  stream.on('message', (message: Message) => {
    messages.update((prev) => {
      const existing = prev.find((m) => m.id === message.id)
      if (existing) {
        return prev.map((m) => (m.id === message.id ? message : m))
      }
      return [...prev, message]
    })
  })

  stream.on('streaming-start', () => {
    isStreaming.set(true)
    error.set(null)
  })

  stream.on('streaming-end', () => {
    isStreaming.set(false)
  })

  stream.on('error', (err: Error) => {
    error.set(err)
    isStreaming.set(false)
  })

  stream.on('usage', (newUsage: Usage) => {
    usage.set(newUsage)
  })

  stream.on('reset', () => {
    messages.set([])
    error.set(null)
    usage.set({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    })
  })

  // Define action methods
  const send = async (content: string): Promise<void> => {
    try {
      await stream.send(content)
    } catch (err) {
      error.set(err as Error)
      throw err
    }
  }

  const reset = (): void => {
    stream.reset()
  }

  const retry = async (): Promise<void> => {
    try {
      await stream.retry()
    } catch (err) {
      error.set(err as Error)
      throw err
    }
  }

  const stop = (): void => {
    stream.stop()
  }

  const destroy = (): void => {
    stream.removeAllListeners()
    stream.stop()
  }

  // Return the store interface
  return {
    messages: { subscribe: messages.subscribe },
    isStreaming: { subscribe: isStreaming.subscribe },
    error: { subscribe: error.subscribe },
    usage: { subscribe: usage.subscribe },
    send,
    reset,
    retry,
    stop,
    destroy,
  }
}
