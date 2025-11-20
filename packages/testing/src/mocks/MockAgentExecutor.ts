/**
 * MockAgentExecutor - Test double for AgentExecutor
 */

import type {
  AgentConfig,
  ExecutionConfig,
  ExecutionResult,
  AgentState,
  ExecutionTrace,
  ToolResult,
  StreamCallback,
  MockAgentExecutorConfig,
} from '../types';

/**
 * Mock implementation of AgentExecutor for testing
 */
export class MockAgentExecutor {
  private agentConfig: AgentConfig;
  private mockResult?: Partial<ExecutionResult>;
  private mockToolResults: ToolResult[];
  private streaming: boolean;
  private simulateError: boolean;
  private error?: Error;
  private simulatedSteps: number;
  private executionHistory: Array<{
    input: string;
    config?: ExecutionConfig;
    timestamp: Date;
  }> = [];

  constructor(config: MockAgentExecutorConfig) {
    this.agentConfig = config.agentConfig;
    this.mockResult = config.mockResult;
    this.mockToolResults = config.mockToolResults || [];
    this.streaming = config.streaming || false;
    this.simulateError = config.simulateError || false;
    this.error = config.error || new Error('Mock agent execution error');
    this.simulatedSteps = config.simulatedSteps || 3;
  }

  /**
   * Execute the agent with the given input
   */
  async execute(
    input: string,
    config?: ExecutionConfig
  ): Promise<ExecutionResult> {
    // Record execution
    this.executionHistory.push({
      input,
      config,
      timestamp: new Date(),
    });

    // Simulate error if configured
    if (this.simulateError) {
      throw this.error!;
    }

    const startTime = Date.now();

    // Emit streaming events if configured
    if (this.streaming && config?.onStream) {
      await this.emitStreamingEvents(input, config.onStream);
    }

    // Build mock state
    const state: AgentState = {
      step: this.simulatedSteps,
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: input,
          timestamp: Date.now(),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content:
            this.mockResult?.response || 'Mock agent response',
          timestamp: Date.now(),
        },
      ],
      pendingToolCalls: [],
      toolResults: this.mockToolResults,
      isComplete: true,
      finalResponse: this.mockResult?.response || 'Mock agent response',
    };

    // Build mock trace
    const trace: ExecutionTrace = {
      executionId: this.generateId('exec'),
      agentId: this.agentConfig.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      events: this.buildMockTraceEvents(),
      finalState: state,
      stats: {
        totalSteps: this.simulatedSteps,
        totalToolCalls: this.mockToolResults.length,
        totalLLMCalls: this.simulatedSteps,
        successfulToolCalls: this.mockToolResults.filter((r) => !r.error).length,
        failedToolCalls: this.mockToolResults.filter((r) => r.error).length,
      },
    };

    const result: ExecutionResult = {
      response: this.mockResult?.response || 'Mock agent response',
      state: this.mockResult?.state || state,
      trace: this.mockResult?.trace || trace,
      success: this.mockResult?.success !== false,
      error: this.mockResult?.error,
    };

    return result;
  }

  /**
   * Emit streaming events
   */
  private async emitStreamingEvents(
    input: string,
    onStream: StreamCallback
  ): Promise<void> {
    // Start event
    await onStream({
      type: 'start',
      timestamp: new Date().toISOString(),
      data: { input },
    });

    // Step events
    for (let step = 1; step <= this.simulatedSteps; step++) {
      await onStream({
        type: 'step',
        timestamp: new Date().toISOString(),
        data: { step },
      });

      // Simulate some delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Emit tool calls if any
      if (this.mockToolResults.length > 0 && step === 2) {
        for (const toolResult of this.mockToolResults) {
          await onStream({
            type: 'tool_call',
            timestamp: new Date().toISOString(),
            data: {
              toolCall: {
                id: toolResult.toolCallId,
                name: toolResult.toolName,
                parameters: {},
              },
            },
          });

          await onStream({
            type: 'tool_result',
            timestamp: new Date().toISOString(),
            data: { result: toolResult },
          });
        }
      }

      // Emit text chunks
      if (step === this.simulatedSteps) {
        const response = this.mockResult?.response || 'Mock agent response';
        const words = response.split(' ');

        for (const word of words) {
          await onStream({
            type: 'text_chunk',
            timestamp: new Date().toISOString(),
            data: { chunk: word + ' ' },
          });

          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }
    }

    // Complete event
    await onStream({
      type: 'complete',
      timestamp: new Date().toISOString(),
      data: {
        response: this.mockResult?.response || 'Mock agent response',
      },
    });
  }

  /**
   * Build mock trace events
   */
  private buildMockTraceEvents(): any[] {
    const events: any[] = [
      {
        type: 'agent_start',
        timestamp: new Date().toISOString(),
        data: { agentId: this.agentConfig.id },
      },
    ];

    for (let step = 1; step <= this.simulatedSteps; step++) {
      events.push({
        type: 'step_start',
        timestamp: new Date().toISOString(),
        step,
        data: {},
      });

      events.push({
        type: 'llm_request',
        timestamp: new Date().toISOString(),
        step,
        data: {},
      });

      events.push({
        type: 'llm_response',
        timestamp: new Date().toISOString(),
        step,
        data: { content: 'Mock response' },
        durationMs: 100,
      });

      // Add tool call events if applicable
      if (this.mockToolResults.length > 0 && step === 2) {
        for (const toolResult of this.mockToolResults) {
          events.push({
            type: 'tool_call_start',
            timestamp: new Date().toISOString(),
            step,
            data: {
              toolCallId: toolResult.toolCallId,
              toolName: toolResult.toolName,
            },
          });

          events.push({
            type: toolResult.error ? 'tool_call_error' : 'tool_call_end',
            timestamp: new Date().toISOString(),
            step,
            data: {
              toolCallId: toolResult.toolCallId,
              toolName: toolResult.toolName,
              result: toolResult.result,
              error: toolResult.error,
            },
            durationMs: 50,
          });
        }
      }

      events.push({
        type: 'step_end',
        timestamp: new Date().toISOString(),
        step,
        data: {},
      });
    }

    events.push({
      type: 'agent_end',
      timestamp: new Date().toISOString(),
      data: {
        success: true,
        finalResponse: this.mockResult?.response || 'Mock agent response',
      },
    });

    return events;
  }

  /**
   * Get current execution trace
   */
  getTrace(): ExecutionTrace {
    return {
      executionId: this.generateId('exec'),
      agentId: this.agentConfig.id,
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
  }

  /**
   * Get current agent state
   */
  getState(): AgentState {
    return {
      step: 0,
      messages: [],
      pendingToolCalls: [],
      toolResults: [],
      isComplete: false,
    };
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): Array<{
    input: string;
    config?: ExecutionConfig;
    timestamp: Date;
  }> {
    return [...this.executionHistory];
  }

  /**
   * Get number of executions
   */
  getExecutionCount(): number {
    return this.executionHistory.length;
  }

  /**
   * Set mock result
   */
  setMockResult(result: Partial<ExecutionResult>): void {
    this.mockResult = result;
  }

  /**
   * Set mock tool results
   */
  setMockToolResults(results: ToolResult[]): void {
    this.mockToolResults = results;
  }

  /**
   * Set error simulation
   */
  setSimulateError(error: Error | boolean): void {
    if (typeof error === 'boolean') {
      this.simulateError = error;
    } else {
      this.simulateError = true;
      this.error = error;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
