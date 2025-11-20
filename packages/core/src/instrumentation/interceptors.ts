/**
 * AIKIT Instrumentation - Provider Interceptors
 *
 * This module provides interceptors for automatic instrumentation
 * of LLM providers, tools, and agent executions.
 */

import {
  LLMInterceptor,
  ToolInterceptor,
  AgentInterceptor,
  InterceptorContext,
} from './types';

/**
 * OpenAI interceptor
 */
export class OpenAIInterceptor implements LLMInterceptor {
  async beforeRequest(request: any, context: InterceptorContext): Promise<void> {
    if (context.span) {
      const messageCount = request.messages?.length || 0;
      const hasTools = request.tools && request.tools.length > 0;

      context.span.attributes = {
        ...context.span.attributes,
        'openai.model': request.model,
        'openai.temperature': request.temperature,
        'openai.max_tokens': request.max_tokens,
        'openai.message_count': messageCount,
        'openai.has_tools': hasTools,
        'openai.tool_count': request.tools?.length || 0,
        'openai.streaming': request.stream || false,
      };
    }
  }

  async afterResponse(
    request: any,
    response: any,
    context: InterceptorContext
  ): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'openai.finish_reason': response.finishReason,
        'openai.has_tool_calls': response.toolCalls && response.toolCalls.length > 0,
        'openai.tool_call_count': response.toolCalls?.length || 0,
      };

      if (response.usage) {
        context.span.attributes = {
          ...context.span.attributes,
          'openai.usage.prompt_tokens': response.usage.promptTokens,
          'openai.usage.completion_tokens': response.usage.completionTokens,
          'openai.usage.total_tokens': response.usage.totalTokens,
        };
      }
    }
  }

  async onError(request: any, error: Error, context: InterceptorContext): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'openai.error.name': error.name,
        'openai.error.message': error.message,
      };
    }

    // Log error details
    console.error('[OpenAI Interceptor] Error:', {
      model: request.model,
      error: error.message,
    });
  }
}

/**
 * Anthropic interceptor
 */
export class AnthropicInterceptor implements LLMInterceptor {
  async beforeRequest(request: any, context: InterceptorContext): Promise<void> {
    if (context.span) {
      const messageCount = request.messages?.length || 0;
      const hasTools = request.tools && request.tools.length > 0;

      context.span.attributes = {
        ...context.span.attributes,
        'anthropic.model': request.model,
        'anthropic.temperature': request.temperature,
        'anthropic.max_tokens': request.max_tokens,
        'anthropic.message_count': messageCount,
        'anthropic.has_tools': hasTools,
        'anthropic.tool_count': request.tools?.length || 0,
        'anthropic.streaming': request.stream || false,
      };
    }
  }

  async afterResponse(
    request: any,
    response: any,
    context: InterceptorContext
  ): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'anthropic.finish_reason': response.finishReason,
        'anthropic.has_tool_calls': response.toolCalls && response.toolCalls.length > 0,
        'anthropic.tool_call_count': response.toolCalls?.length || 0,
      };

      if (response.usage) {
        context.span.attributes = {
          ...context.span.attributes,
          'anthropic.usage.input_tokens': response.usage.promptTokens,
          'anthropic.usage.output_tokens': response.usage.completionTokens,
          'anthropic.usage.total_tokens': response.usage.totalTokens,
        };
      }
    }
  }

  async onError(request: any, error: Error, context: InterceptorContext): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'anthropic.error.name': error.name,
        'anthropic.error.message': error.message,
      };
    }

    // Log error details
    console.error('[Anthropic Interceptor] Error:', {
      model: request.model,
      error: error.message,
    });
  }
}

/**
 * Generic LLM interceptor
 */
export class GenericLLMInterceptor implements LLMInterceptor {
  async beforeRequest(request: any, context: InterceptorContext): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'llm.request.timestamp': new Date().toISOString(),
      };
    }
  }

  async afterResponse(
    request: any,
    response: any,
    context: InterceptorContext
  ): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'llm.response.timestamp': new Date().toISOString(),
      };
    }
  }

  async onError(request: any, error: Error, context: InterceptorContext): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'llm.error.timestamp': new Date().toISOString(),
      };
    }
  }
}

/**
 * Tool call interceptor
 */
export class ToolCallInterceptor implements ToolInterceptor {
  async beforeExecution(
    toolName: string,
    params: any,
    context: InterceptorContext
  ): Promise<void> {
    if (context.span) {
      const paramSize = JSON.stringify(params).length;

      context.span.attributes = {
        ...context.span.attributes,
        'tool.execution.start_timestamp': new Date().toISOString(),
        'tool.params.size_bytes': paramSize,
      };
    }
  }

  async afterExecution(
    toolName: string,
    params: any,
    result: any,
    context: InterceptorContext
  ): Promise<void> {
    if (context.span) {
      const resultSize = JSON.stringify(result).length;

      context.span.attributes = {
        ...context.span.attributes,
        'tool.execution.end_timestamp': new Date().toISOString(),
        'tool.result.size_bytes': resultSize,
        'tool.execution.success': true,
      };
    }
  }

  async onError(
    toolName: string,
    params: any,
    error: Error,
    context: InterceptorContext
  ): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'tool.execution.success': false,
        'tool.error.name': error.name,
        'tool.error.message': error.message,
        'tool.error.stack': error.stack,
      };
    }

    // Log error details
    console.error('[Tool Interceptor] Error:', {
      tool: toolName,
      error: error.message,
    });
  }
}

/**
 * Agent execution interceptor
 */
export class AgentExecutionInterceptor implements AgentInterceptor {
  private stepCounts: Map<string, number> = new Map();
  private llmCallCounts: Map<string, number> = new Map();
  private toolCallCounts: Map<string, number> = new Map();
  private tokenCounts: Map<string, number> = new Map();

  async beforeExecution(
    agentId: string,
    input: string,
    context: InterceptorContext
  ): Promise<void> {
    // Initialize counters
    this.stepCounts.set(agentId, 0);
    this.llmCallCounts.set(agentId, 0);
    this.toolCallCounts.set(agentId, 0);
    this.tokenCounts.set(agentId, 0);

    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'agent.execution.start_timestamp': new Date().toISOString(),
        'agent.input.length': input.length,
      };
    }
  }

  async afterExecution(
    agentId: string,
    input: string,
    result: any,
    context: InterceptorContext
  ): Promise<void> {
    // Get counters
    const steps = this.stepCounts.get(agentId) || 0;
    const llmCalls = this.llmCallCounts.get(agentId) || 0;
    const toolCalls = this.toolCallCounts.get(agentId) || 0;
    const totalTokens = this.tokenCounts.get(agentId) || 0;

    // Update context data for metrics
    if (context.data) {
      context.data.steps = steps;
      context.data.llmCalls = llmCalls;
      context.data.toolCalls = toolCalls;
      context.data.totalTokens = totalTokens;
    }

    if (context.span) {
      const resultLength = typeof result === 'string' ? result.length : JSON.stringify(result).length;

      context.span.attributes = {
        ...context.span.attributes,
        'agent.execution.end_timestamp': new Date().toISOString(),
        'agent.execution.success': true,
        'agent.execution.steps': steps,
        'agent.execution.llm_calls': llmCalls,
        'agent.execution.tool_calls': toolCalls,
        'agent.execution.total_tokens': totalTokens,
        'agent.result.length': resultLength,
      };
    }

    // Clean up counters
    this.stepCounts.delete(agentId);
    this.llmCallCounts.delete(agentId);
    this.toolCallCounts.delete(agentId);
    this.tokenCounts.delete(agentId);
  }

  async onError(
    agentId: string,
    input: string,
    error: Error,
    context: InterceptorContext
  ): Promise<void> {
    if (context.span) {
      context.span.attributes = {
        ...context.span.attributes,
        'agent.execution.success': false,
        'agent.error.name': error.name,
        'agent.error.message': error.message,
        'agent.error.stack': error.stack,
      };
    }

    // Clean up counters
    this.stepCounts.delete(agentId);
    this.llmCallCounts.delete(agentId);
    this.toolCallCounts.delete(agentId);
    this.tokenCounts.delete(agentId);

    // Log error details
    console.error('[Agent Interceptor] Error:', {
      agentId,
      error: error.message,
    });
  }

  /**
   * Track a step execution
   */
  trackStep(agentId: string): void {
    const current = this.stepCounts.get(agentId) || 0;
    this.stepCounts.set(agentId, current + 1);
  }

  /**
   * Track an LLM call
   */
  trackLLMCall(agentId: string, tokens: number = 0): void {
    const currentCalls = this.llmCallCounts.get(agentId) || 0;
    this.llmCallCounts.set(agentId, currentCalls + 1);

    const currentTokens = this.tokenCounts.get(agentId) || 0;
    this.tokenCounts.set(agentId, currentTokens + tokens);
  }

  /**
   * Track a tool call
   */
  trackToolCall(agentId: string): void {
    const current = this.toolCallCounts.get(agentId) || 0;
    this.toolCallCounts.set(agentId, current + 1);
  }
}

/**
 * Create a logging interceptor for LLMs
 */
export function createLoggingLLMInterceptor(): LLMInterceptor {
  return {
    async beforeRequest(request: any, context: InterceptorContext): Promise<void> {
      console.log('[LLM Request]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        model: request.model,
        messageCount: request.messages?.length,
      });
    },

    async afterResponse(request: any, response: any, context: InterceptorContext): Promise<void> {
      console.log('[LLM Response]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        finishReason: response.finishReason,
        usage: response.usage,
      });
    },

    async onError(request: any, error: Error, context: InterceptorContext): Promise<void> {
      console.error('[LLM Error]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        error: error.message,
      });
    },
  };
}

/**
 * Create a logging interceptor for tools
 */
export function createLoggingToolInterceptor(): ToolInterceptor {
  return {
    async beforeExecution(
      toolName: string,
      params: any,
      context: InterceptorContext
    ): Promise<void> {
      console.log('[Tool Execution Start]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        tool: toolName,
      });
    },

    async afterExecution(
      toolName: string,
      params: any,
      result: any,
      context: InterceptorContext
    ): Promise<void> {
      console.log('[Tool Execution Complete]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        tool: toolName,
      });
    },

    async onError(
      toolName: string,
      params: any,
      error: Error,
      context: InterceptorContext
    ): Promise<void> {
      console.error('[Tool Execution Error]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        tool: toolName,
        error: error.message,
      });
    },
  };
}

/**
 * Create a logging interceptor for agents
 */
export function createLoggingAgentInterceptor(): AgentInterceptor {
  return {
    async beforeExecution(
      agentId: string,
      input: string,
      context: InterceptorContext
    ): Promise<void> {
      console.log('[Agent Execution Start]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        agentId,
        inputLength: input.length,
      });
    },

    async afterExecution(
      agentId: string,
      input: string,
      result: any,
      context: InterceptorContext
    ): Promise<void> {
      console.log('[Agent Execution Complete]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        agentId,
      });
    },

    async onError(
      agentId: string,
      input: string,
      error: Error,
      context: InterceptorContext
    ): Promise<void> {
      console.error('[Agent Execution Error]', {
        traceId: context.trace.traceId,
        spanId: context.span?.spanId,
        agentId,
        error: error.message,
      });
    },
  };
}
