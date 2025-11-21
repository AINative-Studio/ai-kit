/**
 * @ainative/ai-kit (React adapter)
 * React hooks and components for AI Kit
 */

// Hooks
export { useAIStream, type UseAIStreamResult } from './useAIStream'
export { useConversation } from './hooks/useConversation'
export type {
  UseConversationOptions,
  UseConversationReturn,
  ConversationState,
  ConversationActions,
} from './hooks/types'

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
export { UsageDashboard } from './components/UsageDashboard'

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
export type {
  UsageDashboardProps,
  DateRangePreset,
  TimeSeriesGranularity,
} from './components/UsageDashboard'

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
// Note: Temporarily disabled due to core package not generating DTS files
// export type { Message, Usage, StreamConfig, StreamResult } from '@ainative/ai-kit-core'
