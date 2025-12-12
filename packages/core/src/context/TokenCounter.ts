/**
 * Token counting utilities using tiktoken (Node.js) or fallback approximation (browser)
 */

import {
  ContextMessage,
  ModelType,
  TokenCount,
  MODEL_ENCODING_MAP,
} from './types';

// Lazy-loaded tiktoken (only in Node.js environments)
let tiktokenModule: typeof import('tiktoken') | null = null;
let tiktokenLoadAttempted = false;

/**
 * Attempt to load tiktoken (Node.js only)
 * Returns null in browser environments
 */
async function loadTiktoken(): Promise<typeof import('tiktoken') | null> {
  if (tiktokenLoadAttempted) {
    return tiktokenModule;
  }

  tiktokenLoadAttempted = true;

  try {
    // Check if we're in a Node.js environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      tiktokenModule = await import('tiktoken');
      return tiktokenModule;
    }
  } catch (error) {
    // Silently fail in browser environments or if tiktoken is not installed
    console.debug('tiktoken not available, using fallback token counter');
  }

  return null;
}

/**
 * Browser-compatible approximate token counter
 * Uses character-based estimation (approximately 4 chars per token)
 */
class FallbackTokenCounter {
  private readonly CHARS_PER_TOKEN = 4;

  /**
   * Count tokens in a string (approximate)
   */
  countStringTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Count tokens in a message with estimated breakdown
   */
  countMessageTokens(message: ContextMessage): TokenCount {
    const breakdown = {
      role: 0,
      name: 0,
      content: 0,
      functionCall: 0,
      toolCalls: 0,
    };

    // Every message has overhead (start, role, end tokens)
    let tokens = 3;

    // Role tokens
    breakdown.role = Math.ceil(message.role.length / this.CHARS_PER_TOKEN);
    tokens += breakdown.role;

    // Name tokens
    if (message.name) {
      breakdown.name = Math.ceil(message.name.length / this.CHARS_PER_TOKEN) + 1;
      tokens += breakdown.name;
    }

    // Content tokens
    if (message.content) {
      breakdown.content = this.countStringTokens(message.content);
      tokens += breakdown.content;
    }

    // Function call tokens
    if (message.function_call) {
      const fnName = this.countStringTokens(message.function_call.name);
      const fnArgs = this.countStringTokens(message.function_call.arguments);
      breakdown.functionCall = fnName + fnArgs + 3;
      tokens += breakdown.functionCall;
    }

    // Tool calls tokens
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const toolId = this.countStringTokens(toolCall.id);
        const toolType = this.countStringTokens(toolCall.type);
        const fnName = this.countStringTokens(toolCall.function.name);
        const fnArgs = this.countStringTokens(toolCall.function.arguments);
        breakdown.toolCalls += toolId + toolType + fnName + fnArgs + 5;
      }
      tokens += breakdown.toolCalls;
    }

    // Tool call response overhead
    if (message.tool_call_id) {
      tokens += this.countStringTokens(message.tool_call_id) + 2;
    }

    return {
      tokens,
      characters: 0,
      breakdown,
    };
  }
}

/**
 * TokenCounter class for accurate token counting
 * Automatically uses tiktoken in Node.js or fallback in browsers
 */
export class TokenCounter {
  private encoders: Map<string, any> = new Map();
  private tiktokenReady = false;
  private fallbackCounter = new FallbackTokenCounter();
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize tiktoken (lazy loading)
   */
  private async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const tiktoken = await loadTiktoken();
      this.tiktokenReady = tiktoken !== null;
    })();

    return this.initPromise;
  }

  /**
   * Get or create encoder for a model (sync - uses fallback if tiktoken not ready)
   */
  private getEncoderSync(model: ModelType): any {
    if (!this.tiktokenReady || !tiktokenModule) {
      return null;
    }

    const encodingName = MODEL_ENCODING_MAP[model] || 'cl100k_base';

    if (!this.encoders.has(encodingName)) {
      try {
        const encoder = tiktokenModule.encoding_for_model(model as any);
        this.encoders.set(encodingName, encoder);
      } catch (error) {
        // Fallback to cl100k_base if model-specific encoding fails
        try {
          const encoder = tiktokenModule.encoding_for_model('gpt-4' as any);
          this.encoders.set(encodingName, encoder);
        } catch (e) {
          return null;
        }
      }
    }

    return this.encoders.get(encodingName) || null;
  }

  /**
   * Count tokens in a string
   */
  countStringTokens(text: string, model: ModelType): number {
    if (!text) return 0;

    const encoder = this.getEncoderSync(model);
    if (!encoder) {
      // Use fallback
      return this.fallbackCounter.countStringTokens(text);
    }

    return encoder.encode(text).length;
  }

  /**
   * Count tokens in a message with detailed breakdown
   */
  countMessageTokens(message: ContextMessage, model: ModelType): TokenCount {
    const encoder = this.getEncoderSync(model);

    if (!encoder) {
      // Use fallback counter
      return this.fallbackCounter.countMessageTokens(message);
    }

    const breakdown = {
      role: 0,
      name: 0,
      content: 0,
      functionCall: 0,
      toolCalls: 0,
    };

    // Every message follows <|start|>{role/name}\n{content}<|end|>\n
    let tokens = 3; // start, role, end tokens

    // Role tokens
    breakdown.role = encoder.encode(message.role).length;
    tokens += breakdown.role;

    // Name tokens
    if (message.name) {
      breakdown.name = encoder.encode(message.name).length + 1; // +1 for name prefix
      tokens += breakdown.name;
    }

    // Content tokens
    if (message.content) {
      breakdown.content = encoder.encode(message.content).length;
      tokens += breakdown.content;
    }

    // Function call tokens (legacy format)
    if (message.function_call) {
      const fnName = encoder.encode(message.function_call.name).length;
      const fnArgs = encoder.encode(message.function_call.arguments).length;
      breakdown.functionCall = fnName + fnArgs + 3; // +3 for structure tokens
      tokens += breakdown.functionCall;
    }

    // Tool calls tokens
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const toolId = encoder.encode(toolCall.id).length;
        const toolType = encoder.encode(toolCall.type).length;
        const fnName = encoder.encode(toolCall.function.name).length;
        const fnArgs = encoder.encode(toolCall.function.arguments).length;
        breakdown.toolCalls += toolId + toolType + fnName + fnArgs + 5; // +5 for structure tokens
      }
      tokens += breakdown.toolCalls;
    }

    // Tool call response overhead
    if (message.tool_call_id) {
      tokens += encoder.encode(message.tool_call_id).length + 2;
    }

    return {
      tokens,
      characters: 0, // Not tracked in this implementation
      breakdown,
    };
  }

  /**
   * Count tokens for an array of messages
   */
  countMessagesTokens(messages: ContextMessage[], model: ModelType): number {
    let total = 0;
    for (const message of messages) {
      total += this.countMessageTokens(message, model).tokens;
    }
    // Add overhead for message list
    total += 3; // every reply is primed with <|start|>assistant<|message|>
    return total;
  }

  /**
   * Estimate tokens remaining after adding a message
   */
  estimateRemainingTokens(
    messages: ContextMessage[],
    maxTokens: number,
    model: ModelType
  ): number {
    const used = this.countMessagesTokens(messages, model);
    return Math.max(0, maxTokens - used);
  }

  /**
   * Check if adding a message would exceed token limit
   */
  wouldExceedLimit(
    messages: ContextMessage[],
    newMessage: ContextMessage,
    maxTokens: number,
    model: ModelType
  ): boolean {
    const currentTokens = this.countMessagesTokens(messages, model);
    const newTokens = this.countMessageTokens(newMessage, model).tokens;
    return currentTokens + newTokens > maxTokens;
  }

  /**
   * Find the index where messages would exceed token limit
   */
  findTokenLimitIndex(
    messages: ContextMessage[],
    maxTokens: number,
    model: ModelType,
    fromEnd: boolean = true
  ): number {
    let totalTokens = 3; // base overhead
    const messagesToCheck = fromEnd ? [...messages].reverse() : messages;

    for (let i = 0; i < messagesToCheck.length; i++) {
      const message = messagesToCheck[i];
      if (!message) continue;
      const messageTokens = this.countMessageTokens(message, model).tokens;
      totalTokens += messageTokens;

      if (totalTokens > maxTokens) {
        return fromEnd ? messages.length - i : i;
      }
    }

    return fromEnd ? 0 : messages.length;
  }

  /**
   * Free encoder resources
   */
  dispose(): void {
    if (this.tiktokenReady) {
      for (const encoder of this.encoders.values()) {
        if (encoder && typeof encoder.free === 'function') {
          encoder.free();
        }
      }
    }
    this.encoders.clear();
  }

  /**
   * Check if tiktoken is available
   */
  isTiktokenAvailable(): boolean {
    return this.tiktokenReady;
  }

  /**
   * Preload tiktoken (optional, for better performance)
   * Call this early in Node.js environments to ensure tiktoken is ready
   */
  async preload(): Promise<boolean> {
    await this.init();
    return this.tiktokenReady;
  }
}

/**
 * Singleton instance for easy access
 */
export const tokenCounter = new TokenCounter();
