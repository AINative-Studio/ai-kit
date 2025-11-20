/**
 * React hooks type definitions for AI Kit
 * Comprehensive types for React hooks and their return values
 */

import type { DependencyList, RefObject } from 'react';
import type {
  Message,
  StreamConfig,
  StreamState,
  StreamEvent,
  UsageStats,
  StreamCallbacks,
  AgentId,
  SessionId,
  ModelId,
  ToolId,
  JsonValue,
} from '@ainative/ai-kit-core';

// ============================================================================
// useAIStream Hook Types
// ============================================================================

/**
 * AI Stream hook options
 */
export interface UseAIStreamOptions extends Omit<StreamConfig, 'endpoint'> {
  readonly initialMessages?: readonly Message[];
  readonly onStart?: StreamCallbacks['onStart'];
  readonly onToken?: StreamCallbacks['onToken'];
  readonly onContent?: StreamCallbacks['onContent'];
  readonly onDone?: StreamCallbacks['onDone'];
  readonly onError?: StreamCallbacks['onError'];
  readonly onUsage?: StreamCallbacks['onUsage'];
  readonly autoSend?: boolean;
  readonly persistMessages?: boolean;
  readonly storageKey?: string;
}

/**
 * AI Stream hook return type
 */
export interface UseAIStreamReturn {
  readonly messages: readonly Message[];
  readonly input: string;
  readonly setInput: (input: string) => void;
  readonly isStreaming: boolean;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly usage: UsageStats;
  readonly state: StreamState;

  // Actions
  send(message?: string): Promise<void>;
  sendMessage(message: Partial<Message>): Promise<void>;
  stop(): void;
  reset(): void;
  retry(): Promise<void>;
  pause(): void;
  resume(): void;

  // Message management
  appendMessage(message: Partial<Message>): void;
  updateMessage(id: string, updates: Partial<Message>): void;
  deleteMessage(id: string): void;
  clearMessages(): void;
}

// ============================================================================
// useChat Hook Types
// ============================================================================

/**
 * Chat hook options
 */
export interface UseChatOptions extends UseAIStreamOptions {
  readonly id?: string;
  readonly api?: string;
  readonly body?: Record<string, JsonValue>;
  readonly credentials?: RequestCredentials;
  readonly sendExtraMessageFields?: boolean;
}

/**
 * Chat hook return type
 */
export interface UseChatReturn extends UseAIStreamReturn {
  readonly isLoading: boolean;
  readonly data?: readonly JsonValue[];
  reload(): Promise<void>;
}

// ============================================================================
// useCompletion Hook Types
// ============================================================================

/**
 * Completion hook options
 */
export interface UseCompletionOptions {
  readonly api?: string;
  readonly id?: string;
  readonly initialCompletion?: string;
  readonly initialInput?: string;
  readonly onResponse?: (response: Response) => void | Promise<void>;
  readonly onFinish?: (prompt: string, completion: string) => void | Promise<void>;
  readonly onError?: (error: Error) => void | Promise<void>;
  readonly credentials?: RequestCredentials;
  readonly headers?: Record<string, string>;
  readonly body?: Record<string, JsonValue>;
}

/**
 * Completion hook return type
 */
export interface UseCompletionReturn {
  readonly completion: string;
  readonly input: string;
  readonly setInput: (input: string) => void;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly stop: () => void;
  readonly complete: (prompt: string) => Promise<string>;
  readonly setCompletion: (completion: string) => void;
}

// ============================================================================
// useAgent Hook Types
// ============================================================================

/**
 * Agent hook options
 */
export interface UseAgentOptions {
  readonly agentId?: AgentId;
  readonly sessionId?: SessionId;
  readonly config?: Record<string, JsonValue>;
  readonly tools?: readonly ToolId[];
  readonly onAction?: (action: AgentAction) => void | Promise<void>;
  readonly onStateChange?: (state: AgentState) => void | Promise<void>;
  readonly onError?: (error: Error) => void | Promise<void>;
}

/**
 * Agent action for hook
 */
export interface AgentAction {
  readonly type: string;
  readonly data: JsonValue;
  readonly timestamp: number;
}

/**
 * Agent state for hook
 */
export interface AgentState {
  readonly status: 'idle' | 'thinking' | 'working' | 'done' | 'error';
  readonly progress?: number;
  readonly currentTask?: string;
}

/**
 * Agent hook return type
 */
export interface UseAgentReturn {
  readonly state: AgentState;
  readonly actions: readonly AgentAction[];
  readonly isExecuting: boolean;
  readonly error: Error | null;

  execute(input: string | JsonValue): Promise<JsonValue>;
  executeTask(task: Task): Promise<TaskResult>;
  stop(): void;
  reset(): void;
}

/**
 * Task for agent execution
 */
export interface Task {
  readonly id: string;
  readonly description: string;
  readonly context?: JsonValue;
}

/**
 * Task result
 */
export interface TaskResult {
  readonly success: boolean;
  readonly output?: JsonValue;
  readonly error?: Error;
}

// ============================================================================
// useModel Hook Types
// ============================================================================

/**
 * Model hook options
 */
export interface UseModelOptions {
  readonly modelId?: ModelId;
  readonly provider?: string;
  readonly parameters?: Record<string, JsonValue>;
  readonly onResponse?: (response: string) => void | Promise<void>;
  readonly onError?: (error: Error) => void | Promise<void>;
}

/**
 * Model hook return type
 */
export interface UseModelReturn {
  readonly response: string;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly usage: UsageStats;

  generate(prompt: string): Promise<string>;
  stream(prompt: string): AsyncIterableIterator<string>;
  stop(): void;
}

// ============================================================================
// useTool Hook Types
// ============================================================================

/**
 * Tool hook options
 */
export interface UseToolOptions {
  readonly toolId?: ToolId;
  readonly onSuccess?: (result: JsonValue) => void | Promise<void>;
  readonly onError?: (error: Error) => void | Promise<void>;
  readonly autoExecute?: boolean;
}

/**
 * Tool hook return type
 */
export interface UseToolReturn {
  readonly result: JsonValue | null;
  readonly isExecuting: boolean;
  readonly error: Error | null;

  execute(input: Record<string, JsonValue>): Promise<JsonValue>;
  reset(): void;
}

// ============================================================================
// useMemory Hook Types
// ============================================================================

/**
 * Memory hook options
 */
export interface UseMemoryOptions {
  readonly sessionId?: SessionId;
  readonly maxSize?: number;
  readonly persistToDisk?: boolean;
  readonly embeddings?: boolean;
}

/**
 * Memory entry
 */
export interface MemoryEntry {
  readonly id: string;
  readonly content: string;
  readonly type: 'episodic' | 'semantic' | 'procedural' | 'working';
  readonly timestamp: number;
  readonly importance: number;
}

/**
 * Memory hook return type
 */
export interface UseMemoryReturn {
  readonly memories: readonly MemoryEntry[];
  readonly isLoading: boolean;
  readonly error: Error | null;

  remember(content: string, type?: MemoryEntry['type']): Promise<void>;
  recall(query: string): Promise<readonly MemoryEntry[]>;
  forget(id: string): Promise<void>;
  clear(): Promise<void>;
}

// ============================================================================
// useContext Hook Types (AI Context, not React Context)
// ============================================================================

/**
 * AI Context hook options
 */
export interface UseAIContextOptions {
  readonly maxTokens?: number;
  readonly windowSize?: number;
  readonly compressionEnabled?: boolean;
}

/**
 * AI Context hook return type
 */
export interface UseAIContextReturn {
  readonly context: readonly Message[];
  readonly tokenCount: number;
  readonly isCompressed: boolean;

  addToContext(message: Message): void;
  removeFromContext(messageId: string): void;
  compressContext(): Promise<void>;
  clearContext(): void;
  getContext(): readonly Message[];
}

// ============================================================================
// useRLHF Hook Types
// ============================================================================

/**
 * RLHF hook options
 */
export interface UseRLHFOptions {
  readonly sessionId?: SessionId;
  readonly onFeedback?: (feedback: Feedback) => void | Promise<void>;
}

/**
 * Feedback type
 */
export interface Feedback {
  readonly messageId: string;
  readonly rating: number; // 0-1
  readonly comment?: string;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * RLHF hook return type
 */
export interface UseRLHFReturn {
  readonly feedback: readonly Feedback[];

  provideFeedback(messageId: string, rating: number, comment?: string): Promise<void>;
  getFeedback(messageId: string): Feedback | undefined;
  clearFeedback(): void;
}

// ============================================================================
// useDebounce Hook Types
// ============================================================================

/**
 * Debounce hook return type
 */
export type UseDebouncedValue<T> = T;

// ============================================================================
// useThrottle Hook Types
// ============================================================================

/**
 * Throttle hook return type
 */
export type UseThrottledValue<T> = T;

// ============================================================================
// useAsync Hook Types
// ============================================================================

/**
 * Async hook options
 */
export interface UseAsyncOptions<T> {
  readonly immediate?: boolean;
  readonly onSuccess?: (data: T) => void | Promise<void>;
  readonly onError?: (error: Error) => void | Promise<void>;
}

/**
 * Async hook return type
 */
export interface UseAsyncReturn<T, Args extends readonly unknown[] = readonly []> {
  readonly data: T | null;
  readonly error: Error | null;
  readonly isLoading: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;

  execute(...args: Args): Promise<T>;
  reset(): void;
}

// ============================================================================
// useLocalStorage Hook Types
// ============================================================================

/**
 * Local storage hook options
 */
export interface UseLocalStorageOptions<T> {
  readonly serializer?: (value: T) => string;
  readonly deserializer?: (value: string) => T;
  readonly syncTabs?: boolean;
}

/**
 * Local storage hook return type
 */
export type UseLocalStorageReturn<T> = readonly [
  T,
  (value: T | ((prev: T) => T)) => void,
  () => void
];

// ============================================================================
// useWebSocket Hook Types
// ============================================================================

/**
 * WebSocket hook options
 */
export interface UseWebSocketOptions {
  readonly protocols?: string | readonly string[];
  readonly reconnect?: boolean;
  readonly reconnectAttempts?: number;
  readonly reconnectInterval?: number;
  readonly onOpen?: (event: Event) => void;
  readonly onClose?: (event: CloseEvent) => void;
  readonly onError?: (event: Event) => void;
  readonly onMessage?: (event: MessageEvent) => void;
}

/**
 * WebSocket ready state
 */
export enum WebSocketReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

/**
 * WebSocket hook return type
 */
export interface UseWebSocketReturn {
  readonly readyState: WebSocketReadyState;
  readonly lastMessage: MessageEvent | null;
  readonly isConnected: boolean;

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  reconnect(): void;
  close(): void;
}

// ============================================================================
// useInterval Hook Types
// ============================================================================

/**
 * Interval hook callback
 */
export type IntervalCallback = () => void | Promise<void>;

// ============================================================================
// useTimeout Hook Types
// ============================================================================

/**
 * Timeout hook callback
 */
export type TimeoutCallback = () => void | Promise<void>;

// ============================================================================
// useEventListener Hook Types
// ============================================================================

/**
 * Event listener hook options
 */
export interface UseEventListenerOptions {
  readonly passive?: boolean;
  readonly capture?: boolean;
  readonly once?: boolean;
}

// ============================================================================
// useIntersectionObserver Hook Types
// ============================================================================

/**
 * Intersection observer hook options
 */
export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  readonly freezeOnceVisible?: boolean;
  readonly onChange?: (entry: IntersectionObserverEntry) => void;
}

/**
 * Intersection observer hook return type
 */
export interface UseIntersectionObserverReturn {
  readonly ref: RefObject<Element>;
  readonly isIntersecting: boolean;
  readonly entry: IntersectionObserverEntry | null;
}

// ============================================================================
// useResizeObserver Hook Types
// ============================================================================

/**
 * Resize observer hook callback
 */
export type ResizeObserverCallback = (entry: ResizeObserverEntry) => void;

/**
 * Resize observer hook return type
 */
export interface UseResizeObserverReturn {
  readonly ref: RefObject<Element>;
  readonly width: number;
  readonly height: number;
  readonly entry: ResizeObserverEntry | null;
}

// ============================================================================
// usePrevious Hook Types
// ============================================================================

/**
 * Previous hook return type
 */
export type UsePreviousReturn<T> = T | undefined;

// ============================================================================
// useToggle Hook Types
// ============================================================================

/**
 * Toggle hook return type
 */
export type UseToggleReturn = readonly [
  boolean,
  () => void,
  (value: boolean) => void
];

// ============================================================================
// useCounter Hook Types
// ============================================================================

/**
 * Counter hook return type
 */
export interface UseCounterReturn {
  readonly count: number;
  readonly increment: () => void;
  readonly decrement: () => void;
  readonly reset: () => void;
  readonly set: (value: number) => void;
}

// ============================================================================
// useClipboard Hook Types
// ============================================================================

/**
 * Clipboard hook options
 */
export interface UseClipboardOptions {
  readonly timeout?: number;
  readonly onSuccess?: () => void;
  readonly onError?: (error: Error) => void;
}

/**
 * Clipboard hook return type
 */
export interface UseClipboardReturn {
  readonly value: string;
  readonly isCopied: boolean;
  readonly error: Error | null;

  copy(text: string): Promise<void>;
  reset(): void;
}
