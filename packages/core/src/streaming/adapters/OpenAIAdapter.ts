/**
 * OpenAI streaming adapter
 * Transforms OpenAI streaming responses to SSE format
 */

import { ProviderAdapter } from './ProviderAdapter';
import { OpenAIStreamChunk, UsageEvent, LLMProvider } from '../types';

export class OpenAIAdapter extends ProviderAdapter {
  private tokenIndex: number = 0;

  /**
   * Process an OpenAI streaming chunk
   * @param chunk - OpenAI chunk object
   */
  public processChunk(chunk: unknown): void {
    if (!this.isValidOpenAIChunk(chunk)) {
      this.handleError('Invalid OpenAI chunk format');
      return;
    }

    const openAIChunk = chunk as OpenAIStreamChunk;

    // Process each choice
    for (const choice of openAIChunk.choices) {
      // Send token if content is present
      if (choice.delta.content) {
        this.streamingResponse.sendToken(
          choice.delta.content,
          this.tokenIndex++
        );
      }

      // Check for completion
      if (choice.finish_reason) {
        this.handleFinishReason(choice.finish_reason);
      }
    }

    // Send usage metadata if available
    if (openAIChunk.usage) {
      this.sendUsageIfAvailable(openAIChunk.usage);
    }
  }

  /**
   * Handle stream completion
   */
  public onComplete(): void {
    // OpenAI sends usage in the last chunk, so we typically don't need to do anything here
    // The stream will be ended by the caller
  }

  /**
   * Normalize OpenAI usage format
   * @param usage - OpenAI usage object
   */
  protected normalizeUsage(usage: unknown): UsageEvent | null {
    if (!this.isValidUsage(usage)) {
      return null;
    }

    const openAIUsage = usage as {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };

    return {
      promptTokens: openAIUsage.prompt_tokens,
      completionTokens: openAIUsage.completion_tokens,
      totalTokens: openAIUsage.total_tokens,
      provider: LLMProvider.OPENAI
    };
  }

  /**
   * Handle finish reason from OpenAI
   * @param finishReason - Finish reason string
   */
  private handleFinishReason(finishReason: string): void {
    if (finishReason === 'length') {
      this.streamingResponse.sendMetadata({
        finishReason,
        warning: 'Response truncated due to length limit'
      });
    } else if (finishReason === 'content_filter') {
      this.streamingResponse.sendMetadata({
        finishReason,
        warning: 'Content filtered by moderation system'
      });
    } else {
      this.streamingResponse.sendMetadata({
        finishReason
      });
    }
  }

  /**
   * Type guard for OpenAI chunk
   */
  private isValidOpenAIChunk(chunk: unknown): chunk is OpenAIStreamChunk {
    return (
      typeof chunk === 'object' &&
      chunk !== null &&
      'choices' in chunk &&
      Array.isArray((chunk as OpenAIStreamChunk).choices)
    );
  }

  /**
   * Type guard for usage object
   */
  private isValidUsage(usage: unknown): boolean {
    return (
      typeof usage === 'object' &&
      usage !== null &&
      'prompt_tokens' in usage &&
      'completion_tokens' in usage &&
      'total_tokens' in usage
    );
  }
}
