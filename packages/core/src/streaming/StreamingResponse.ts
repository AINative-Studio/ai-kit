/**
 * StreamingResponse - Server-side SSE (Server-Sent Events) streaming handler
 *
 * Provides utilities for formatting AI/LLM responses as SSE streams compatible
 * with Node.js http.ServerResponse and Express Response objects.
 *
 * @example
 * ```typescript
 * const stream = new StreamingResponse(res);
 * stream.start();
 * stream.sendToken("Hello");
 * stream.sendToken(" world");
 * stream.sendUsage({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
 * stream.end();
 * ```
 */

import {
  SSEEventType,
  SSEMessage,
  TokenEvent,
  UsageEvent,
  ErrorEvent,
  MetadataEvent,
  StreamingOptions,
  ResponseLike
} from './types';

export class StreamingResponse {
  private response: ResponseLike;
  private options: StreamingOptions;
  private isActive: boolean = false;
  private heartbeatTimer?: NodeJS.Timeout;
  private messageCount: number = 0;

  /**
   * Create a new StreamingResponse instance
   * @param response - Node.js ServerResponse or Express Response object
   * @param options - Streaming configuration options
   */
  constructor(response: ResponseLike, options: StreamingOptions = {}) {
    this.response = response;
    this.options = {
      enableHeartbeat: options.enableHeartbeat ?? false,
      heartbeatInterval: options.heartbeatInterval ?? 30000, // 30 seconds default
      compressionEnabled: options.compressionEnabled ?? false,
      customHeaders: options.customHeaders ?? {}
    };
  }

  /**
   * Initialize the SSE stream with proper headers
   * @returns this for method chaining
   */
  public start(): this {
    if (this.isActive) {
      throw new Error('Stream already started');
    }

    // Set SSE headers
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      ...this.options.customHeaders
    };

    // Set compression headers if enabled
    if (this.options.compressionEnabled) {
      headers['Content-Encoding'] = 'identity';
    }

    // Apply headers
    Object.entries(headers).forEach(([key, value]) => {
      this.response.setHeader(key, value);
    });

    // Write status code if method exists
    if (this.response.writeHead) {
      this.response.writeHead(200, headers);
    }

    this.isActive = true;

    // Send initial start event
    this.sendEvent({
      event: SSEEventType.START,
      data: { timestamp: new Date().toISOString() }
    });

    // Start heartbeat if enabled
    if (this.options.enableHeartbeat) {
      this.startHeartbeat();
    }

    // Handle client disconnect
    if (this.response.on) {
      this.response.on('close', () => {
        this.cleanup();
      });
    }

    return this;
  }

  /**
   * Send a token/text chunk to the client
   * @param token - The text token to send
   * @param index - Optional token index
   * @returns this for method chaining
   */
  public sendToken(token: string, index?: number): this {
    this.ensureActive();

    const tokenEvent: TokenEvent = { token };
    if (index !== undefined) {
      tokenEvent.index = index;
    }

    this.sendEvent({
      event: SSEEventType.TOKEN,
      data: tokenEvent,
      id: this.generateMessageId()
    });

    return this;
  }

  /**
   * Send usage metadata to the client
   * @param usage - Token usage information
   * @returns this for method chaining
   */
  public sendUsage(usage: UsageEvent): this {
    this.ensureActive();

    this.sendEvent({
      event: SSEEventType.USAGE,
      data: usage,
      id: this.generateMessageId()
    });

    return this;
  }

  /**
   * Send an error event to the client
   * @param error - Error message or ErrorEvent object
   * @returns this for method chaining
   */
  public sendError(error: string | ErrorEvent): this {
    this.ensureActive();

    const errorEvent: ErrorEvent = typeof error === 'string'
      ? { error }
      : error;

    this.sendEvent({
      event: SSEEventType.ERROR,
      data: errorEvent,
      id: this.generateMessageId()
    });

    return this;
  }

  /**
   * Send custom metadata to the client
   * @param metadata - Metadata object
   * @returns this for method chaining
   */
  public sendMetadata(metadata: MetadataEvent): this {
    this.ensureActive();

    this.sendEvent({
      event: SSEEventType.METADATA,
      data: metadata,
      id: this.generateMessageId()
    });

    return this;
  }

  /**
   * End the SSE stream gracefully
   */
  public end(): void {
    if (!this.isActive) {
      return;
    }

    // Send done event
    this.sendEvent({
      event: SSEEventType.DONE,
      data: { timestamp: new Date().toISOString() }
    });

    this.cleanup();
    this.response.end();
  }

  /**
   * Abort the stream with an error
   * @param error - Error message or ErrorEvent object
   */
  public abort(error: string | ErrorEvent): void {
    if (!this.isActive) {
      return;
    }

    this.sendError(error);
    this.end();
  }

  /**
   * Send a raw SSE event
   * @param message - SSE message object
   */
  private sendEvent(message: SSEMessage): void {
    const formattedEvent = this.formatSSE(message);
    this.response.write(formattedEvent);
    this.messageCount++;
  }

  /**
   * Format a message as SSE protocol string
   * @param message - SSE message object
   * @returns Formatted SSE string
   */
  private formatSSE(message: SSEMessage): string {
    let output = '';

    // Add event type if specified
    if (message.event) {
      output += `event: ${message.event}\n`;
    }

    // Add message ID if specified
    if (message.id) {
      output += `id: ${message.id}\n`;
    }

    // Add retry interval if specified
    if (message.retry) {
      output += `retry: ${message.retry}\n`;
    }

    // Add data (must be JSON stringified)
    const dataString = typeof message.data === 'string'
      ? message.data
      : JSON.stringify(message.data);

    // Split multi-line data and prefix each line with "data: "
    const dataLines = dataString.split('\n');
    dataLines.forEach(line => {
      output += `data: ${line}\n`;
    });

    // SSE messages end with double newline
    output += '\n';

    return output;
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isActive) {
        // Send comment as heartbeat (comments are lines starting with :)
        this.response.write(': heartbeat\n\n');
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.isActive = false;
    this.stopHeartbeat();
  }

  /**
   * Ensure stream is active before operations
   */
  private ensureActive(): void {
    if (!this.isActive) {
      throw new Error('Stream not started. Call start() first.');
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${this.messageCount}`;
  }

  /**
   * Check if stream is currently active
   */
  public isStreamActive(): boolean {
    return this.isActive;
  }

  /**
   * Get the current message count
   */
  public getMessageCount(): number {
    return this.messageCount;
  }
}
