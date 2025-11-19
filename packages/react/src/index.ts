/**
 * @ainative/ai-kit (React adapter)
 * React hooks and components for AI Kit
 */

// Hooks
export { useAIStream, type UseAIStreamResult } from './useAIStream'

// Components
export { StreamingMessage } from './components/StreamingMessage'
export { StreamingIndicator } from './components/StreamingIndicator'
export { CodeBlock } from './components/CodeBlock'
export { ProgressBar } from './components/ProgressBar'
export { StreamingToolResult } from './components/StreamingToolResult'
export { AgentResponse } from './components/AgentResponse'
export { MarkdownRenderer } from './components/MarkdownRenderer'
export { ToolResult } from './components/ToolResult'
export { UnknownTool } from './components/UnknownTool'

// Component Props Types
export type {
  StreamingMessageProps,
  StreamingIndicatorProps,
  CodeBlockProps,
  ProgressBarProps,
  StreamingToolResultProps,
  AgentResponseProps,
  MarkdownRendererProps,
  ToolResultProps,
  UnknownToolProps,
} from './types'

// State and Configuration Types
export type {
  StreamingState,
  AnimationType,
  StreamingIndicatorVariant,
  ToolExecutionState,
  ToolExecutionStatus,
  ToolResultData,
  ProgressMode,
  MessageMetadata,
  RoleColors,
  AgentResponseData,
} from './types'

// Component Registry exports
export { ComponentRegistry, globalRegistry } from './registry/ComponentRegistry'
export { useComponentRegistry } from './registry/useComponentRegistry'
export type { UseComponentRegistryOptions, UseComponentRegistryResult } from './registry/useComponentRegistry'

// Registry types
export type {
  PropMapper,
  ComponentMapping,
  RegistryConfig,
  RegisterOptions,
  LookupOptions,
  LookupResult,
  RegistryStats,
} from './registry/types'

// Re-export core types for convenience
export type { Message, Usage, StreamConfig, StreamResult } from '@ainative/ai-kit-core'
