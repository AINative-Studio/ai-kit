/**
 * AnthropicAdapter unit tests
 */

import { AnthropicAdapter } from '../../../src/streaming/adapters/AnthropicAdapter';
import { StreamingResponse } from '../../../src/streaming/StreamingResponse';
import { AnthropicStreamChunk, SSEEventType, ResponseLike } from '../../../src/streaming/types';

// Mock response (simplified for testing)
class MockResponse implements ResponseLike {
  public writtenData: string[] = [];
  public headers: Record<string, string | string[]> = {};
  public ended: boolean = false;

  write(chunk: string | Buffer): boolean {
    this.writtenData.push(chunk.toString());
    return true;
  }

  end(chunk?: string | Buffer): void {
    if (chunk) {
      this.writtenData.push(chunk.toString());
    }
    this.ended = true;
  }

  setHeader(name: string, value: string | string[]): void {
    this.headers[name] = value;
  }

  parseSSEEvents(): Array<{ event?: string; data: unknown }> {
    const events: Array<{ event?: string; data: unknown }> = [];
    const fullData = this.writtenData.join('');
    const eventBlocks = fullData.split('\n\n').filter(block => block.trim());

    for (const block of eventBlocks) {
      const lines = block.split('\n');
      const event: { event?: string; data?: string } = {};

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          event.event = line.substring(7);
        } else if (line.startsWith('data: ')) {
          event.data = line.substring(6);
        }
      }

      if (event.data) {
        try {
          events.push({
            event: event.event,
            data: JSON.parse(event.data)
          });
        } catch {
          events.push({
            event: event.event,
            data: event.data
          });
        }
      }
    }

    return events;
  }
}

describe('AnthropicAdapter', () => {
  let mockResponse: MockResponse;
  let streamingResponse: StreamingResponse;
  let adapter: AnthropicAdapter;

  beforeEach(() => {
    mockResponse = new MockResponse();
    streamingResponse = new StreamingResponse(mockResponse);
    streamingResponse.start();
    mockResponse.writtenData = []; // Clear start event
    adapter = new AnthropicAdapter(streamingResponse);
  });

  describe('processChunk()', () => {
    test('should handle message_start event', () => {
      const chunk: AnthropicStreamChunk = {
        type: 'message_start',
        message: {
          id: 'msg_123',
          model: 'claude-3-opus-20240229',
          role: 'assistant',
          content: [],
          usage: {
            input_tokens: 15,
            output_tokens: 0
          }
        }
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const metadataEvent = events.find(e => e.event === SSEEventType.METADATA);

      expect(metadataEvent).toBeDefined();
      expect((metadataEvent?.data as { messageId: string }).messageId).toBe('msg_123');
      expect((metadataEvent?.data as { model: string }).model).toBe('claude-3-opus-20240229');
    });

    test('should handle content_block_delta event', () => {
      const chunk: AnthropicStreamChunk = {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: 'Hello'
        }
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const tokenEvent = events.find(e => e.event === SSEEventType.TOKEN);

      expect(tokenEvent).toBeDefined();
      expect((tokenEvent?.data as { token: string }).token).toBe('Hello');
    });

    test('should handle message_delta event with usage', () => {
      const chunk: AnthropicStreamChunk = {
        type: 'message_delta',
        delta: {
          type: 'text_delta'
        },
        usage: {
          output_tokens: 25
        }
      };

      adapter.processChunk(chunk);

      // Usage is accumulated, not sent immediately in message_delta
      const events = mockResponse.parseSSEEvents();
      const usageEvents = events.filter(e => e.event === SSEEventType.USAGE);
      expect(usageEvents.length).toBe(0);
    });

    test('should handle message_stop event', () => {
      const chunk: AnthropicStreamChunk = {
        type: 'message_stop'
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const metadataEvent = events.find(e => e.event === SSEEventType.METADATA);

      expect(metadataEvent).toBeDefined();
      expect((metadataEvent?.data as { stopReason: string }).stopReason).toBe('end_turn');
    });

    test('should handle content_block_start event', () => {
      const chunk: AnthropicStreamChunk = {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'text',
          text: ''
        }
      };

      adapter.processChunk(chunk);

      // content_block_start doesn't send any events, just prepares for content
      const events = mockResponse.parseSSEEvents();
      expect(events.length).toBe(0);
    });

    test('should handle content_block_stop event', () => {
      const chunk: AnthropicStreamChunk = {
        type: 'content_block_stop',
        index: 0
      };

      adapter.processChunk(chunk);

      // content_block_stop doesn't send any events
      const events = mockResponse.parseSSEEvents();
      expect(events.length).toBe(0);
    });

    test('should send error for invalid chunk format', () => {
      const invalidChunk = { invalid: 'data' };

      adapter.processChunk(invalidChunk);

      const events = mockResponse.parseSSEEvents();
      const errorEvent = events.find(e => e.event === SSEEventType.ERROR);

      expect(errorEvent).toBeDefined();
      expect((errorEvent?.data as { error: string }).error).toBe('Invalid Anthropic chunk format');
    });

    test('should handle unknown chunk type with warning', () => {
      const chunk: AnthropicStreamChunk = {
        type: 'unknown_type' as any
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const metadataEvent = events.find(e => e.event === SSEEventType.METADATA);

      expect(metadataEvent).toBeDefined();
      expect((metadataEvent?.data as { warning: string }).warning).toContain('Unknown chunk type');
    });

    test('should increment token index for sequential tokens', () => {
      const chunks: AnthropicStreamChunk[] = [
        {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: 'Hello' }
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: ' world' }
        }
      ];

      chunks.forEach(chunk => adapter.processChunk(chunk));

      const events = mockResponse.parseSSEEvents();
      const tokenEvents = events.filter(e => e.event === SSEEventType.TOKEN);

      expect(tokenEvents.length).toBe(2);
      expect((tokenEvents[0].data as { index: number }).index).toBe(0);
      expect((tokenEvents[1].data as { index: number }).index).toBe(1);
    });
  });

  describe('onComplete()', () => {
    test('should send accumulated usage on completion', () => {
      // Simulate message_start with input tokens
      const startChunk: AnthropicStreamChunk = {
        type: 'message_start',
        message: {
          id: 'msg_123',
          model: 'claude-3-opus-20240229',
          role: 'assistant',
          content: [],
          usage: {
            input_tokens: 15,
            output_tokens: 0
          }
        }
      };

      // Simulate message_delta with output tokens
      const deltaChunk: AnthropicStreamChunk = {
        type: 'message_delta',
        delta: { type: 'text_delta' },
        usage: {
          output_tokens: 25
        }
      };

      adapter.processChunk(startChunk);
      adapter.processChunk(deltaChunk);
      mockResponse.writtenData = []; // Clear events

      adapter.onComplete();

      const events = mockResponse.parseSSEEvents();
      const usageEvent = events.find(e => e.event === SSEEventType.USAGE);

      expect(usageEvent).toBeDefined();
      expect(usageEvent?.data).toEqual({
        promptTokens: 15,
        completionTokens: 25,
        totalTokens: 40,
        provider: 'anthropic'
      });
    });

    test('should not send usage if no tokens accumulated', () => {
      adapter.onComplete();

      const events = mockResponse.parseSSEEvents();
      const usageEvents = events.filter(e => e.event === SSEEventType.USAGE);

      expect(usageEvents.length).toBe(0);
    });
  });

  describe('Complete streaming session', () => {
    test('should handle a complete Anthropic streaming response', () => {
      // Simulate a complete Anthropic streaming response
      const chunks: AnthropicStreamChunk[] = [
        {
          type: 'message_start',
          message: {
            id: 'msg_123',
            model: 'claude-3-opus-20240229',
            role: 'assistant',
            content: [],
            usage: {
              input_tokens: 20,
              output_tokens: 0
            }
          }
        },
        {
          type: 'content_block_start',
          index: 0,
          content_block: {
            type: 'text',
            text: ''
          }
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: {
            type: 'text_delta',
            text: 'The'
          }
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: {
            type: 'text_delta',
            text: ' weather'
          }
        },
        {
          type: 'content_block_delta',
          index: 0,
          delta: {
            type: 'text_delta',
            text: ' is'
          }
        },
        {
          type: 'content_block_stop',
          index: 0
        },
        {
          type: 'message_delta',
          delta: {
            type: 'text_delta'
          },
          usage: {
            output_tokens: 10
          }
        },
        {
          type: 'message_stop'
        }
      ];

      chunks.forEach(chunk => adapter.processChunk(chunk));
      adapter.onComplete();

      const events = mockResponse.parseSSEEvents();
      const tokenEvents = events.filter(e => e.event === SSEEventType.TOKEN);
      const usageEvents = events.filter(e => e.event === SSEEventType.USAGE);
      const metadataEvents = events.filter(e => e.event === SSEEventType.METADATA);

      expect(tokenEvents.length).toBe(3);
      expect(usageEvents.length).toBe(1);
      expect(metadataEvents.length).toBeGreaterThanOrEqual(2); // message_start and message_stop

      // Verify token content
      expect((tokenEvents[0].data as { token: string }).token).toBe('The');
      expect((tokenEvents[1].data as { token: string }).token).toBe(' weather');
      expect((tokenEvents[2].data as { token: string }).token).toBe(' is');

      // Verify usage
      expect(usageEvents[0].data).toEqual({
        promptTokens: 20,
        completionTokens: 10,
        totalTokens: 30,
        provider: 'anthropic'
      });
    });
  });
});
