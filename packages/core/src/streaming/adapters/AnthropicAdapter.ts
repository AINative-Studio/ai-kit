/**
 * Anthropic (Claude) streaming adapter
 * Transforms Anthropic streaming responses to SSE format
 */

import { ProviderAdapter } from './ProviderAdapter';
import { AnthropicStreamChunk, UsageEvent, LLMProvider } from '../types';

export class AnthropicAdapter extends ProviderAdapter {
  private tokenIndex: number = 0;
  private accumulatedUsage: {
    inputTokens: number;
    outputTokens: number;
  } = {
    inputTokens: 0,
    outputTokens: 0
  };

  /**
   * Process an Anthropic streaming chunk
   * @param chunk - Anthropic chunk object
   */
  public processChunk(chunk: unknown): void {
    if (!this.isValidAnthropicChunk(chunk)) {
      this.handleError('Invalid Anthropic chunk format');
      return;
    }

    const anthropicChunk = chunk as AnthropicStreamChunk;

    switch (anthropicChunk.type) {
      case 'message_start':
        this.handleMessageStart(anthropicChunk);
        break;

      case 'content_block_start':
        // Content block starting, prepare for text
        break;

      case 'content_block_delta':
        this.handleContentDelta(anthropicChunk);
        break;

      case 'content_block_stop':
        // Content block completed
        break;

      case 'message_delta':
        this.handleMessageDelta(anthropicChunk);
        break;

      case 'message_stop':
        this.handleMessageStop();
        break;

      default:
        // Unknown chunk type, log but don't error
        this.streamingResponse.sendMetadata({
          warning: `Unknown chunk type: ${anthropicChunk.type}`
        });
    }
  }

  /**
   * Handle stream completion
   */
  public onComplete(): void {
    // Send accumulated usage if we have it
    if (this.accumulatedUsage.inputTokens > 0 || this.accumulatedUsage.outputTokens > 0) {
      this.streamingResponse.sendUsage({
        promptTokens: this.accumulatedUsage.inputTokens,
        completionTokens: this.accumulatedUsage.outputTokens,
        totalTokens: this.accumulatedUsage.inputTokens + this.accumulatedUsage.outputTokens,
        provider: LLMProvider.ANTHROPIC
      });
    }
  }

  /**
   * Normalize Anthropic usage format
   * @param usage - Anthropic usage object
   */
  protected normalizeUsage(usage: unknown): UsageEvent | null {
    if (!this.isValidUsage(usage)) {
      return null;
    }

    const anthropicUsage = usage as {
      input_tokens: number;
      output_tokens: number;
    };

    return {
      promptTokens: anthropicUsage.input_tokens,
      completionTokens: anthropicUsage.output_tokens,
      totalTokens: anthropicUsage.input_tokens + anthropicUsage.output_tokens,
      provider: LLMProvider.ANTHROPIC
    };
  }

  /**
   * Handle message_start event
   */
  private handleMessageStart(chunk: AnthropicStreamChunk): void {
    if (chunk.message?.usage) {
      this.accumulatedUsage.inputTokens = chunk.message.usage.input_tokens;
    }

    // Send metadata about the message
    if (chunk.message) {
      this.streamingResponse.sendMetadata({
        messageId: chunk.message.id,
        model: chunk.message.model,
        role: chunk.message.role
      });
    }
  }

  /**
   * Handle content_block_delta event
   */
  private handleContentDelta(chunk: AnthropicStreamChunk): void {
    if (chunk.delta?.text) {
      this.streamingResponse.sendToken(
        chunk.delta.text,
        this.tokenIndex++
      );
    }
  }

  /**
   * Handle message_delta event
   */
  private handleMessageDelta(chunk: AnthropicStreamChunk): void {
    if (chunk.usage) {
      this.accumulatedUsage.outputTokens = chunk.usage.output_tokens;
    }
  }

  /**
   * Handle message_stop event
   */
  private handleMessageStop(): void {
    this.streamingResponse.sendMetadata({
      stopReason: 'end_turn'
    });
  }

  /**
   * Type guard for Anthropic chunk
   */
  private isValidAnthropicChunk(chunk: unknown): chunk is AnthropicStreamChunk {
    return (
      typeof chunk === 'object' &&
      chunk !== null &&
      'type' in chunk &&
      typeof (chunk as AnthropicStreamChunk).type === 'string'
    );
  }

  /**
   * Type guard for usage object
   */
  private isValidUsage(usage: unknown): boolean {
    return (
      typeof usage === 'object' &&
      usage !== null &&
      'input_tokens' in usage &&
      'output_tokens' in usage
    );
  }
}
