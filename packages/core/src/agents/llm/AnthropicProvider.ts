/**
 * Anthropic LLM Provider
 *
 * Integration with Anthropic's Claude API
 */

import { LLMProvider, ChatRequest, ChatResponse } from './LLMProvider';
import { ToolCall, LLMError } from '../types';
import { generateShortId } from '../../utils/id';

/**
 * Anthropic-specific configuration
 */
export interface AnthropicConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider extends LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: AnthropicConfig) {
    super(config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.model = config.model;

    if (!this.apiKey) {
      throw new LLMError('Anthropic API key is required', 'anthropic', { config });
    }
  }

  /**
   * Send chat request to Anthropic
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { system, messages } = this.convertMessages(request.messages);
      const tools = request.tools ? this.convertTools(request.tools) : undefined;

      const payload: any = {
        model: this.model,
        messages,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        top_p: request.topP ?? this.config.topP,
        stream: request.streaming ?? false,
      };

      if (system) {
        payload.system = system;
      }

      if (tools && tools.length > 0) {
        payload.tools = tools;
      }

      // Handle streaming
      if (request.streaming && request.onStream) {
        return await this.streamChat(payload, request.onStream);
      }

      // Regular non-streaming chat
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API error');
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      const errorObj = error as Error;
      throw new LLMError(
        `Anthropic chat failed: ${errorObj.message}`,
        'anthropic',
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
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
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

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content_block_delta') {
                const delta = parsed.delta;
                if (delta.type === 'text_delta' && delta.text) {
                  content += delta.text;
                  await onStream(delta.text);
                }
              }

              if (parsed.type === 'content_block_start') {
                const block = parsed.content_block;
                if (block.type === 'tool_use') {
                  if (!toolCalls) toolCalls = [];
                  toolCalls.push({
                    id: block.id,
                    name: block.name,
                    parameters: {},
                  });
                }
              }

              if (parsed.type === 'content_block_delta') {
                const delta = parsed.delta;
                if (delta.type === 'input_json_delta' && delta.partial_json) {
                  // Accumulate tool parameters
                  if (toolCalls && toolCalls.length > 0) {
                    const lastTool = toolCalls[toolCalls.length - 1];
                    // Note: This is simplified - real implementation would
                    // need to properly accumulate JSON chunks
                    try {
                      lastTool.parameters = JSON.parse(delta.partial_json);
                    } catch {
                      // Continue accumulating
                    }
                  }
                }
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
   * Parse Anthropic response
   */
  private parseResponse(data: any): ChatResponse {
    let content = '';
    let toolCalls: ToolCall[] | undefined;

    // Anthropic returns content as an array of blocks
    if (data.content && Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          if (!toolCalls) toolCalls = [];
          toolCalls.push({
            id: block.id,
            name: block.name,
            parameters: block.input || {},
          });
        }
      }
    }

    return {
      content,
      toolCalls,
      finishReason: this.mapStopReason(data.stop_reason),
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }

  /**
   * Convert messages to Anthropic format
   */
  private convertMessages(messages: any[]): {
    system?: string;
    messages: any[];
  } {
    let system: string | undefined;
    const anthropicMessages: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content;
        continue;
      }

      if (msg.role === 'tool') {
        // Tool result message
        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.toolCallId,
              content: msg.content,
            },
          ],
        });
      } else if (msg.toolCalls) {
        // Assistant message with tool calls
        const content: any[] = [];

        if (msg.content) {
          content.push({
            type: 'text',
            text: msg.content,
          });
        }

        for (const tc of msg.toolCalls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.parameters,
          });
        }

        anthropicMessages.push({
          role: 'assistant',
          content,
        });
      } else {
        // Regular message
        anthropicMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    return { system, messages: anthropicMessages };
  }

  /**
   * Convert tools to Anthropic format
   */
  private convertTools(tools: any[]): any[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }

  /**
   * Map Anthropic stop reason to standard format
   */
  private mapStopReason(
    reason: string
  ): 'stop' | 'tool_calls' | 'length' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'tool_use':
        return 'tool_calls';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }

  getProviderName(): string {
    return 'anthropic';
  }
}
