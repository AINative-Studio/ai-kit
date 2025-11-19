/**
 * OpenAIAdapter unit tests
 */

import { OpenAIAdapter } from '../../../src/streaming/adapters/OpenAIAdapter';
import { StreamingResponse } from '../../../src/streaming/StreamingResponse';
import { OpenAIStreamChunk, SSEEventType, ResponseLike } from '../../../src/streaming/types';

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

describe('OpenAIAdapter', () => {
  let mockResponse: MockResponse;
  let streamingResponse: StreamingResponse;
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    mockResponse = new MockResponse();
    streamingResponse = new StreamingResponse(mockResponse);
    streamingResponse.start();
    mockResponse.writtenData = []; // Clear start event
    adapter = new OpenAIAdapter(streamingResponse);
  });

  describe('processChunk()', () => {
    test('should process valid OpenAI chunk with content', () => {
      const chunk: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: { content: 'Hello' },
            finish_reason: null
          }
        ]
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const tokenEvent = events.find(e => e.event === SSEEventType.TOKEN);

      expect(tokenEvent).toBeDefined();
      expect((tokenEvent?.data as { token: string }).token).toBe('Hello');
    });

    test('should process chunk with multiple choices', () => {
      const chunk: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: { content: 'First' },
            finish_reason: null
          },
          {
            index: 1,
            delta: { content: 'Second' },
            finish_reason: null
          }
        ]
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const tokenEvents = events.filter(e => e.event === SSEEventType.TOKEN);

      expect(tokenEvents.length).toBe(2);
      expect((tokenEvents[0].data as { token: string }).token).toBe('First');
      expect((tokenEvents[1].data as { token: string }).token).toBe('Second');
    });

    test('should handle chunk with usage metadata', () => {
      const chunk: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const usageEvent = events.find(e => e.event === SSEEventType.USAGE);

      expect(usageEvent).toBeDefined();
      expect(usageEvent?.data).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        provider: 'openai'
      });
    });

    test('should handle finish_reason: stop', () => {
      const chunk: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop'
          }
        ]
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const metadataEvent = events.find(e => e.event === SSEEventType.METADATA);

      expect(metadataEvent).toBeDefined();
      expect((metadataEvent?.data as { finishReason: string }).finishReason).toBe('stop');
    });

    test('should handle finish_reason: length with warning', () => {
      const chunk: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'length'
          }
        ]
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const metadataEvent = events.find(e => e.event === SSEEventType.METADATA);

      expect(metadataEvent).toBeDefined();
      expect((metadataEvent?.data as { warning: string }).warning).toBe('Response truncated due to length limit');
    });

    test('should handle finish_reason: content_filter with warning', () => {
      const chunk: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'content_filter'
          }
        ]
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const metadataEvent = events.find(e => e.event === SSEEventType.METADATA);

      expect(metadataEvent).toBeDefined();
      expect((metadataEvent?.data as { warning: string }).warning).toBe('Content filtered by moderation system');
    });

    test('should send error for invalid chunk format', () => {
      const invalidChunk = { invalid: 'data' };

      adapter.processChunk(invalidChunk);

      const events = mockResponse.parseSSEEvents();
      const errorEvent = events.find(e => e.event === SSEEventType.ERROR);

      expect(errorEvent).toBeDefined();
      expect((errorEvent?.data as { error: string }).error).toBe('Invalid OpenAI chunk format');
    });

    test('should handle chunk with no content', () => {
      const chunk: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: null
          }
        ]
      };

      adapter.processChunk(chunk);

      const events = mockResponse.parseSSEEvents();
      const tokenEvents = events.filter(e => e.event === SSEEventType.TOKEN);

      expect(tokenEvents.length).toBe(0);
    });

    test('should increment token index for sequential tokens', () => {
      const chunk1: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [{ index: 0, delta: { content: 'Hello' }, finish_reason: null }]
      };

      const chunk2: OpenAIStreamChunk = {
        id: 'chatcmpl-123',
        object: 'chat.completion.chunk',
        created: 1234567890,
        model: 'gpt-4',
        choices: [{ index: 0, delta: { content: ' world' }, finish_reason: null }]
      };

      adapter.processChunk(chunk1);
      adapter.processChunk(chunk2);

      const events = mockResponse.parseSSEEvents();
      const tokenEvents = events.filter(e => e.event === SSEEventType.TOKEN);

      expect(tokenEvents.length).toBe(2);
      expect((tokenEvents[0].data as { index: number }).index).toBe(0);
      expect((tokenEvents[1].data as { index: number }).index).toBe(1);
    });
  });

  describe('handleError()', () => {
    test('should handle Error object', () => {
      const error = new Error('Test error');
      adapter.handleError(error);

      const events = mockResponse.parseSSEEvents();
      const errorEvent = events.find(e => e.event === SSEEventType.ERROR);

      expect(errorEvent).toBeDefined();
      expect((errorEvent?.data as { error: string }).error).toBe('Test error');
      expect((errorEvent?.data as { code: string }).code).toBe('Error');
    });

    test('should handle string error', () => {
      adapter.handleError('String error');

      const events = mockResponse.parseSSEEvents();
      const errorEvent = events.find(e => e.event === SSEEventType.ERROR);

      expect(errorEvent).toBeDefined();
      expect((errorEvent?.data as { error: string }).error).toBe('String error');
    });
  });

  describe('Complete streaming session', () => {
    test('should handle a complete OpenAI streaming response', () => {
      // Simulate a complete OpenAI streaming response
      const chunks: OpenAIStreamChunk[] = [
        {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [{ index: 0, delta: { content: 'The' }, finish_reason: null }]
        },
        {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [{ index: 0, delta: { content: ' weather' }, finish_reason: null }]
        },
        {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [{ index: 0, delta: { content: ' is' }, finish_reason: null }]
        },
        {
          id: 'chatcmpl-123',
          object: 'chat.completion.chunk',
          created: 1234567890,
          model: 'gpt-4',
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
          usage: {
            prompt_tokens: 15,
            completion_tokens: 8,
            total_tokens: 23
          }
        }
      ];

      chunks.forEach(chunk => adapter.processChunk(chunk));

      const events = mockResponse.parseSSEEvents();
      const tokenEvents = events.filter(e => e.event === SSEEventType.TOKEN);
      const usageEvents = events.filter(e => e.event === SSEEventType.USAGE);
      const metadataEvents = events.filter(e => e.event === SSEEventType.METADATA);

      expect(tokenEvents.length).toBe(3);
      expect(usageEvents.length).toBe(1);
      expect(metadataEvents.length).toBe(1); // finish_reason

      // Verify token content
      expect((tokenEvents[0].data as { token: string }).token).toBe('The');
      expect((tokenEvents[1].data as { token: string }).token).toBe(' weather');
      expect((tokenEvents[2].data as { token: string }).token).toBe(' is');

      // Verify usage
      expect(usageEvents[0].data).toEqual({
        promptTokens: 15,
        completionTokens: 8,
        totalTokens: 23,
        provider: 'openai'
      });
    });
  });
});
