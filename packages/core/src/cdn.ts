/**
 * @ainative/ai-kit-core - Minimal CDN Entry Point
 * Lightweight browser bundle for CDN distribution
 *
 * This entry point includes only utility functions that are 100% browser-safe:
 * - Token counting and cost calculation
 * - ID generation utilities
 * - Type definitions
 *
 * Note: This is a minimal subset. For full functionality, use the npm package.
 */

// Types - essential types only
export type {
  Message,
  Usage,
  TokenCount,
} from './types'

// Streaming utilities - token counting only (no EventEmitter dependencies)
export {
  countTokens,
  countMessageTokens,
  countMessagesTokens,
  calculateCost,
  estimateRequestTokens,
  MODEL_PRICING,
  type ModelName,
} from './streaming/token-counter'

// Context - token limits and model mappings (no tiktoken needed)
export {
  MessageImportance,
  MODEL_TOKEN_LIMITS,
  MODEL_ENCODING_MAP,
} from './context/types'
export type { ModelType } from './context/types'

// Utils - ID generation (100% browser-safe)
export {
  generateId,
  generateShortId,
  generateUUID,
  generateNanoid,
  generateTimestampId,
  generateIncrementalId,
} from './utils/id'
