/**
 * @ainative/ai-kit-vue
 * Vue 3 composables for AI Kit
 */

// Main composables
export { useAIStream } from './useAIStream'
export type { UseAIStreamResult } from './useAIStream'

export { useConversation } from './useConversation'
export type {
  UseConversationOptions,
  UseConversationReturn,
} from './types'

// Re-export core types for convenience
// Note: Temporarily disabled due to core package not generating DTS files
// These will be re-enabled once core DTS generation is fixed
// export type {
//   Message,
//   Usage,
//   StreamConfig,
//   StreamResult,
//   Conversation,
//   ConversationMetadata,
// } from '@ainative/ai-kit-core'
