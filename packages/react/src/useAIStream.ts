import { useState, useEffect, useCallback, useRef } from 'react'
import { AIStream } from '@ainative/ai-kit-core'
import type { Message, Usage, StreamConfig } from '@ainative/ai-kit-core'

export interface UseAIStreamResult {
  messages: Message[]
  isStreaming: boolean
  error: Error | null
  send: (content: string) => Promise<void>
  reset: () => void
  retry: () => Promise<void>
  stop: () => void
  usage: Usage
}

/**
 * React hook for AI streaming
 * Manages messages state and streaming lifecycle automatically
 */
export function useAIStream(config: StreamConfig): UseAIStreamResult {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [usage, setUsage] = useState<Usage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  })

  const streamRef = useRef<AIStream | null>(null)

  // Initialize stream
  useEffect(() => {
    const stream = new AIStream(config)

    // Listen to events
    stream.on('message', (message: Message) => {
      setMessages((prev) => {
        const existing = prev.find((m) => m.id === message.id)
        if (existing) {
          return prev.map((m) => (m.id === message.id ? message : m))
        }
        return [...prev, message]
      })
    })

    stream.on('streaming-start', () => {
      setIsStreaming(true)
      setError(null)
    })

    stream.on('streaming-end', () => {
      setIsStreaming(false)
    })

    stream.on('error', (err: Error) => {
      setError(err)
      setIsStreaming(false)
    })

    stream.on('usage', (newUsage: Usage) => {
      setUsage(newUsage)
    })

    stream.on('reset', () => {
      setMessages([])
      setError(null)
      setUsage({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      })
    })

    streamRef.current = stream

    return () => {
      stream.removeAllListeners()
      stream.stop()
    }
  }, []) // Empty deps - only initialize once

  const send = useCallback(async (content: string) => {
    if (!streamRef.current) return
    try {
      await streamRef.current.send(content)
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  const reset = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.reset()
  }, [])

  const retry = useCallback(async () => {
    if (!streamRef.current) return
    try {
      await streamRef.current.retry()
    } catch (err) {
      setError(err as Error)
    }
  }, [])

  const stop = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.stop()
  }, [])

  return {
    messages,
    isStreaming,
    error,
    send,
    reset,
    retry,
    stop,
    usage,
  }
}
