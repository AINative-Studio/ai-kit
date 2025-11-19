/**
 * AIKIT Agent Orchestration System - Type Definitions
 *
 * This module defines the core types for the AI agent execution framework.
 * Provides type-safe interfaces for agents, tools, and execution traces.
 */

import { z } from 'zod';

// ============================================================================
// Tool Definition Types
// ============================================================================

/**
 * Schema definition for tool parameters using Zod
 */
export type ToolParameterSchema = z.ZodObject<any> | z.ZodType<any>;

/**
 * Tool metadata and configuration
 */
export interface ToolDefinition<TParams = any, TResult = any> {
  /**
   * Unique identifier for the tool
   */
  name: string;

  /**
   * Human-readable description of what the tool does
   * This is used by the LLM to understand when to use the tool
   */
  description: string;

  /**
   * Zod schema for validating tool parameters
   */
  parameters: ToolParameterSchema;

  /**
   * The actual function that executes the tool
   * @param params - Validated parameters matching the schema
   * @returns Promise resolving to the tool result
   */
  execute: (params: TParams) => Promise<TResult>;

  /**
   * Optional retry configuration
   */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };

  /**
   * Optional timeout in milliseconds
   */
  timeoutMs?: number;

  /**
   * Optional metadata for categorization and filtering
   */
  metadata?: Record<string, unknown>;
}

/**
 * Runtime tool call request from the LLM
 */
export interface ToolCall {
  /**
   * Unique ID for this specific tool call invocation
   */
  id: string;

  /**
   * Name of the tool to execute
   */
  name: string;

  /**
   * Parameters to pass to the tool (validated against schema)
   */
  parameters: Record<string, unknown>;
}

/**
 * Result of a tool execution
 */
export interface ToolResult {
  /**
   * ID of the tool call this result corresponds to
   */
  toolCallId: string;

  /**
   * Name of the tool that was executed
   */
  toolName: string;

  /**
   * The result data from the tool execution
   */
  result: unknown;

  /**
   * Error information if the tool execution failed
   */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };

  /**
   * Execution metadata
   */
  metadata: {
    durationMs: number;
    timestamp: string;
    retryCount?: number;
  };
}

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Agent configuration
 */
export interface AgentConfig {
  /**
   * Unique identifier for the agent
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Description of the agent's purpose and capabilities
   */
  description?: string;

  /**
   * System prompt that defines the agent's behavior
   */
  systemPrompt: string;

  /**
   * LLM provider configuration
   */
  llm: {
    provider: 'openai' | 'anthropic' | 'google' | 'custom';
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    apiKey?: string;
    baseUrl?: string;
  };

  /**
   * Tools available to this agent
   */
  tools: ToolDefinition[];

  /**
   * Maximum number of execution steps before stopping
   */
  maxSteps?: number;

  /**
   * Whether to enable streaming responses
   */
  streaming?: boolean;

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Message in the agent conversation
 */
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string; // For tool messages
  toolCalls?: ToolCall[];
  toolCallId?: string; // For tool result messages
  timestamp?: string;
}

/**
 * Agent state during execution
 */
export interface AgentState {
  /**
   * Current step number in the execution
   */
  step: number;

  /**
   * Conversation history
   */
  messages: Message[];

  /**
   * Pending tool calls waiting to be executed
   */
  pendingToolCalls: ToolCall[];

  /**
   * Results from completed tool calls
   */
  toolResults: ToolResult[];

  /**
   * Whether the agent has finished execution
   */
  isComplete: boolean;

  /**
   * Final response if execution is complete
   */
  finalResponse?: string;

  /**
   * Error information if execution failed
   */
  error?: {
    message: string;
    step: number;
    cause?: unknown;
  };
}

// ============================================================================
// Execution Trace Types
// ============================================================================

/**
 * Types of events in the execution trace
 */
export type TraceEventType =
  | 'agent_start'
  | 'agent_end'
  | 'llm_request'
  | 'llm_response'
  | 'llm_stream_start'
  | 'llm_stream_chunk'
  | 'llm_stream_end'
  | 'tool_call_request'
  | 'tool_call_start'
  | 'tool_call_end'
  | 'tool_call_error'
  | 'step_start'
  | 'step_end'
  | 'error';

/**
 * Individual trace event
 */
export interface TraceEvent {
  /**
   * Event type
   */
  type: TraceEventType;

  /**
   * Timestamp when the event occurred
   */
  timestamp: string;

  /**
   * Step number during which this event occurred
   */
  step?: number;

  /**
   * Event-specific data
   */
  data: Record<string, unknown>;

  /**
   * Duration in milliseconds (for start/end pairs)
   */
  durationMs?: number;
}

/**
 * Complete execution trace
 */
export interface ExecutionTrace {
  /**
   * Unique execution ID
   */
  executionId: string;

  /**
   * Agent ID
   */
  agentId: string;

  /**
   * Start timestamp
   */
  startTime: string;

  /**
   * End timestamp
   */
  endTime?: string;

  /**
   * Total duration in milliseconds
   */
  durationMs?: number;

  /**
   * All trace events in chronological order
   */
  events: TraceEvent[];

  /**
   * Final agent state
   */
  finalState?: AgentState;

  /**
   * Execution statistics
   */
  stats: {
    totalSteps: number;
    totalToolCalls: number;
    totalLLMCalls: number;
    totalTokensUsed?: number;
    successfulToolCalls: number;
    failedToolCalls: number;
  };
}

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Streaming event types
 */
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

/**
 * Base streaming event
 */
export interface StreamEvent {
  type: StreamEventType;
  timestamp: string;
  data: unknown;
}

/**
 * Streaming callback handler
 */
export type StreamCallback = (event: StreamEvent) => void | Promise<void>;

/**
 * Agent step event for streaming
 */
export interface AgentStepEvent {
  /**
   * Event type identifier
   */
  type: 'step';

  /**
   * Current step number
   */
  step: number;

  /**
   * Step timestamp
   */
  timestamp: string;

  /**
   * Step metadata
   */
  metadata?: {
    messagesCount?: number;
    pendingToolCalls?: number;
  };
}

/**
 * Thought event - agent's reasoning/thinking
 */
export interface ThoughtEvent {
  /**
   * Event type identifier
   */
  type: 'thought';

  /**
   * The thought/reasoning content
   */
  content: string;

  /**
   * Step number during which this thought occurred
   */
  step: number;

  /**
   * Event timestamp
   */
  timestamp: string;
}

/**
 * Tool call event
 */
export interface ToolCallEvent {
  /**
   * Event type identifier
   */
  type: 'tool_call';

  /**
   * The tool call details
   */
  toolCall: ToolCall;

  /**
   * Step number
   */
  step: number;

  /**
   * Event timestamp
   */
  timestamp: string;
}

/**
 * Tool result event
 */
export interface ToolResultEvent {
  /**
   * Event type identifier
   */
  type: 'tool_result';

  /**
   * The tool execution result
   */
  result: ToolResult;

  /**
   * Step number
   */
  step: number;

  /**
   * Event timestamp
   */
  timestamp: string;
}

/**
 * Final answer event
 */
export interface FinalAnswerEvent {
  /**
   * Event type identifier
   */
  type: 'final_answer';

  /**
   * The final answer/response
   */
  answer: string;

  /**
   * Step number
   */
  step: number;

  /**
   * Event timestamp
   */
  timestamp: string;
}

/**
 * Error event
 */
export interface ErrorEvent {
  /**
   * Event type identifier
   */
  type: 'error';

  /**
   * Error message
   */
  error: string;

  /**
   * Error code
   */
  code?: string;

  /**
   * Step number where error occurred
   */
  step?: number;

  /**
   * Event timestamp
   */
  timestamp: string;
}

/**
 * Union type of all agent execution streaming events
 */
export type AgentExecutionEvent =
  | AgentStepEvent
  | ThoughtEvent
  | ToolCallEvent
  | ToolResultEvent
  | FinalAnswerEvent
  | ErrorEvent;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error for agent system
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

/**
 * Tool execution error
 */
export class ToolExecutionError extends AgentError {
  constructor(
    message: string,
    public toolName: string,
    public toolCallId: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'TOOL_EXECUTION_ERROR', { ...context, toolName, toolCallId });
    this.name = 'ToolExecutionError';
  }
}

/**
 * Tool validation error
 */
export class ToolValidationError extends AgentError {
  constructor(
    message: string,
    public toolName: string,
    public validationErrors: z.ZodError,
    context?: Record<string, unknown>
  ) {
    super(message, 'TOOL_VALIDATION_ERROR', {
      ...context,
      toolName,
      errors: validationErrors.errors,
    });
    this.name = 'ToolValidationError';
  }
}

/**
 * LLM error
 */
export class LLMError extends AgentError {
  constructor(
    message: string,
    public provider: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'LLM_ERROR', { ...context, provider });
    this.name = 'LLMError';
  }
}

/**
 * Max steps exceeded error
 */
export class MaxStepsExceededError extends AgentError {
  constructor(maxSteps: number, context?: Record<string, unknown>) {
    super(
      `Agent exceeded maximum steps: ${maxSteps}`,
      'MAX_STEPS_EXCEEDED',
      { ...context, maxSteps }
    );
    this.name = 'MaxStepsExceededError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract parameter type from tool definition
 */
export type ToolParams<T extends ToolDefinition> = T extends ToolDefinition<
  infer P,
  any
>
  ? P
  : never;

/**
 * Extract result type from tool definition
 */
export type ToolResultType<T extends ToolDefinition> = T extends ToolDefinition<
  any,
  infer R
>
  ? R
  : never;

/**
 * Type-safe tool registry
 */
export type ToolRegistry = Map<string, ToolDefinition>;

// ============================================================================
// Agent Swarm Types
// ============================================================================

/**
 * Role of an agent in the swarm
 */
export type AgentRole = 'supervisor' | 'specialist';

/**
 * Specialist agent configuration for swarm
 */
export interface SpecialistAgent {
  /**
   * Unique identifier for the specialist
   */
  id: string;

  /**
   * Agent instance
   */
  agent: any; // Will be Agent type, avoiding circular dependency

  /**
   * Specialization area/domain
   */
  specialization: string;

  /**
   * Keywords/tags that trigger this specialist
   */
  keywords?: string[];

  /**
   * Priority when multiple specialists match (higher = preferred)
   */
  priority?: number;

  /**
   * Whether this specialist can handle multiple tasks concurrently
   */
  concurrent?: boolean;
}

/**
 * Task routing decision
 */
export interface TaskRoutingDecision {
  /**
   * ID of the specialist agent to handle the task
   */
  specialistId: string;

  /**
   * Reason for routing to this specialist
   */
  reason: string;

  /**
   * Confidence score (0-1)
   */
  confidence: number;
}

/**
 * Specialist execution result
 */
export interface SpecialistResult {
  /**
   * ID of the specialist that executed the task
   */
  specialistId: string;

  /**
   * Specialization area
   */
  specialization: string;

  /**
   * Response from the specialist
   */
  response: string;

  /**
   * Execution trace from the specialist
   */
  trace: ExecutionTrace;

  /**
   * Whether execution was successful
   */
  success: boolean;

  /**
   * Error if execution failed
   */
  error?: Error;

  /**
   * Execution metadata
   */
  metadata: {
    startTime: string;
    endTime: string;
    durationMs: number;
  };
}

/**
 * Configuration for AgentSwarm
 */
export interface SwarmConfig {
  /**
   * Unique identifier for the swarm
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Description of the swarm's purpose
   */
  description?: string;

  /**
   * Supervisor agent that coordinates specialists
   */
  supervisor: any; // Will be Agent type, avoiding circular dependency

  /**
   * Specialist agents in the swarm
   */
  specialists: SpecialistAgent[];

  /**
   * Maximum number of concurrent specialist executions
   */
  maxConcurrent?: number;

  /**
   * Whether to enable parallel execution of independent tasks
   */
  parallelExecution?: boolean;

  /**
   * Timeout for specialist executions (milliseconds)
   */
  specialistTimeoutMs?: number;

  /**
   * Custom routing strategy
   */
  customRouter?: (
    task: string,
    specialists: SpecialistAgent[]
  ) => Promise<TaskRoutingDecision>;

  /**
   * Custom result synthesizer
   */
  customSynthesizer?: (
    results: SpecialistResult[]
  ) => Promise<string>;

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Swarm execution result
 */
export interface SwarmResult {
  /**
   * Final synthesized response
   */
  response: string;

  /**
   * Results from individual specialists
   */
  specialistResults: SpecialistResult[];

  /**
   * Combined execution trace from all agents
   */
  combinedTrace: ExecutionTrace;

  /**
   * Supervisor's decision-making trace
   */
  supervisorTrace: ExecutionTrace;

  /**
   * Whether execution was successful
   */
  success: boolean;

  /**
   * Error if execution failed
   */
  error?: Error;

  /**
   * Execution statistics
   */
  stats: {
    totalSpecialistsInvoked: number;
    successfulSpecialists: number;
    failedSpecialists: number;
    totalDurationMs: number;
    parallelExecutions: number;
  };
}
