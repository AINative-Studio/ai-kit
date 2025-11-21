/**
 * OpenAI LLM Provider
 *
 * Integration with OpenAI's chat completion API
 */

import { LLMProvider, ChatRequest, ChatResponse } from './LLMProvider';
import { ToolCall, LLMError } from '../types';
import { generateShortId } from '../../utils/id';

/**
 * OpenAI-specific configuration
 */
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  organization?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: OpenAIConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env['OPENAI_API_KEY'] || '';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model;

    if (!this.apiKey) {
      throw new LLMError('OpenAI API key is required', 'openai', { config });
    }
  }

  /**
   * Send chat request to OpenAI
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const messages = this.convertMessages(request.messages);
      const tools = request.tools ? this.convertTools(request.tools) : undefined;

      const payload: any = {
        model: this.model,
        messages,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        top_p: request.topP ?? this.config.topP,
        stream: request.streaming ?? false,
      };

      if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = 'auto';
      }

      // Handle streaming
      if (request.streaming && request.onStream) {
        return await this.streamChat(payload, request.onStream);
      }

      // Regular non-streaming chat
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...(this.config.organization && {
            'OpenAI-Organization': this.config.organization,
          }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      const errorObj = error as Error;
      throw new LLMError(
        `OpenAI chat failed: ${errorObj.message}`,
        'openai',
        { model: this.model, error: errorObj }
      );
    }
  }

  /**
   * Stream chat completion
   */
  private async streamChat(
    payload: any,
    onStream: (chunk: string) => void | Promise<void>
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...(this.config.organization && {
          'OpenAI-Organization': this.config.organization,
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let content = '';
    let toolCalls: ToolCall[] | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                content += delta.content;
                await onStream(delta.content);
              }

              if (delta?.tool_calls) {
                toolCalls = this.parseToolCalls(delta.tool_calls);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content,
      toolCalls,
      finishReason: toolCalls ? 'tool_calls' : 'stop',
    };
  }

  /**
   * Parse OpenAI response
   */
  private parseResponse(data: any): ChatResponse {
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No choices in OpenAI response');
    }

    const message = choice.message;
    const toolCalls = message.tool_calls
      ? this.parseToolCalls(message.tool_calls)
      : undefined;

    return {
      content: message.content || '',
      toolCalls,
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Convert messages to OpenAI format
   */
  private convertMessages(messages: any[]): any[] {
    return messages.map((msg) => {
      const converted: any = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.name) {
        converted.name = msg.name;
      }

      if (msg.toolCalls) {
        converted.tool_calls = msg.toolCalls.map((tc: ToolCall) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.parameters),
          },
        }));
      }

      if (msg.toolCallId) {
        converted.tool_call_id = msg.toolCallId;
      }

      return converted;
    });
  }

  /**
   * Convert tools to OpenAI format
   */
  private convertTools(tools: any[]): any[] {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Parse tool calls from OpenAI response
   */
  private parseToolCalls(toolCalls: any[]): ToolCall[] {
    return toolCalls.map((tc) => ({
      id: tc.id || `tool-${generateShortId()}`,
      name: tc.function.name,
      parameters: JSON.parse(tc.function.arguments || '{}'),
    }));
  }

  /**
   * Map OpenAI finish reason to standard format
   */
  private mapFinishReason(
    reason: string
  ): 'stop' | 'tool_calls' | 'length' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'tool_calls':
        return 'tool_calls';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  getProviderName(): string {
    return 'openai';
  }
}
