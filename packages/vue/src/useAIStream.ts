import { ref, onMounted, onUnmounted, Ref } from 'vue'
import { AIStream } from '@ainative/ai-kit-core'
import type { Message, Usage, StreamConfig } from '@ainative/ai-kit-core'

export interface UseAIStreamResult {
  messages: Ref<Message[]>
  isStreaming: Ref<boolean>
  error: Ref<Error | null>
  send: (content: string) => Promise<void>
  reset: () => void
  retry: () => Promise<void>
  stop: () => void
  usage: Ref<Usage>
}

/**
 * Vue 3 composable for AI streaming
 * Manages messages state and streaming lifecycle automatically using Composition API
 */
export function useAIStream(config: StreamConfig): UseAIStreamResult {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const error = ref<Error | null>(null)
  const usage = ref<Usage>({
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
      const existing = messages.value.find((m) => m.id === message.id)
      if (existing) {
        messages.value = messages.value.map((m) =>
          m.id === message.id ? message : m
        )
      } else {
        messages.value = [...messages.value, message]
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
