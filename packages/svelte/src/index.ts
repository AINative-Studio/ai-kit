/**
 * @ainative/ai-kit-svelte
 * Svelte adapter for AI Kit with stores and components
 */

export { createAIStream } from './createAIStream'
export type { AIStreamStore } from './createAIStream'

// Re-export core types for convenience
export type { Message, Usage, StreamConfig } from '@ainative/ai-kit-core'
