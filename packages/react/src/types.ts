/**
 * Type definitions for AI Kit React components
 * @module @ainative/ai-kit/react
 */

import { ReactNode, CSSProperties } from 'react';

// ============================================================================
// Streaming State Types
// ============================================================================

/**
 * Streaming state indicator
 */
export type StreamingState = 'idle' | 'streaming' | 'complete' | 'error';

/**
 * Animation types for streaming content
 */
export type AnimationType = 'none' | 'fade' | 'typewriter' | 'smooth';

/**
 * Streaming indicator variant
 */
export type StreamingIndicatorVariant = 'dots' | 'pulse' | 'wave';

// ============================================================================
// Tool Execution State Types
// ============================================================================

/**
 * Tool execution state for streaming tool results
 */
export type ToolExecutionState = 'idle' | 'executing' | 'success' | 'error';

/**
 * Tool execution status
 */
export interface ToolExecutionStatus {
  /**
   * Current execution state
   */
  state: ToolExecutionState;

  /**
   * Progress percentage (0-100) for determinate progress
   */
  progress?: number;

  /**
   * Current status message
   */
  message?: string;

  /**
   * Tool name being executed
   */
  toolName?: string;

  /**
   * Error message if state is 'error'
   */
  error?: string;

  /**
   * Start time of execution
   */
  startTime?: string;

  /**
   * End time of execution
   */
  endTime?: string;

  /**
   * Duration in milliseconds
   */
  durationMs?: number;
}

/**
 * Tool result data
 */
export interface ToolResultData {
  /**
   * Tool call ID
   */
  toolCallId: string;

  /**
   * Tool name
   */
  toolName: string;

  /**
   * Result data
   */
  result: unknown;

  /**
   * Error information
   */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };

  /**
   * Execution metadata
   */
  metadata?: {
    durationMs?: number;
    timestamp?: string;
    retryCount?: number;
  };
}

// ============================================================================
// Progress Bar Types
// ============================================================================

/**
 * Progress bar mode
 */
export type ProgressMode = 'determinate' | 'indeterminate';

/**
 * Props for ProgressBar component
 */
export interface ProgressBarProps {
  /**
   * Progress value (0-100) for determinate mode
   */
  value?: number;

  /**
   * Progress bar mode
   * @default 'indeterminate'
   */
  mode?: ProgressMode;

  /**
   * Progress bar color
   * @default '#3b82f6'
   */
  color?: string;

  /**
   * Background color
   * @default '#e5e7eb'
   */
  backgroundColor?: string;

  /**
   * Height of the progress bar
   * @default '4px'
   */
  height?: string | number;

  /**
   * Width of the progress bar
   * @default '100%'
   */
  width?: string | number;

  /**
   * Border radius
   * @default '4px'
   */
  borderRadius?: string | number;

  /**
   * Show percentage label
   * @default false
   */
  showLabel?: boolean;

  /**
   * Label position
   * @default 'right'
   */
  labelPosition?: 'top' | 'right' | 'bottom' | 'inside';

  /**
   * Custom label formatter
   */
  labelFormatter?: (value: number) => string;

  /**
   * Animation duration for transitions
   * @default '300ms'
   */
  animationDuration?: string;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: CSSProperties;

  /**
   * Test ID for testing
   * @default 'progress-bar'
   */
  testId?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

// ============================================================================
// Streaming Tool Result Types
// ============================================================================

/**
 * Props for StreamingToolResult component
 */
export interface StreamingToolResultProps {
  /**
   * Current execution status
   */
  status: ToolExecutionStatus;

  /**
   * Tool result data (shown when execution completes)
   */
  result?: ToolResultData;

  /**
   * Custom progress bar color
   */
  progressColor?: string;

  /**
   * Show progress bar during execution
   * @default true
   */
  showProgress?: boolean;

  /**
   * Show status message
   * @default true
   */
  showStatusMessage?: boolean;

  /**
   * Show tool name
   * @default true
   */
  showToolName?: boolean;

  /**
   * Show execution duration
   * @default true
   */
  showDuration?: boolean;

  /**
   * Enable retry on error
   * @default false
   */
  enableRetry?: boolean;

  /**
   * Retry callback
   */
  onRetry?: () => void;

  /**
   * Callback when execution completes
   */
  onComplete?: (result: ToolResultData) => void;

  /**
   * Callback when execution errors
   */
  onError?: (error: string) => void;

  /**
   * Custom render function for result content
   */
  renderResult?: (result: ToolResultData) => ReactNode;

  /**
   * Custom render function for error content
   */
  renderError?: (error: string) => ReactNode;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: CSSProperties;

  /**
   * Test ID for testing
   * @default 'streaming-tool-result'
   */
  testId?: string;

  /**
   * Accessible label for screen readers
   */
  ariaLabel?: string;
}

// ============================================================================
// Streaming Message Types
// ============================================================================

/**
 * Message metadata
 */
export interface MessageMetadata {
  /**
   * Timestamp of the message
   */
  timestamp?: string;

  /**
   * Model used for the message
   */
  model?: string;

  /**
   * Tokens used
   */
  tokensUsed?: number;

  /**
   * Additional custom metadata
   */
  [key: string]: unknown;
}

/**
 * Role colors configuration
 */
export interface RoleColors {
  user?: string;
  assistant?: string;
  system?: string;
}

/**
 * Props for StreamingMessage component
 */
export interface StreamingMessageProps {
  /**
   * Message role
   */
  role: 'user' | 'assistant' | 'system';

  /**
   * Message content
   */
  content: string;

  /**
   * Streaming state
   * @default 'idle'
   */
  streamingState?: StreamingState;

  /**
   * Animation type
   * @default 'smooth'
   */
  animationType?: AnimationType;

  /**
   * Animation speed in milliseconds per character
   * @default 30
   */
  animationSpeed?: number;

  /**
   * Enable markdown rendering
   * @default true
   */
  enableMarkdown?: boolean;

  /**
   * Code block theme
   * @default 'dark'
   */
  codeTheme?: 'dark' | 'light' | 'vs-dark' | 'github' | 'monokai' | 'nord' | 'dracula';

  /**
   * Show streaming indicator
   * @default true
   */
  showStreamingIndicator?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: CSSProperties;

  /**
   * Avatar image URL or custom element
   */
  avatar?: string | ReactNode;

  /**
   * Display name for the message sender
   */
  displayName?: string;

  /**
   * Show timestamp
   * @default false
   */
  showTimestamp?: boolean;

  /**
   * Message metadata
   */
  metadata?: MessageMetadata;

  /**
   * Callback when streaming completes
   */
  onStreamingComplete?: () => void;

  /**
   * Callback when content updates
   */
  onContentUpdate?: (content: string) => void;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Enable code copy button
   * @default true
   */
  enableCodeCopy?: boolean;

  /**
   * Custom role colors
   */
  roleColors?: RoleColors;

  /**
   * Test ID for testing
   * @default 'streaming-message'
   */
  testId?: string;
}

// ============================================================================
// Streaming Indicator Types
// ============================================================================

/**
 * Props for StreamingIndicator component
 */
export interface StreamingIndicatorProps {
  /**
   * Indicator variant
   * @default 'dots'
   */
  variant?: StreamingIndicatorVariant;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: CSSProperties;

  /**
   * Test ID for testing
   * @default 'streaming-indicator'
   */
  testId?: string;
}

// ============================================================================
// Code Block Types
// ============================================================================

/**
 * Props for CodeBlock component
 */
export interface CodeBlockProps {
  /**
   * Programming language for syntax highlighting
   */
  language: string;

  /**
   * Code content
   */
  children: string;

  /**
   * Color theme
   * @default 'dark'
   */
  theme?: 'dark' | 'light' | 'vs-dark' | 'github' | 'monokai' | 'nord' | 'dracula';

  /**
   * Enable copy button
   * @default true
   */
  enableCopy?: boolean;

  /**
   * Show line numbers
   * @default false
   */
  showLineNumbers?: boolean;

  /**
   * Starting line number
   * @default 1
   */
  startingLineNumber?: number;

  /**
   * Highlight specific lines (comma-separated line numbers)
   */
  highlightLines?: string;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: CSSProperties;

  /**
   * Test ID for testing
   * @default 'code-block'
   */
  testId?: string;

  /**
   * Callback when code is copied
   */
  onCopy?: () => void;
}

// ============================================================================
// Agent Response Types (for AIKIT-18 integration)
// ============================================================================

/**
 * Agent response data structure
 */
export interface AgentResponseData {
  /**
   * Final response text
   */
  response: string;

  /**
   * Execution steps
   */
  steps?: Array<{
    step: number;
    thought?: string;
    toolCalls?: Array<{
      id: string;
      name: string;
      parameters: Record<string, unknown>;
    }>;
    toolResults?: ToolResultData[];
  }>;

  /**
   * Execution metadata
   */
  metadata?: {
    totalSteps?: number;
    totalToolCalls?: number;
    durationMs?: number;
    model?: string;
  };
}

/**
 * Props for AgentResponse component (forward compatibility with AIKIT-18)
 */
export interface AgentResponseProps {
  /**
   * Agent response data
   */
  data: AgentResponseData;

  /**
   * Component registry for tool rendering
   */
  registry?: any;

  /**
   * Show execution steps
   * @default false
   */
  showSteps?: boolean;

  /**
   * Show metadata
   * @default false
   */
  showMetadata?: boolean;

  /**
   * Enable markdown in response
   * @default true
   */
  enableMarkdown?: boolean;

  /**
   * Code block theme
   * @default 'dark'
   */
  codeTheme?: 'dark' | 'light' | 'vs-dark' | 'github' | 'monokai' | 'nord' | 'dracula';

  /**
   * Enable code copy in code blocks
   * @default true
   */
  enableCodeCopy?: boolean;

  /**
   * Streaming state
   */
  streamingState?: StreamingState;

  /**
   * Error fallback component
   */
  errorFallback?: ReactNode;

  /**
   * Callback when content updates (for streaming)
   */
  onContentUpdate?: (content: string) => void;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: CSSProperties;

  /**
   * Test ID for testing
   */
  testId?: string;
}

/**
 * Props for MarkdownRenderer component
 */
export interface MarkdownRendererProps {
  /**
   * Markdown content to render
   */
  content: string;

  /**
   * Code block theme
   * @default 'dark'
   */
  codeTheme?: 'dark' | 'light' | 'vs-dark' | 'github' | 'monokai' | 'nord' | 'dracula';

  /**
   * Enable code copy in code blocks
   * @default true
   */
  enableCodeCopy?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Enable GitHub Flavored Markdown
   * @default true
   */
  enableGfm?: boolean;

  /**
   * Custom component overrides
   */
  components?: any;

  /**
   * Test ID for testing
   * @default 'markdown-renderer'
   */
  testId?: string;
}

/**
 * Props for ToolResult component
 */
export interface ToolResultProps {
  /**
   * Tool name
   */
  toolName: string;

  /**
   * Tool result data
   */
  result: any;

  /**
   * Tool call ID
   */
  toolCallId?: string;

  /**
   * Error information
   */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };

  /**
   * Execution metadata
   */
  metadata?: {
    durationMs?: number;
    timestamp?: string;
    retryCount?: number;
  };

  /**
   * Component registry for rendering
   */
  registry?: any;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Show metadata
   * @default false
   */
  showMetadata?: boolean;

  /**
   * Test ID for testing
   * @default 'tool-result'
   */
  testId?: string;
}

/**
 * Props for UnknownTool component
 */
export interface UnknownToolProps {
  /**
   * Tool name
   */
  toolName: string;

  /**
   * Tool result data (will be displayed as JSON)
   */
  result: any;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Show raw JSON
   * @default true
   */
  showRawJson?: boolean;

  /**
   * Test ID for testing
   * @default 'unknown-tool'
   */
  testId?: string;
}
