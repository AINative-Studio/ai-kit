/**
 * MockAIStream - Test double for AIStream
 */

import { EventEmitter } from 'events';
import type { Message, Usage, MockAIStreamConfig } from '../types';

/**
 * Mock implementation of AIStream for testing
 */
export class MockAIStream extends EventEmitter {
  private messages: Message[] = [];
  private isStreaming = false;
  private usage: Usage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };
  private mockResponses: string[];
  private responseIndex = 0;
  private tokenDelay: number;
  private simulateError: boolean;
  private error?: Error;
  private mockUsage?: Partial<Usage>;
  private retriesBeforeSuccess: number;
  private retryCount = 0;

  constructor(private config: MockAIStreamConfig = {}) {
    super();
    this.mockResponses = config.mockResponses || ['Mock response'];
    this.tokenDelay = config.tokenDelay || 10;
    this.simulateError = config.simulateError || false;
    this.error = config.error || new Error('Mock streaming error');
    this.mockUsage = config.mockUsage;
    this.retriesBeforeSuccess = config.retriesBeforeSuccess || 0;
  }

  /**
   * Send a message and simulate streaming response
   */
  async send(content: string): Promise<void> {
    const userMessage: Message = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    this.messages.push(userMessage);
    this.emit('message', userMessage);

    await this.streamResponse();
  }

  /**
   * Simulate streaming response
   */
  private async streamResponse(): Promise<void> {
    this.isStreaming = true;
    this.emit('streaming-start');

    try {
      // Simulate retry logic
      if (this.retriesBeforeSuccess > 0 && this.retryCount < this.retriesBeforeSuccess) {
        this.retryCount++;
        throw new Error('Simulated retry error');
      }

      // Simulate error if configured
      if (this.simulateError) {
        throw this.error!;
      }

      await this.processStream();
      this.retryCount = 0;
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.isStreaming = false;
      this.emit('streaming-end');
    }
  }

  /**
   * Process the mock stream
   */
  private async processStream(): Promise<void> {
    const response =
      this.mockResponses[this.responseIndex % this.mockResponses.length];
    this.responseIndex++;

    const assistantMessage: Message = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Simulate token-by-token streaming
    const tokens = response.split(' ');
    for (let i = 0; i < tokens.length; i++) {
      const token = i === 0 ? tokens[i] : ' ' + tokens[i];
      assistantMessage.content += token;

      this.emit('token', token);

      if (this.config.onToken) {
        this.config.onToken(token);
      }

      // Simulate network delay
      if (this.tokenDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.tokenDelay));
      }
    }

    // Update usage statistics
    this.usage = {
      promptTokens: this.mockUsage?.promptTokens || 10,
      completionTokens: this.mockUsage?.completionTokens || tokens.length,
      totalTokens:
        this.mockUsage?.totalTokens ||
        10 + tokens.length,
      estimatedCost:
        this.mockUsage?.estimatedCost || 0.001,
      latency: this.mockUsage?.latency,
      model: this.mockUsage?.model || this.config.model || 'mock-model',
      cacheHit: this.mockUsage?.cacheHit,
    };

    this.emit('usage', this.usage);

    if (this.config.onCost) {
      this.config.onCost(this.usage);
    }

    // Add complete message
    this.messages.push(assistantMessage);
    this.emit('message', assistantMessage);
  }

  /**
   * Reset the conversation
   */
  reset(): void {
    this.messages = [];
    this.usage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    };
    this.responseIndex = 0;
    this.retryCount = 0;
    this.emit('reset');
  }

  /**
   * Retry the last message
   */
  async retry(): Promise<void> {
    if (this.messages.length === 0) {
      return;
    }

    // Remove last assistant message if exists
    if (this.messages[this.messages.length - 1].role === 'assistant') {
      this.messages.pop();
    }

    await this.streamResponse();
  }

  /**
   * Stop the current stream
   */
  stop(): void {
    this.isStreaming = false;
  }

  /**
   * Get current messages
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get streaming state
   */
  getIsStreaming(): boolean {
    return this.isStreaming;
  }

  /**
   * Get usage statistics
   */
  getUsage(): Usage {
    return { ...this.usage };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set mock responses for testing
   */
  setMockResponses(responses: string[]): void {
    this.mockResponses = responses;
    this.responseIndex = 0;
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
  getCallHistory(): {
    sendCalls: string[];
    tokenEmissions: string[];
    usageEmissions: Usage[];
  } {
    const sendCalls = this.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content);

    // Note: In a real implementation, we'd track these separately
    // For now, we'll return empty arrays as a simple mock
    return {
      sendCalls,
      tokenEmissions: [],
      usageEmissions: [],
    };
  }
}
