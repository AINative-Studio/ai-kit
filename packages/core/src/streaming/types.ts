/**
 * Streaming types for SSE (Server-Sent Events) responses
 */

/**
 * LLM Provider enum
 */
export const LLMProvider = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
} as const;

export type LLMProvider = (typeof LLMProvider)[keyof typeof LLMProvider];

/**
 * SSE event types
 */
export const SSEEventType = {
  START: 'start',
  TOKEN: 'token',
  USAGE: 'usage',
  ERROR: 'error',
  METADATA: 'metadata',
  DONE: 'done',
} as const;

export type SSEEventType = (typeof SSEEventType)[keyof typeof SSEEventType];

/**
 * SSE message structure
 */
export interface SSEMessage {
  event?: string;
  data: unknown;
  id?: string;
  retry?: number;
}

/**
 * Token event data
 */
export interface TokenEvent {
  token: string;
  index?: number;
}

/**
 * Usage event data
 */
export interface UsageEvent {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider?: LLMProvider;
}

/**
 * Error event data
 */
export interface ErrorEvent {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Metadata event data
 */
export interface MetadataEvent {
  [key: string]: unknown;
}

/**
 * Streaming options configuration
 */
export interface StreamingOptions {
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  compressionEnabled?: boolean;
  customHeaders?: Record<string, string>;
}

/**
 * Response-like interface for Node.js/Express responses
 */
export interface ResponseLike {
  setHeader(name: string, value: string): void;
  writeHead?(statusCode: number, headers?: Record<string, string>): void;
  write(chunk: string): boolean;
  end(): void;
  on?(event: string, callback: () => void): void;
}

/**
 * OpenAI streaming chunk structure
 */
export interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Anthropic streaming chunk structure
 */
export interface AnthropicStreamChunk {
  type: string;
  index?: number;
  message?: {
    id: string;
    type: string;
    role: string;
    model: string;
    content: unknown[];
    usage?: {
      input_tokens: number;
      output_tokens?: number;
    };
  };
  content_block?: {
    type: string;
    text: string;
  };
  delta?: {
    type?: string;
    text?: string;
    stop_reason?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens: number;
  };
}
