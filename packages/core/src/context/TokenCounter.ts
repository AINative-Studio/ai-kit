/**
 * Token counting utilities using tiktoken
 */

import { encoding_for_model, Tiktoken } from 'tiktoken';
import {
  ContextMessage,
  ModelType,
  TokenCount,
  MODEL_ENCODING_MAP,
} from './types';

/**
 * TokenCounter class for accurate token counting
 */
export class TokenCounter {
  private encoders: Map<string, Tiktoken> = new Map();

  /**
   * Get or create encoder for a model
   */
  private getEncoder(model: ModelType): Tiktoken {
    const encodingName = MODEL_ENCODING_MAP[model] || 'cl100k_base';

    if (!this.encoders.has(encodingName)) {
      try {
        const encoder = encoding_for_model(model as any);
        this.encoders.set(encodingName, encoder);
      } catch (error) {
        // Fallback to cl100k_base if model-specific encoding fails
        const encoder = encoding_for_model('gpt-4' as any);
        this.encoders.set(encodingName, encoder);
      }
    }

    return this.encoders.get(encodingName)!;
  }

  /**
   * Count tokens in a string
   */
  countStringTokens(text: string, model: ModelType): number {
    if (!text) return 0;
    const encoder = this.getEncoder(model);
    return encoder.encode(text).length;
  }

  /**
   * Count tokens in a message with detailed breakdown
   */
  countMessageTokens(message: ContextMessage, model: ModelType): TokenCount {
    const encoder = this.getEncoder(model);
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
      const messageTokens = this.countMessageTokens(messagesToCheck[i], model).tokens;
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
    for (const encoder of this.encoders.values()) {
      encoder.free();
    }
    this.encoders.clear();
  }
}

/**
 * Singleton instance for easy access
 */
export const tokenCounter = new TokenCounter();
