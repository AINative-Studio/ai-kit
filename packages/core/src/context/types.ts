/**
 * Context truncation types and interfaces
 */

/**
 * Supported AI models for token counting
 */
export type ModelType =
  | 'gpt-4'
  | 'gpt-4-32k'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'claude-3-5-sonnet'
  | 'claude-3-5-haiku';

/**
 * Message importance levels
 */
export enum MessageImportance {
  SYSTEM = 'system',
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}

/**
 * Truncation strategy types
 */
export type TruncationStrategyType =
  | 'oldest-first'
  | 'least-relevant'
  | 'sliding-window'
  | 'importance-based'
  | 'custom';

/**
 * Message structure for context management
 */
export interface ContextMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
  importance?: MessageImportance;
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * Token usage information
 */
export interface TokenUsage {
  totalTokens: number;
  messageTokens: number;
  overheadTokens: number;
  remainingTokens: number;
}

/**
 * Context configuration
 */
export interface ContextConfig {
  model: ModelType;
  maxTokens: number;
  reservedTokens?: number;
  truncationStrategy?: TruncationStrategyType;
  preserveSystemMessages?: boolean;
  preserveRecentCount?: number;
  slidingWindowConfig?: {
    keepFirst: number;
    keepLast: number;
  };
  warningThreshold?: number;
  onWarning?: (usage: TokenUsage) => void;
  onTruncate?: (removed: ContextMessage[], remaining: ContextMessage[]) => void;
  customTruncationFn?: (messages: ContextMessage[], maxTokens: number) => ContextMessage[];
}

/**
 * Truncation strategy interface
 */
export interface TruncationStrategy {
  name: TruncationStrategyType;
  truncate(
    messages: ContextMessage[],
    maxTokens: number,
    currentTokens: number,
    config: ContextConfig
  ): ContextMessage[];
}

/**
 * Token counter result
 */
export interface TokenCount {
  tokens: number;
  breakdown?: {
    role: number;
    name: number;
    content: number;
    functionCall: number;
    toolCalls: number;
  };
}

/**
 * Model token limits mapping
 */
export const MODEL_TOKEN_LIMITS: Record<ModelType, number> = {
  'gpt-4': 8192,
  'gpt-4-32k': 32768,
  'gpt-4-turbo': 128000,
  'gpt-4o': 128000,
  'gpt-3.5-turbo': 4096,
  'gpt-3.5-turbo-16k': 16384,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  'claude-3-5-sonnet': 200000,
  'claude-3-5-haiku': 200000,
};

/**
 * Model encoding mapping for tiktoken
 */
export const MODEL_ENCODING_MAP: Record<string, string> = {
  'gpt-4': 'cl100k_base',
  'gpt-4-32k': 'cl100k_base',
  'gpt-4-turbo': 'cl100k_base',
  'gpt-4o': 'o200k_base',
  'gpt-3.5-turbo': 'cl100k_base',
  'gpt-3.5-turbo-16k': 'cl100k_base',
  'claude-3-opus': 'cl100k_base',
  'claude-3-sonnet': 'cl100k_base',
  'claude-3-haiku': 'cl100k_base',
  'claude-3-5-sonnet': 'cl100k_base',
  'claude-3-5-haiku': 'cl100k_base',
};
