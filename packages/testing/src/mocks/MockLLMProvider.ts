/**
 * MockLLMProvider - Test double for LLM providers
 */

import type { Message, Usage, ToolCall, MockLLMProviderConfig } from '../types';

/**
 * Mock LLM response
 */
export interface MockLLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  usage?: Usage;
}

/**
 * Mock LLM chat parameters
 */
export interface MockLLMChatParams {
  messages: Message[];
  tools?: any[];
  streaming?: boolean;
  onStream?: (chunk: string) => void | Promise<void>;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Mock implementation of LLM provider for testing
 */
export class MockLLMProvider {
  private mockResponses: string[];
  private mockToolCalls: ToolCall[];
  private responseIndex = 0;
  private tokenDelay: number;
  private simulateError: boolean;
  private error?: Error;
  private mockUsage?: Partial<Usage>;
  private callHistory: MockLLMChatParams[] = [];

  constructor(private config: MockLLMProviderConfig) {
    this.mockResponses = config.mockResponses || ['Mock LLM response'];
    this.mockToolCalls = config.mockToolCalls || [];
    this.tokenDelay = config.tokenDelay || 10;
    this.simulateError = config.simulateError || false;
    this.error = config.error || new Error('Mock LLM error');
    this.mockUsage = config.mockUsage;
  }

  /**
   * Simulate chat completion
   */
  async chat(params: MockLLMChatParams): Promise<MockLLMResponse> {
    // Track the call
    this.callHistory.push(params);

    // Simulate error if configured
    if (this.simulateError) {
      throw this.error!;
    }

    // Get next response
    const response =
      this.mockResponses[this.responseIndex % this.mockResponses.length];
    const toolCalls =
      this.mockToolCalls.length > 0 ? this.mockToolCalls : undefined;
    this.responseIndex++;

    if (!response) {
      throw new Error('No mock response available');
    }

    // Simulate streaming if requested
    if (params.streaming && params.onStream) {
      await this.simulateStreaming(response, params.onStream);
    }

    // Calculate usage
    const usage: Usage = {
      promptTokens: this.mockUsage?.promptTokens || 50,
      completionTokens: this.mockUsage?.completionTokens || response.split(' ').length,
      totalTokens:
        this.mockUsage?.totalTokens ||
        50 + response.split(' ').length,
      estimatedCost: this.mockUsage?.estimatedCost || 0.002,
      latency: this.mockUsage?.latency || 200,
      model: this.config.model,
      cacheHit: this.mockUsage?.cacheHit,
    };

    return {
      content: response,
      toolCalls,
      finishReason: toolCalls ? 'tool_calls' : 'stop',
      usage,
    };
  }

  /**
   * Simulate streaming response
   */
  private async simulateStreaming(
    content: string,
    onStream: (chunk: string) => void | Promise<void>
  ): Promise<void> {
    const tokens = content.split(' ');

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token) continue;

      const tokenWithSpace = i === 0 ? token : ' ' + token;
      await onStream(tokenWithSpace);

      // Simulate network delay
      if (this.tokenDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.tokenDelay));
      }
    }
  }

  /**
   * Set mock responses
   */
  setMockResponses(responses: string[]): void {
    this.mockResponses = responses;
    this.responseIndex = 0;
  }

  /**
   * Set mock tool calls
   */
  setMockToolCalls(toolCalls: ToolCall[]): void {
    this.mockToolCalls = toolCalls;
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
   * Get call history for assertions
   */
  getCallHistory(): MockLLMChatParams[] {
    return [...this.callHistory];
  }

  /**
   * Get number of calls made
   */
  getCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Get last call parameters
   */
  getLastCall(): MockLLMChatParams | undefined {
    return this.callHistory[this.callHistory.length - 1];
  }

  /**
   * Reset call history
   */
  resetCallHistory(): void {
    this.callHistory = [];
    this.responseIndex = 0;
  }

  /**
   * Assert that chat was called with specific parameters
   */
  assertCalledWith(
    matcher: Partial<MockLLMChatParams> | ((params: MockLLMChatParams) => boolean)
  ): boolean {
    if (typeof matcher === 'function') {
      return this.callHistory.some(matcher);
    }

    return this.callHistory.some((call) => {
      return Object.entries(matcher).every(([key, value]) => {
        return JSON.stringify(call[key as keyof MockLLMChatParams]) === JSON.stringify(value);
      });
    });
  }

  /**
   * Assert number of calls
   */
  assertCallCount(expected: number): boolean {
    return this.callHistory.length === expected;
  }
}
