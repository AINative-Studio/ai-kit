import { shallowRef, onMounted, onUnmounted, type ShallowRef } from 'vue'
import { AIStream } from '@ainative/ai-kit-core'
import type { Message, Usage, StreamConfig } from '@ainative/ai-kit-core'

export interface UseAIStreamResult {
  messages: ShallowRef<Message[]>
  isStreaming: ShallowRef<boolean>
  error: ShallowRef<Error | null>
  send: (content: string) => Promise<void>
  reset: () => void
  retry: () => Promise<void>
  stop: () => void
  usage: ShallowRef<Usage>
}

/**
 * Vue 3 composable for AI streaming
 * Manages messages state and streaming lifecycle automatically using Composition API
 */
export function useAIStream(config: StreamConfig): UseAIStreamResult {
  const messages = shallowRef<Message[]>([])
  const isStreaming = shallowRef(false)
  const error = shallowRef<Error | null>(null)
  const usage = shallowRef<Usage>({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  })

  let stream: InstanceType<typeof AIStream> | null = null

  // Initialize stream
  onMounted(() => {
    stream = new AIStream(config)

    // Listen to events
    stream.on('message', (message: Message) => {
      const currentMessages: Message[] = messages.value
      const existingIndex = currentMessages.findIndex((m) => m.id === message.id)

      if (existingIndex !== -1) {
        const updatedMessages = [...currentMessages]
        updatedMessages[existingIndex] = message
        messages.value = updatedMessages
      } else {
        messages.value = [...currentMessages, message]
      }
    })

    stream.on('streaming-start', () => {
      isStreaming.value = true
      error.value = null
    })

    stream.on('streaming-end', () => {
      isStreaming.value = false
    })

    stream.on('error', (err: Error) => {
      error.value = err
      isStreaming.value = false
    })

    stream.on('usage', (newUsage: Usage) => {
      usage.value = newUsage
    })

    stream.on('reset', () => {
      messages.value = []
      error.value = null
      usage.value = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }
    })
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (stream) {
      stream.removeAllListeners()
      stream.stop()
      stream = null
    }
  })

  const send = async (content: string): Promise<void> => {
    if (!stream) return
    try {
      await stream.send(content)
    } catch (err) {
      error.value = err as Error
    }
  }

  const reset = (): void => {
    if (!stream) return
    stream.reset()
  }

  const retry = async (): Promise<void> => {
    if (!stream) return
    try {
      await stream.retry()
    } catch (err) {
      error.value = err as Error
    }
  }

  const stop = (): void => {
    if (!stream) return
    stream.stop()
  }

  return {
    messages,
    isStreaming,
    error,
    send,
    reset,
    retry,
    stop,
    usage,
  } as UseAIStreamResult
}
