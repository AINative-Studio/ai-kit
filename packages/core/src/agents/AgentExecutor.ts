/**
 * AIKIT AgentExecutor - Multi-Step Agent Execution Engine
 *
 * This module implements the core agent execution loop with tool calling,
 * streaming support, error handling, and detailed execution tracing.
 */

import { Agent } from './Agent';
import {
  AgentState,
  Message,
  ToolCall,
  ToolResult,
  ExecutionTrace,
  TraceEvent,
  StreamCallback,
  StreamEvent,
  MaxStepsExceededError,
  LLMError,
  AgentError,
} from './types';
import { generateId } from '../utils/id';
import { LLMProvider } from './llm/LLMProvider';
import { OpenAIProvider } from './llm/OpenAIProvider';
import { AnthropicProvider } from './llm/AnthropicProvider';

/**
 * Configuration for agent execution
 */
export interface ExecutionConfig {
  /**
   * Maximum number of steps before stopping
   */
  maxSteps?: number;

  /**
   * Whether to enable streaming
   */
  streaming?: boolean;

  /**
   * Stream callback for real-time updates
   */
  onStream?: StreamCallback;

  /**
   * Whether to include detailed traces
   */
  verbose?: boolean;

  /**
   * Custom LLM provider instance
   */
  llmProvider?: LLMProvider;

  /**
   * Additional context to include in execution
   */
  context?: Record<string, unknown>;
}

/**
 * Result of agent execution
 */
export interface ExecutionResult {
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
 * AgentExecutor - Orchestrates multi-step agent execution with tool calling
 */
export class AgentExecutor {
  private agent: Agent;
  private llmProvider: LLMProvider;
  private executionId: string;
  private trace: ExecutionTrace;
  private state: AgentState;

  constructor(agent: Agent, config?: ExecutionConfig) {
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
   * Execute the agent with the given input
   */
  public async execute(
    input: string,
    config?: ExecutionConfig
  ): Promise<ExecutionResult> {
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

      // Emit stream event
      await this.emitStreamEvent(config?.onStream, {
        type: 'start',
        timestamp: new Date().toISOString(),
        data: { input },
      });

      // Build initial messages
      this.state.messages = this.agent.buildInitialMessages(input);

      // Execute the main loop
      const maxSteps = config?.maxSteps ?? this.agent.config.maxSteps ?? 10;
      await this.executionLoop(maxSteps, config);

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

      // Emit completion stream event
      await this.emitStreamEvent(config?.onStream, {
        type: 'complete',
        timestamp: new Date().toISOString(),
        data: {
          response: this.state.finalResponse ?? '',
          trace: this.trace,
        },
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

      await this.emitStreamEvent(config?.onStream, {
        type: 'error',
        timestamp: new Date().toISOString(),
        data: { error: errorObj.message },
      });

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
   * Main execution loop
   */
  private async executionLoop(
    maxSteps: number,
    config?: ExecutionConfig
  ): Promise<void> {
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

      // Emit step stream event
      await this.emitStreamEvent(config?.onStream, {
        type: 'step',
        timestamp: new Date().toISOString(),
        data: { step: this.state.step },
      });

      try {
        // If there are pending tool calls, execute them
        if (this.state.pendingToolCalls.length > 0) {
          await this.executeToolCallsStep(config);
        } else {
          // Otherwise, get next response from LLM
          await this.llmStep(config);
        }
      } catch (error) {
        const errorObj = error as Error;

        // Check if it's a MaxStepsExceededError
        if (error instanceof MaxStepsExceededError) {
          throw error;
        }

        // Log error in trace but continue if possible
        this.addTraceEvent({
          type: 'error',
          timestamp: new Date().toISOString(),
          step: this.state.step,
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
          },
        });

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
   * Execute LLM step to get next response
   */
  private async llmStep(config?: ExecutionConfig): Promise<void> {
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
        streaming: config?.streaming,
        onStream: config?.streaming
          ? async (chunk) => {
              await this.emitStreamEvent(config.onStream, {
                type: 'text_chunk',
                timestamp: new Date().toISOString(),
                data: { chunk },
              });
            }
          : undefined,
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

        // Emit tool call events
        for (const toolCall of response.toolCalls) {
          await this.emitStreamEvent(config?.onStream, {
            type: 'tool_call',
            timestamp: new Date().toISOString(),
            data: { toolCall },
          });
        }
      } else {
        // No tool calls - execution is complete
        this.state.isComplete = true;
        this.state.finalResponse = response.content;
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
   * Execute pending tool calls
   */
  private async executeToolCallsStep(config?: ExecutionConfig): Promise<void> {
    const toolCalls = this.state.pendingToolCalls;
    this.state.pendingToolCalls = [];

    const results: ToolResult[] = [];

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
        results.push(result);

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

        // Emit tool result stream event
        await this.emitStreamEvent(config?.onStream, {
          type: 'tool_result',
          timestamp: new Date().toISOString(),
          data: { result },
        });

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
   * Emit a stream event
   */
  private async emitStreamEvent(
    callback: StreamCallback | undefined,
    event: StreamEvent
  ): Promise<void> {
    if (callback) {
      try {
        await callback(event);
      } catch (error) {
        // Log but don't fail execution on stream errors
        console.error('Stream callback error:', error);
      }
    }
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
 * Factory function to create and execute an agent in one call
 */
export async function executeAgent(
  agent: Agent,
  input: string,
  config?: ExecutionConfig
): Promise<ExecutionResult> {
  const executor = new AgentExecutor(agent, config);
  return executor.execute(input, config);
}
