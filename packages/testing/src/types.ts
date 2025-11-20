/**
 * Test utilities type definitions for AI Kit
 */

// ============================================================================
// Core types (defined locally for compatibility)
// ============================================================================

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
  latency?: number;
  model?: string;
  cacheHit?: boolean;
}

export interface StreamConfig {
  endpoint: string;
  model?: string;
  systemPrompt?: string;
  onToken?: (token: string) => void;
  onCost?: (usage: Usage) => void;
  onError?: (error: Error) => void;
  retry?: any;
  cache?: any;
  timeout?: number;
  headers?: Record<string, string>;
}

// ============================================================================
// Agent-related types (defined locally since agents module may not be exported)
// ============================================================================

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'custom' | 'unknown';

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  metadata: {
    durationMs: number;
    timestamp: string;
    retryCount?: number;
  };
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  llm: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
  };
  tools: any[];
  maxSteps?: number;
  streaming?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AgentState {
  step: number;
  messages: Message[];
  pendingToolCalls: ToolCall[];
  toolResults: ToolResult[];
  isComplete: boolean;
  finalResponse?: string;
  error?: {
    message: string;
    step: number;
    cause?: unknown;
  };
}

export interface ExecutionTrace {
  executionId: string;
  agentId: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  events: any[];
  finalState?: AgentState;
  stats: {
    totalSteps: number;
    totalToolCalls: number;
    totalLLMCalls: number;
    successfulToolCalls: number;
    failedToolCalls: number;
  };
}

export interface ExecutionResult {
  response: string;
  state: AgentState;
  trace: ExecutionTrace;
  success: boolean;
  error?: Error;
}

export interface ExecutionConfig {
  maxSteps?: number;
  streaming?: boolean;
  onStream?: StreamCallback;
  verbose?: boolean;
  llmProvider?: any;
  context?: Record<string, unknown>;
}

export type StreamEventType =
  | 'start'
  | 'step'
  | 'thought'
  | 'tool_call'
  | 'tool_result'
  | 'text_chunk'
  | 'final_answer'
  | 'complete'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  timestamp: string;
  data: unknown;
}

export type StreamCallback = (event: StreamEvent) => void | Promise<void>;

export interface UsageRecord {
  id: string;
  timestamp: Date;
  userId?: string;
  conversationId?: string;
  provider: LLMProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  success: boolean;
  error?: string;
  cost: CostBreakdown;
  metadata?: Record<string, any>;
}

export interface CostBreakdown {
  promptCost: number;
  completionCost: number;
  totalCost: number;
  currency: 'USD';
}

export interface AggregatedUsage {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerRequest: number;
  avgDurationMs: number;
  byProvider: Record<LLMProvider, any>;
  byModel: Record<string, any>;
}

export interface UsageFilter {
  userId?: string;
  conversationId?: string;
  provider?: LLMProvider;
  model?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}

export type ExportFormat = 'json' | 'csv' | 'jsonl';

export interface TrackingConfig {
  enabled: boolean;
  storage: 'memory' | 'file' | 'database';
  filePath?: string;
  exportFormat?: ExportFormat;
  autoFlush?: boolean;
  flushIntervalMs?: number;
  maxRecords?: number;
}

// ============================================================================
// Mock Configuration Types
// ============================================================================

/**
 * Configuration for MockAIStream
 */
export interface MockAIStreamConfig extends Partial<StreamConfig> {
  /**
   * Mock responses to return
   */
  mockResponses?: string[];

  /**
   * Delay between tokens in ms
   */
  tokenDelay?: number;

  /**
   * Whether to simulate errors
   */
  simulateError?: boolean;

  /**
   * Error to throw (if simulateError is true)
   */
  error?: Error;

  /**
   * Mock usage statistics
   */
  mockUsage?: Partial<Usage>;

  /**
   * Number of retries before success
   */
  retriesBeforeSuccess?: number;
}

/**
 * Configuration for MockLLMProvider
 */
export interface MockLLMProviderConfig {
  /**
   * Provider name
   */
  provider: LLMProvider;

  /**
   * Model name
   */
  model: string;

  /**
   * Mock responses to return
   */
  mockResponses?: string[];

  /**
   * Mock tool calls to return
   */
  mockToolCalls?: ToolCall[];

  /**
   * Whether to simulate streaming
   */
  streaming?: boolean;

  /**
   * Delay between tokens in ms (for streaming)
   */
  tokenDelay?: number;

  /**
   * Whether to simulate errors
   */
  simulateError?: boolean;

  /**
   * Error to throw
   */
  error?: Error;

  /**
   * Mock usage statistics
   */
  mockUsage?: Partial<Usage>;
}

/**
 * Configuration for MockUsageTracker
 */
export interface MockUsageTrackerConfig extends Partial<TrackingConfig> {
  /**
   * Pre-populated usage records
   */
  initialRecords?: UsageRecord[];

  /**
   * Whether to actually track calls
   */
  trackCalls?: boolean;

  /**
   * Mock cost calculations
   */
  mockCostCalculation?: (
    promptTokens: number,
    completionTokens: number
  ) => number;
}

/**
 * Configuration for MockAgentExecutor
 */
export interface MockAgentExecutorConfig {
  /**
   * Agent configuration
   */
  agentConfig: AgentConfig;

  /**
   * Execution configuration
   */
  executionConfig?: ExecutionConfig;

  /**
   * Mock execution result
   */
  mockResult?: Partial<ExecutionResult>;

  /**
   * Mock tool results
   */
  mockToolResults?: ToolResult[];

  /**
   * Whether to simulate streaming
   */
  streaming?: boolean;

  /**
   * Whether to simulate errors
   */
  simulateError?: boolean;

  /**
   * Error to throw
   */
  error?: Error;

  /**
   * Number of steps to simulate
   */
  simulatedSteps?: number;
}

// ============================================================================
// Helper Function Types
// ============================================================================

/**
 * Options for creating test messages
 */
export interface CreateTestMessageOptions {
  /**
   * Message role
   */
  role?: 'user' | 'assistant' | 'system' | 'tool';

  /**
   * Message content
   */
  content?: string;

  /**
   * Message ID
   */
  id?: string;

  /**
   * Timestamp
   */
  timestamp?: number;

  /**
   * Tool calls (for assistant messages)
   */
  toolCalls?: ToolCall[];

  /**
   * Tool call ID (for tool messages)
   */
  toolCallId?: string;

  /**
   * Tool name (for tool messages)
   */
  name?: string;
}

/**
 * Options for waiting for stream completion
 */
export interface WaitForStreamOptions {
  /**
   * Maximum time to wait in ms
   */
  timeout?: number;

  /**
   * Expected number of messages
   */
  expectedMessages?: number;

  /**
   * Expected final message content
   */
  expectedContent?: string;

  /**
   * Whether to collect all tokens
   */
  collectTokens?: boolean;
}

/**
 * Result from waiting for stream
 */
export interface WaitForStreamResult {
  /**
   * All messages received
   */
  messages: Message[];

  /**
   * All tokens received (if collectTokens was true)
   */
  tokens?: string[];

  /**
   * Final usage statistics
   */
  usage: Usage;

  /**
   * Duration in ms
   */
  durationMs: number;

  /**
   * Whether stream completed successfully
   */
  completed: boolean;

  /**
   * Error if stream failed
   */
  error?: Error;
}

/**
 * Network error simulation options
 */
export interface NetworkErrorOptions {
  /**
   * Error type
   */
  type:
    | 'timeout'
    | 'connection_refused'
    | 'dns_failure'
    | 'ssl_error'
    | 'rate_limit'
    | 'server_error'
    | 'network_unreachable';

  /**
   * Custom error message
   */
  message?: string;

  /**
   * HTTP status code (for server errors)
   */
  statusCode?: number;

  /**
   * Retry-After header value (for rate limits)
   */
  retryAfter?: number;

  /**
   * Additional error metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * SSE response mock options
 */
export interface MockSSEResponseOptions {
  /**
   * Events to send
   */
  events: Array<{
    type?: string;
    data: string;
    id?: string;
    retry?: number;
  }>;

  /**
   * Delay between events in ms
   */
  eventDelay?: number;

  /**
   * Whether to simulate connection errors
   */
  simulateError?: boolean;

  /**
   * Error to throw
   */
  error?: Error;

  /**
   * When to throw error (event index)
   */
  errorAfterEvent?: number;
}

// ============================================================================
// Custom Matcher Types
// ============================================================================

/**
 * Options for toHaveStreamed matcher
 */
export interface ToHaveStreamedOptions {
  /**
   * Minimum number of tokens expected
   */
  minTokens?: number;

  /**
   * Maximum number of tokens expected
   */
  maxTokens?: number;

  /**
   * Expected content (partial match)
   */
  content?: string;

  /**
   * Whether streaming should have completed
   */
  completed?: boolean;
}

/**
 * Options for toHaveCost matcher
 */
export interface ToHaveCostOptions {
  /**
   * Exact cost expected
   */
  exact?: number;

  /**
   * Minimum cost expected
   */
  min?: number;

  /**
   * Maximum cost expected
   */
  max?: number;

  /**
   * Tolerance for comparison (default: 0.0001)
   */
  tolerance?: number;

  /**
   * Expected currency
   */
  currency?: string;
}

/**
 * Options for toMatchTokenCount matcher
 */
export interface ToMatchTokenCountOptions {
  /**
   * Expected prompt tokens
   */
  promptTokens?: number;

  /**
   * Expected completion tokens
   */
  completionTokens?: number;

  /**
   * Expected total tokens
   */
  totalTokens?: number;

  /**
   * Tolerance for comparison
   */
  tolerance?: number;

  /**
   * Whether to allow approximate matches
   */
  approximate?: boolean;
}

/**
 * Options for toHaveError matcher
 */
export interface ToHaveErrorOptions {
  /**
   * Expected error message (partial match)
   */
  message?: string;

  /**
   * Expected error type/class
   */
  type?: string | Function;

  /**
   * Expected error code
   */
  code?: string;

  /**
   * Expected error metadata
   */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Test Fixture Types
// ============================================================================

/**
 * Test conversation fixture
 */
export interface TestConversation {
  /**
   * Conversation ID
   */
  id: string;

  /**
   * Messages in the conversation
   */
  messages: Message[];

  /**
   * Usage statistics
   */
  usage: Usage;

  /**
   * Metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Test usage record fixture
 */
export interface TestUsageRecord extends Partial<UsageRecord> {
  /**
   * Override any fields as needed
   */
  [key: string]: unknown;
}

/**
 * Test tool call fixture
 */
export interface TestToolCall extends Partial<ToolCall> {
  /**
   * Override any fields as needed
   */
  [key: string]: unknown;
}

/**
 * Test execution trace fixture
 */
export interface TestExecutionTrace {
  /**
   * Execution ID
   */
  executionId: string;

  /**
   * Agent ID
   */
  agentId: string;

  /**
   * Number of steps
   */
  steps: number;

  /**
   * Number of tool calls
   */
  toolCalls: number;

  /**
   * Whether execution was successful
   */
  success: boolean;

  /**
   * Final response
   */
  response?: string;

  /**
   * Error if failed
   */
  error?: Error;
}

// ============================================================================
// Assertion Types
// ============================================================================

/**
 * Streaming assertion helpers
 */
export interface StreamingAssertion {
  /**
   * Assert that streaming occurred
   */
  occurred: boolean;

  /**
   * Number of tokens streamed
   */
  tokenCount: number;

  /**
   * Collected tokens
   */
  tokens: string[];

  /**
   * Final content
   */
  finalContent: string;

  /**
   * Duration in ms
   */
  durationMs: number;
}

/**
 * Cost assertion helpers
 */
export interface CostAssertion {
  /**
   * Total cost
   */
  totalCost: number;

  /**
   * Prompt cost
   */
  promptCost: number;

  /**
   * Completion cost
   */
  completionCost: number;

  /**
   * Currency
   */
  currency: string;

  /**
   * Cost breakdown by provider
   */
  byProvider?: Record<string, number>;
}

/**
 * Token count assertion helpers
 */
export interface TokenCountAssertion {
  /**
   * Prompt tokens
   */
  promptTokens: number;

  /**
   * Completion tokens
   */
  completionTokens: number;

  /**
   * Total tokens
   */
  totalTokens: number;

  /**
   * Matches expected count
   */
  matches: boolean;

  /**
   * Difference from expected
   */
  difference?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Error assertion helpers
 */
export interface ErrorAssertion {
  /**
   * Whether error exists
   */
  hasError: boolean;

  /**
   * Error message
   */
  message?: string;

  /**
   * Error type
   */
  type?: string;

  /**
   * Error code
   */
  code?: string;

  /**
   * Error stack
   */
  stack?: string;

  /**
   * Error metadata
   */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Vitest Custom Matcher Declarations
// ============================================================================

export interface CustomMatchers<R = unknown> {
  /**
   * Assert that streaming occurred with optional constraints
   */
  toHaveStreamed(options?: ToHaveStreamedOptions): R;

  /**
   * Assert cost calculations
   */
  toHaveCost(options?: ToHaveCostOptions): R;

  /**
   * Assert token counts
   */
  toMatchTokenCount(options?: ToMatchTokenCountOptions): R;

  /**
   * Assert error states
   */
  toHaveError(options?: ToHaveErrorOptions): R;
}

// Module augmentation for Vitest (optional - can be done in user code)
// Commented out to avoid build errors when vitest is not installed
// declare module 'vitest' {
//   interface Assertion<T = any> extends CustomMatchers<T> {}
//   interface AsymmetricMatchersContaining extends CustomMatchers {}
// }
