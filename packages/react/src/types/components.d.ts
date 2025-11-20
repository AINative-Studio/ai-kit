/**
 * React component type definitions for AI Kit
 * Comprehensive types for React components and their props
 */

import type { ReactNode, CSSProperties, HTMLAttributes, ComponentType } from 'react';
import type {
  Message,
  StreamState,
  UsageStats,
  ModelId,
  AgentId,
  JsonValue,
} from '@ainative/ai-kit-core';

// ============================================================================
// Base Component Props
// ============================================================================

/**
 * Base props for all AI Kit components
 */
export interface BaseAIKitProps {
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly testId?: string;
}

// ============================================================================
// Chat Component Props
// ============================================================================

/**
 * Chat component props
 */
export interface ChatProps extends BaseAIKitProps {
  readonly messages?: readonly Message[];
  readonly onSend?: (message: string) => void | Promise<void>;
  readonly onMessageUpdate?: (id: string, message: Partial<Message>) => void;
  readonly onMessageDelete?: (id: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly showTimestamps?: boolean;
  readonly showUsage?: boolean;
  readonly renderMessage?: MessageRenderer;
  readonly renderInput?: InputRenderer;
  readonly maxHeight?: string | number;
  readonly autoScroll?: boolean;
  readonly enableMarkdown?: boolean;
  readonly enableCodeHighlight?: boolean;
  readonly theme?: ChatTheme;
}

/**
 * Message renderer type
 */
export type MessageRenderer = (message: Message) => ReactNode;

/**
 * Input renderer type
 */
export type InputRenderer = (props: InputRendererProps) => ReactNode;

/**
 * Input renderer props
 */
export interface InputRendererProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

/**
 * Chat theme
 */
export interface ChatTheme {
  readonly container?: CSSProperties;
  readonly messageContainer?: CSSProperties;
  readonly userMessage?: CSSProperties;
  readonly assistantMessage?: CSSProperties;
  readonly systemMessage?: CSSProperties;
  readonly input?: CSSProperties;
  readonly button?: CSSProperties;
}

// ============================================================================
// Message Component Props
// ============================================================================

/**
 * Message component props
 */
export interface MessageProps extends BaseAIKitProps {
  readonly message: Message;
  readonly showTimestamp?: boolean;
  readonly showAvatar?: boolean;
  readonly enableMarkdown?: boolean;
  readonly enableCodeHighlight?: boolean;
  readonly onEdit?: (content: string) => void;
  readonly onDelete?: () => void;
  readonly onCopy?: () => void;
  readonly avatarRenderer?: AvatarRenderer;
  readonly contentRenderer?: ContentRenderer;
}

/**
 * Avatar renderer type
 */
export type AvatarRenderer = (role: Message['role']) => ReactNode;

/**
 * Content renderer type
 */
export type ContentRenderer = (content: string) => ReactNode;

// ============================================================================
// StreamStatus Component Props
// ============================================================================

/**
 * Stream status component props
 */
export interface StreamStatusProps extends BaseAIKitProps {
  readonly state: StreamState;
  readonly usage?: UsageStats;
  readonly error?: Error | null;
  readonly showUsage?: boolean;
  readonly showLatency?: boolean;
  readonly showCost?: boolean;
  readonly format?: 'compact' | 'detailed';
}

// ============================================================================
// ModelSelector Component Props
// ============================================================================

/**
 * Model selector component props
 */
export interface ModelSelectorProps extends BaseAIKitProps {
  readonly value?: ModelId;
  readonly onChange?: (modelId: ModelId) => void;
  readonly models?: readonly ModelOption[];
  readonly groupBy?: 'provider' | 'category' | 'none';
  readonly showDetails?: boolean;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly renderOption?: ModelOptionRenderer;
}

/**
 * Model option
 */
export interface ModelOption {
  readonly id: ModelId;
  readonly name: string;
  readonly provider: string;
  readonly category?: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly cost?: number;
  readonly contextWindow?: number;
  readonly disabled?: boolean;
}

/**
 * Model option renderer type
 */
export type ModelOptionRenderer = (option: ModelOption) => ReactNode;

// ============================================================================
// ParameterControl Component Props
// ============================================================================

/**
 * Parameter control component props
 */
export interface ParameterControlProps extends BaseAIKitProps {
  readonly parameters: ModelParameters;
  readonly onChange: (parameters: ModelParameters) => void;
  readonly disabled?: boolean;
  readonly showAdvanced?: boolean;
  readonly layout?: 'horizontal' | 'vertical';
}

/**
 * Model parameters for UI
 */
export interface ModelParameters {
  readonly temperature?: number;
  readonly topP?: number;
  readonly topK?: number;
  readonly maxTokens?: number;
  readonly frequencyPenalty?: number;
  readonly presencePenalty?: number;
  readonly stop?: readonly string[];
}

// ============================================================================
// ToolPanel Component Props
// ============================================================================

/**
 * Tool panel component props
 */
export interface ToolPanelProps extends BaseAIKitProps {
  readonly tools?: readonly ToolOption[];
  readonly selectedTools?: readonly string[];
  readonly onToolsChange?: (toolIds: readonly string[]) => void;
  readonly onToolExecute?: (toolId: string, input: JsonValue) => void;
  readonly disabled?: boolean;
  readonly layout?: 'grid' | 'list';
  readonly showDescriptions?: boolean;
  readonly renderTool?: ToolRenderer;
}

/**
 * Tool option
 */
export interface ToolOption {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly category?: string;
  readonly enabled?: boolean;
}

/**
 * Tool renderer type
 */
export type ToolRenderer = (tool: ToolOption) => ReactNode;

// ============================================================================
// AgentStatus Component Props
// ============================================================================

/**
 * Agent status component props
 */
export interface AgentStatusProps extends BaseAIKitProps {
  readonly agentId?: AgentId;
  readonly status: AgentStatus;
  readonly progress?: number;
  readonly currentTask?: string;
  readonly showProgress?: boolean;
  readonly showTask?: boolean;
  readonly animated?: boolean;
}

/**
 * Agent status
 */
export type AgentStatus = 'idle' | 'thinking' | 'working' | 'done' | 'error';

// ============================================================================
// ThinkingIndicator Component Props
// ============================================================================

/**
 * Thinking indicator component props
 */
export interface ThinkingIndicatorProps extends BaseAIKitProps {
  readonly visible?: boolean;
  readonly text?: string;
  readonly animated?: boolean;
  readonly size?: 'small' | 'medium' | 'large';
  readonly variant?: 'dots' | 'spinner' | 'pulse' | 'wave';
}

// ============================================================================
// TokenCounter Component Props
// ============================================================================

/**
 * Token counter component props
 */
export interface TokenCounterProps extends BaseAIKitProps {
  readonly text: string;
  readonly modelId?: ModelId;
  readonly showWarning?: boolean;
  readonly warningThreshold?: number;
  readonly format?: 'number' | 'percentage' | 'both';
  readonly maxTokens?: number;
}

// ============================================================================
// CostEstimator Component Props
// ============================================================================

/**
 * Cost estimator component props
 */
export interface CostEstimatorProps extends BaseAIKitProps {
  readonly usage: UsageStats;
  readonly currency?: string;
  readonly precision?: number;
  readonly showBreakdown?: boolean;
}

// ============================================================================
// FeedbackButtons Component Props
// ============================================================================

/**
 * Feedback buttons component props
 */
export interface FeedbackButtonsProps extends BaseAIKitProps {
  readonly messageId: string;
  readonly onFeedback: (messageId: string, rating: number, comment?: string) => void;
  readonly disabled?: boolean;
  readonly showComment?: boolean;
  readonly variant?: 'thumbs' | 'stars' | 'numeric';
}

// ============================================================================
// CodeBlock Component Props
// ============================================================================

/**
 * Code block component props
 */
export interface CodeBlockProps extends BaseAIKitProps {
  readonly code: string;
  readonly language?: string;
  readonly showLineNumbers?: boolean;
  readonly showCopyButton?: boolean;
  readonly highlightLines?: readonly number[];
  readonly theme?: 'light' | 'dark' | 'auto';
  readonly onCopy?: () => void;
}

// ============================================================================
// Markdown Component Props
// ============================================================================

/**
 * Markdown component props
 */
export interface MarkdownProps extends BaseAIKitProps {
  readonly content: string;
  readonly enableCodeHighlight?: boolean;
  readonly enableTables?: boolean;
  readonly enableMath?: boolean;
  readonly components?: MarkdownComponents;
}

/**
 * Markdown component overrides
 */
export interface MarkdownComponents {
  readonly code?: ComponentType<CodeComponentProps>;
  readonly pre?: ComponentType<PreComponentProps>;
  readonly a?: ComponentType<AnchorComponentProps>;
  readonly img?: ComponentType<ImageComponentProps>;
  readonly [key: string]: ComponentType<unknown> | undefined;
}

/**
 * Code component props for markdown
 */
export interface CodeComponentProps {
  readonly inline?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}

/**
 * Pre component props for markdown
 */
export interface PreComponentProps extends HTMLAttributes<HTMLPreElement> {
  readonly children?: ReactNode;
}

/**
 * Anchor component props for markdown
 */
export interface AnchorComponentProps extends HTMLAttributes<HTMLAnchorElement> {
  readonly href?: string;
  readonly children?: ReactNode;
}

/**
 * Image component props for markdown
 */
export interface ImageComponentProps extends HTMLAttributes<HTMLImageElement> {
  readonly src?: string;
  readonly alt?: string;
}

// ============================================================================
// ErrorBoundary Component Props
// ============================================================================

/**
 * Error boundary component props
 */
export interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode | ErrorFallbackRenderer;
  readonly onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  readonly onReset?: () => void;
}

/**
 * Error fallback renderer type
 */
export type ErrorFallbackRenderer = (error: Error, reset: () => void) => ReactNode;

// ============================================================================
// Provider Component Props
// ============================================================================

/**
 * AIKit provider component props
 */
export interface AIKitProviderProps {
  readonly children: ReactNode;
  readonly config?: AIKitConfig;
  readonly models?: Record<string, ModelConfig>;
  readonly tools?: Record<string, ToolConfig>;
  readonly theme?: ThemeConfig;
}

/**
 * AI Kit config for provider
 */
export interface AIKitConfig {
  readonly apiKey?: string;
  readonly endpoint?: string;
  readonly defaultModel?: ModelId;
  readonly streaming?: boolean;
  readonly caching?: boolean;
  readonly [key: string]: JsonValue | undefined;
}

/**
 * Model config for provider
 */
export interface ModelConfig {
  readonly id: ModelId;
  readonly name: string;
  readonly provider: string;
  readonly apiKey?: string;
  readonly [key: string]: JsonValue | undefined;
}

/**
 * Tool config for provider
 */
export interface ToolConfig {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly [key: string]: JsonValue | undefined;
}

/**
 * Theme config for provider
 */
export interface ThemeConfig {
  readonly mode?: 'light' | 'dark' | 'auto';
  readonly colors?: ThemeColors;
  readonly fonts?: ThemeFonts;
  readonly spacing?: ThemeSpacing;
  readonly borderRadius?: string;
  readonly [key: string]: JsonValue | undefined;
}

/**
 * Theme colors
 */
export interface ThemeColors {
  readonly primary?: string;
  readonly secondary?: string;
  readonly background?: string;
  readonly surface?: string;
  readonly text?: string;
  readonly textSecondary?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly success?: string;
  readonly info?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Theme fonts
 */
export interface ThemeFonts {
  readonly body?: string;
  readonly heading?: string;
  readonly monospace?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Theme spacing
 */
export interface ThemeSpacing {
  readonly xs?: string;
  readonly sm?: string;
  readonly md?: string;
  readonly lg?: string;
  readonly xl?: string;
  readonly [key: string]: string | undefined;
}

// ============================================================================
// Layout Component Props
// ============================================================================

/**
 * Chat layout component props
 */
export interface ChatLayoutProps extends BaseAIKitProps {
  readonly children: ReactNode;
  readonly sidebar?: ReactNode;
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly sidebarPosition?: 'left' | 'right';
  readonly sidebarWidth?: string | number;
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
}

// ============================================================================
// Form Component Props
// ============================================================================

/**
 * Message input component props
 */
export interface MessageInputProps extends BaseAIKitProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly onSubmit?: (value: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly multiline?: boolean;
  readonly maxLength?: number;
  readonly showCharCount?: boolean;
  readonly showAttachments?: boolean;
  readonly onAttach?: (files: readonly File[]) => void;
  readonly autoFocus?: boolean;
  readonly rows?: number;
  readonly maxRows?: number;
}

// ============================================================================
// Utility Component Props
// ============================================================================

/**
 * Tooltip component props
 */
export interface TooltipProps extends BaseAIKitProps {
  readonly content: ReactNode;
  readonly children: ReactNode;
  readonly placement?: 'top' | 'bottom' | 'left' | 'right';
  readonly delay?: number;
  readonly trigger?: 'hover' | 'click' | 'focus';
}

/**
 * Badge component props
 */
export interface BadgeProps extends BaseAIKitProps {
  readonly children: ReactNode;
  readonly variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  readonly size?: 'small' | 'medium' | 'large';
  readonly dot?: boolean;
}

/**
 * Avatar component props
 */
export interface AvatarProps extends BaseAIKitProps {
  readonly src?: string;
  readonly alt?: string;
  readonly size?: number | string;
  readonly fallback?: ReactNode;
  readonly shape?: 'circle' | 'square' | 'rounded';
}
