/**
 * Base adapter interface for transforming LLM provider responses to SSE format
 */

import { StreamingResponse } from '../StreamingResponse';
import { UsageEvent } from '../types';

/**
 * Base class for provider-specific adapters
 */
export abstract class ProviderAdapter {
  protected streamingResponse: StreamingResponse;

  constructor(streamingResponse: StreamingResponse) {
    this.streamingResponse = streamingResponse;
  }

  /**
   * Process a chunk from the provider's stream
   * @param chunk - Raw chunk data from the provider
   */
  abstract processChunk(chunk: unknown): void;

  /**
   * Handle stream completion
   */
  abstract onComplete(): void;

  /**
   * Handle stream errors
   * @param error - Error object or message
   */
  public handleError(error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.streamingResponse.sendError({
      error: errorMessage,
      code: error instanceof Error ? error.name : 'STREAM_ERROR'
    });
  }

  /**
   * Extract and send usage metadata if available
   * @param usage - Provider-specific usage data
   */
  protected sendUsageIfAvailable(usage: unknown): void {
    if (usage && typeof usage === 'object') {
      const usageEvent = this.normalizeUsage(usage);
      if (usageEvent) {
        this.streamingResponse.sendUsage(usageEvent);
      }
    }
  }

  /**
   * Normalize provider-specific usage format to common format
   * @param usage - Provider-specific usage object
   */
  protected abstract normalizeUsage(usage: unknown): UsageEvent | null;
}
