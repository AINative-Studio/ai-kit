/**
 * LLM Provider Interface
 *
 * Defines the contract for LLM providers to integrate with the agent system
 */

import { Message, ToolCall } from '../types';

/**
 * Chat request parameters
 */
export interface ChatRequest {
  messages: Message[];
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  streaming?: boolean;
  onStream?: (chunk: string) => void | Promise<void>;
}

/**
 * Chat response
 */
export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason?: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Base LLM provider interface
 */
export abstract class LLMProvider {
  protected config: any;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * Send a chat request to the LLM
   */
  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Get provider name
   */
  abstract getProviderName(): string;
}
