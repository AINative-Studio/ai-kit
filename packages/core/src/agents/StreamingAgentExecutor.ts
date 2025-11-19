/**
 * AIKIT StreamingAgentExecutor - Streaming Agent Execution with Async Iterators
 *
 * This module provides streaming execution capabilities for agents,
 * allowing real-time updates as the agent thinks, calls tools, and generates responses.
 */

import { Agent } from './Agent';
import {
  AgentState,
  Message,
  ToolCall,
  ToolResult,
  ExecutionTrace,
  TraceEvent,
  AgentExecutionEvent,
  AgentStepEvent,
  ThoughtEvent,
  ToolCallEvent,
  ToolResultEvent,
  FinalAnswerEvent,
  ErrorEvent,
  MaxStepsExceededError,
  LLMError,
  AgentError,
} from './types';
import { generateId } from '../utils/id';
import { LLMProvider } from './llm/LLMProvider';
import { OpenAIProvider } from './llm/OpenAIProvider';
import { AnthropicProvider } from './llm/AnthropicProvider';

/**
 * Configuration for streaming execution
 */
export interface StreamingExecutionConfig {
  /**
   * Maximum number of steps before stopping
   */
  maxSteps?: number;

  /**
   * Custom LLM provider instance
   */
  llmProvider?: LLMProvider;

  /**
   * Whether to include detailed traces
   */
  verbose?: boolean;

  /**
   * Additional context to include in execution
   */
  context?: Record<string, unknown>;
}

/**
 * Complete streaming execution result
 */
export interface StreamingExecutionResult {
  /**
   * Final response from the agent
   */
  response: string;

  /**
   * Final agent state
   */
  state: AgentState;

  /**
   * Complete execution trace
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
}

/**
 * StreamingAgentExecutor - Provides async iterator-based streaming execution
 *
 * Usage:
 * ```typescript
 * const executor = new StreamingAgentExecutor(agent);
 * for await (const event of executor.stream(input)) {
 *   if (event.type === 'thought') {
 *     console.log('Agent thinking:', event.content);
 *   } else if (event.type === 'tool_call') {
 *     console.log('Calling tool:', event.toolCall.name);
 *   } else if (event.type === 'final_answer') {
 *     console.log('Final answer:', event.answer);
 *   }
 * }
 * ```
 */
export class StreamingAgentExecutor {
  private agent: Agent;
  private llmProvider: LLMProvider;
  private executionId: string;
  private trace: ExecutionTrace;
  private state: AgentState;

  constructor(agent: Agent, config?: StreamingExecutionConfig) {
    this.agent = agent;
    this.executionId = generateId('exec');

    // Initialize LLM provider
    if (config?.llmProvider) {
      this.llmProvider = config.llmProvider;
    } else {
      this.llmProvider = this.createLLMProvider(agent.config.llm);
    }

    // Initialize trace
    this.trace = {
      executionId: this.executionId,
      agentId: agent.config.id,
      startTime: new Date().toISOString(),
      events: [],
      stats: {
        totalSteps: 0,
        totalToolCalls: 0,
        totalLLMCalls: 0,
        successfulToolCalls: 0,
        failedToolCalls: 0,
      },
    };

    // Initialize state
    this.state = {
      step: 0,
      messages: [],
      pendingToolCalls: [],
      toolResults: [],
      isComplete: false,
    };
  }

  /**
   * Stream agent execution as an async iterator
   * Yields events as the agent progresses through execution
   */
  async *stream(
    input: string,
    config?: StreamingExecutionConfig
  ): AsyncGenerator<AgentExecutionEvent, StreamingExecutionResult, undefined> {
    const startTime = Date.now();

    try {
      // Add trace event for agent start
      this.addTraceEvent({
        type: 'agent_start',
        timestamp: new Date().toISOString(),
        data: {
          input,
          agentId: this.agent.config.id,
          config,
        },
      });

      // Build initial messages
      this.state.messages = this.agent.buildInitialMessages(input);

      // Execute the main loop
      const maxSteps = config?.maxSteps ?? this.agent.config.maxSteps ?? 10;

      // Execute the streaming loop
      yield* this.executionStreamLoop(maxSteps, config);

      // Calculate final stats
      this.trace.endTime = new Date().toISOString();
      this.trace.durationMs = Date.now() - startTime;
      this.trace.finalState = this.state;

      // Add trace event for agent end
      this.addTraceEvent({
        type: 'agent_end',
        timestamp: new Date().toISOString(),
        data: {
          success: !this.state.error,
          finalResponse: this.state.finalResponse,
        },
        durationMs: this.trace.durationMs,
      });

      return {
        response: this.state.finalResponse ?? '',
        state: this.state,
        trace: this.trace,
        success: !this.state.error,
        error: this.state.error
          ? new Error(this.state.error.message)
          : undefined,
      };
    } catch (error) {
      // Handle unexpected errors
      const errorObj = error as Error;

      // Re-throw MaxStepsExceededError - this is an expected constraint violation
      if (error instanceof MaxStepsExceededError) {
        throw error;
      }

      this.state.error = {
        message: errorObj.message,
        step: this.state.step,
        cause: error,
      };

      this.trace.endTime = new Date().toISOString();
      this.trace.durationMs = Date.now() - startTime;
      this.trace.finalState = this.state;

      this.addTraceEvent({
        type: 'error',
        timestamp: new Date().toISOString(),
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
        },
      });

      // Yield error event
      const errorEvent: ErrorEvent = {
        type: 'error',
        error: errorObj.message,
        code:
          error instanceof AgentError
            ? error.code
            : 'UNKNOWN_ERROR',
        step: this.state.step,
        timestamp: new Date().toISOString(),
      };
      yield errorEvent;

      return {
        response: '',
        state: this.state,
        trace: this.trace,
        success: false,
        error: errorObj,
      };
    }
  }

  /**
   * Main streaming execution loop
   */
  private async *executionStreamLoop(
    maxSteps: number,
    config?: StreamingExecutionConfig
  ): AsyncGenerator<AgentExecutionEvent, void, undefined> {
    while (this.state.step < maxSteps && !this.state.isComplete) {
      this.state.step++;
      this.trace.stats.totalSteps++;

      // Add step start trace event
      this.addTraceEvent({
        type: 'step_start',
        timestamp: new Date().toISOString(),
        step: this.state.step,
        data: {
          messagesCount: this.state.messages.length,
          pendingToolCalls: this.state.pendingToolCalls.length,
        },
      });

      // Emit step event
      const stepEvent: AgentStepEvent = {
        type: 'step',
        step: this.state.step,
        timestamp: new Date().toISOString(),
        metadata: {
          messagesCount: this.state.messages.length,
          pendingToolCalls: this.state.pendingToolCalls.length,
        },
      };
      yield stepEvent;

      try {
        // If there are pending tool calls, execute them
        if (this.state.pendingToolCalls.length > 0) {
          yield* this.executeToolCallsStreamStep(config);
        } else {
          // Otherwise, get next response from LLM
          yield* this.llmStreamStep(config);
        }
      } catch (error) {
        const errorObj = error as Error;

        // Check if it's a MaxStepsExceededError
        if (error instanceof MaxStepsExceededError) {
          throw error;
        }

        // Log error in trace
        this.addTraceEvent({
          type: 'error',
          timestamp: new Date().toISOString(),
          step: this.state.step,
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
          },
        });

        // Yield error event
        const errorEvent: ErrorEvent = {
          type: 'error',
          error: errorObj.message,
          code:
            error instanceof AgentError
              ? error.code
              : 'UNKNOWN_ERROR',
          step: this.state.step,
          timestamp: new Date().toISOString(),
        };
        yield errorEvent;

        // If it's a critical error, stop execution
        if (error instanceof LLMError) {
          this.state.error = {
            message: errorObj.message,
            step: this.state.step,
            cause: error,
          };
          this.state.isComplete = true;
          break;
        }

        // For tool errors, we can continue
        continue;
      }

      // Add step end trace event
      this.addTraceEvent({
        type: 'step_end',
        timestamp: new Date().toISOString(),
        step: this.state.step,
        data: {
          isComplete: this.state.isComplete,
        },
      });
    }

    // Check if we exceeded max steps
    if (this.state.step >= maxSteps && !this.state.isComplete) {
      throw new MaxStepsExceededError(maxSteps, {
        executionId: this.executionId,
        step: this.state.step,
      });
    }
  }

  /**
   * Execute LLM step and stream thoughts
   */
  private async *llmStreamStep(
    config?: StreamingExecutionConfig
  ): AsyncGenerator<AgentExecutionEvent, void, undefined> {
    const startTime = Date.now();

    // Add LLM request trace event
    this.addTraceEvent({
      type: 'llm_request',
      timestamp: new Date().toISOString(),
      step: this.state.step,
      data: {
        messagesCount: this.state.messages.length,
        tools: this.agent.getToolSchemas(),
      },
    });

    this.trace.stats.totalLLMCalls++;

    try {
      // Call LLM provider
      const response = await this.llmProvider.chat({
        messages: this.state.messages,
        tools: this.agent.getToolSchemas(),
        streaming: false, // We handle our own streaming of events
      });

      // Add LLM response trace event
      this.addTraceEvent({
        type: 'llm_response',
        timestamp: new Date().toISOString(),
        step: this.state.step,
        data: {
          content: response.content,
          toolCalls: response.toolCalls,
          finishReason: response.finishReason,
        },
        durationMs: Date.now() - startTime,
      });

      // If there's content, yield it as a thought event
      if (response.content && response.content.trim()) {
        const thoughtEvent: ThoughtEvent = {
          type: 'thought',
          content: response.content,
          step: this.state.step,
          timestamp: new Date().toISOString(),
        };
        yield thoughtEvent;
      }

      // Add assistant message to conversation
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
        timestamp: new Date().toISOString(),
      };
      this.state.messages.push(assistantMessage);

      // Check if LLM wants to call tools
      if (response.toolCalls && response.toolCalls.length > 0) {
        this.state.pendingToolCalls = response.toolCalls;
        this.trace.stats.totalToolCalls += response.toolCalls.length;

        // Yield tool call events
        for (const toolCall of response.toolCalls) {
          const toolCallEvent: ToolCallEvent = {
            type: 'tool_call',
            toolCall,
            step: this.state.step,
            timestamp: new Date().toISOString(),
          };
          yield toolCallEvent;
        }
      } else {
        // No tool calls - execution is complete
        this.state.isComplete = true;
        this.state.finalResponse = response.content;

        // Yield final answer event
        const finalAnswerEvent: FinalAnswerEvent = {
          type: 'final_answer',
          answer: response.content,
          step: this.state.step,
          timestamp: new Date().toISOString(),
        };
        yield finalAnswerEvent;
      }
    } catch (error) {
      const errorObj = error as Error;
      throw new LLMError(
        `LLM call failed: ${errorObj.message}`,
        this.agent.config.llm.provider,
        {
          step: this.state.step,
          messagesCount: this.state.messages.length,
        }
      );
    }
  }

  /**
   * Execute pending tool calls and stream results
   */
  private async *executeToolCallsStreamStep(
    config?: StreamingExecutionConfig
  ): AsyncGenerator<AgentExecutionEvent, void, undefined> {
    const toolCalls = this.state.pendingToolCalls;
    this.state.pendingToolCalls = [];

    for (const toolCall of toolCalls) {
      const startTime = Date.now();

      // Add tool call start trace event
      this.addTraceEvent({
        type: 'tool_call_start',
        timestamp: new Date().toISOString(),
        step: this.state.step,
        data: {
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          parameters: toolCall.parameters,
        },
      });

      try {
        // Execute tool
        const result = await this.agent.executeToolCall(toolCall);

        // Update stats
        if (result.error) {
          this.trace.stats.failedToolCalls++;

          // Add tool error trace event
          this.addTraceEvent({
            type: 'tool_call_error',
            timestamp: new Date().toISOString(),
            step: this.state.step,
            data: {
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              error: result.error,
            },
            durationMs: Date.now() - startTime,
          });
        } else {
          this.trace.stats.successfulToolCalls++;

          // Add tool call end trace event
          this.addTraceEvent({
            type: 'tool_call_end',
            timestamp: new Date().toISOString(),
            step: this.state.step,
            data: {
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              result: result.result,
            },
            durationMs: Date.now() - startTime,
          });
        }

        // Yield tool result event
        const toolResultEvent: ToolResultEvent = {
          type: 'tool_result',
          result,
          step: this.state.step,
          timestamp: new Date().toISOString(),
        };
        yield toolResultEvent;

        // Add tool result message to conversation
        const toolMessage: Message = {
          role: 'tool',
          content: result.error
            ? `Error: ${result.error.message}`
            : JSON.stringify(result.result),
          name: toolCall.name,
          toolCallId: toolCall.id,
          timestamp: new Date().toISOString(),
        };
        this.state.messages.push(toolMessage);
        this.state.toolResults.push(result);
      } catch (error) {
        const errorObj = error as Error;
        this.trace.stats.failedToolCalls++;

        // Add tool error trace event
        this.addTraceEvent({
          type: 'tool_call_error',
          timestamp: new Date().toISOString(),
          step: this.state.step,
          data: {
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            error: errorObj.message,
            stack: errorObj.stack,
          },
          durationMs: Date.now() - startTime,
        });

        // Create error result
        const errorResult: ToolResult = {
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          result: null,
          error: {
            message: errorObj.message,
            code: 'EXECUTION_ERROR',
            stack: errorObj.stack,
          },
          metadata: {
            durationMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        };

        // Yield tool result event with error
        const toolResultEvent: ToolResultEvent = {
          type: 'tool_result',
          result: errorResult,
          step: this.state.step,
          timestamp: new Date().toISOString(),
        };
        yield toolResultEvent;

        // Add error message to conversation
        const errorMessage: Message = {
          role: 'tool',
          content: `Error: ${errorObj.message}`,
          name: toolCall.name,
          toolCallId: toolCall.id,
          timestamp: new Date().toISOString(),
        };
        this.state.messages.push(errorMessage);
      }
    }
  }

  /**
   * Add an event to the execution trace
   */
  private addTraceEvent(event: TraceEvent): void {
    this.trace.events.push(event);
  }

  /**
   * Create LLM provider based on config
   */
  private createLLMProvider(llmConfig: any): LLMProvider {
    switch (llmConfig.provider) {
      case 'openai':
        return new OpenAIProvider(llmConfig);
      case 'anthropic':
        return new AnthropicProvider(llmConfig);
      default:
        throw new AgentError(
          `Unsupported LLM provider: ${llmConfig.provider}`,
          'UNSUPPORTED_PROVIDER'
        );
    }
  }

  /**
   * Get current execution trace
   */
  public getTrace(): ExecutionTrace {
    return { ...this.trace };
  }

  /**
   * Get current agent state
   */
  public getState(): AgentState {
    return { ...this.state };
  }
}

/**
 * Factory function to create a streaming executor and iterate over events
 */
export async function* streamAgentExecution(
  agent: Agent,
  input: string,
  config?: StreamingExecutionConfig
): AsyncGenerator<AgentExecutionEvent, StreamingExecutionResult, undefined> {
  const executor = new StreamingAgentExecutor(agent, config);
  return yield* executor.stream(input, config);
}
