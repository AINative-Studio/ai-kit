/**
 * StreamingResponse unit tests
 */

import { vi } from 'vitest';
import { StreamingResponse } from '../../src/streaming/StreamingResponse';
import { SSEEventType, ResponseLike } from '../../src/streaming/types';

// Mock response object
class MockResponse implements ResponseLike {
  public writtenData: string[] = [];
  public headers: Record<string, string | string[]> = {};
  public ended: boolean = false;
  public statusCode?: number;
  private eventHandlers: Map<string, Array<(...args: unknown[]) => void>> = new Map();

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

  writeHead(statusCode: number, headers?: Record<string, string>): void {
    this.statusCode = statusCode;
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        this.headers[key] = value;
      });
    }
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(listener);
  }

  once(event: string, listener: (...args: unknown[]) => void): void {
    this.on(event, listener);
  }

  removeListener(event: string, listener: (...args: unknown[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(listener);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Helper to trigger events
  emit(event: string, ...args: unknown[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  // Helper to get all written data as a single string
  getWrittenData(): string {
    return this.writtenData.join('');
  }

  // Helper to parse SSE events
  parseSSEEvents(): Array<{ event?: string; data: unknown; id?: string }> {
    const events: Array<{ event?: string; data: unknown; id?: string }> = [];
    const fullData = this.getWrittenData();
    const eventBlocks = fullData.split('\n\n').filter(block => block.trim());

    for (const block of eventBlocks) {
      const lines = block.split('\n');
      const event: { event?: string; data?: string; id?: string } = {};

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          event.event = line.substring(7);
        } else if (line.startsWith('data: ')) {
          event.data = line.substring(6);
        } else if (line.startsWith('id: ')) {
          event.id = line.substring(4);
        }
      }

      if (event.data) {
        try {
          events.push({
            event: event.event,
            data: JSON.parse(event.data),
            id: event.id
          });
        } catch {
          events.push({
            event: event.event,
            data: event.data,
            id: event.id
          });
        }
      }
    }

    return events;
  }
}

describe('StreamingResponse', () => {
  let mockResponse: MockResponse;
  let streamingResponse: StreamingResponse;

  beforeEach(() => {
    mockResponse = new MockResponse();
    streamingResponse = new StreamingResponse(mockResponse);
  });

  describe('Initialization', () => {
    test('should create instance without errors', () => {
      expect(streamingResponse).toBeInstanceOf(StreamingResponse);
    });

    test('should not be active initially', () => {
      expect(streamingResponse.isStreamActive()).toBe(false);
    });

    test('should have zero message count initially', () => {
      expect(streamingResponse.getMessageCount()).toBe(0);
    });
  });

  describe('start()', () => {
    test('should set proper SSE headers', () => {
      streamingResponse.start();

      expect(mockResponse.headers['Content-Type']).toBe('text/event-stream');
      expect(mockResponse.headers['Cache-Control']).toBe('no-cache, no-transform');
      expect(mockResponse.headers['Connection']).toBe('keep-alive');
      expect(mockResponse.headers['X-Accel-Buffering']).toBe('no');
    });

    test('should set status code to 200', () => {
      streamingResponse.start();
      expect(mockResponse.statusCode).toBe(200);
    });

    test('should send start event', () => {
      streamingResponse.start();

      const events = mockResponse.parseSSEEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].event).toBe(SSEEventType.START);
      expect(events[0].data).toHaveProperty('timestamp');
    });

    test('should mark stream as active', () => {
      streamingResponse.start();
      expect(streamingResponse.isStreamActive()).toBe(true);
    });

    test('should throw error if started twice', () => {
      streamingResponse.start();
      expect(() => streamingResponse.start()).toThrow('Stream already started');
    });

    test('should apply custom headers', () => {
      const customStream = new StreamingResponse(mockResponse, {
        customHeaders: { 'X-Custom-Header': 'test-value' }
      });
      customStream.start();

      expect(mockResponse.headers['X-Custom-Header']).toBe('test-value');
    });

    test('should handle client disconnect', () => {
      streamingResponse.start();
      expect(streamingResponse.isStreamActive()).toBe(true);

      mockResponse.emit('close');
      expect(streamingResponse.isStreamActive()).toBe(false);
    });
  });

  describe('sendToken()', () => {
    beforeEach(() => {
      streamingResponse.start();
      mockResponse.writtenData = []; // Clear start event
    });

    test('should send token event with proper format', () => {
      streamingResponse.sendToken('Hello');

      const events = mockResponse.parseSSEEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe(SSEEventType.TOKEN);
      expect((events[0].data as { token: string }).token).toBe('Hello');
    });

    test('should send token with index', () => {
      streamingResponse.sendToken('Hello', 0);

      const events = mockResponse.parseSSEEvents();
      expect(events[0].data).toEqual({ token: 'Hello', index: 0 });
    });

    test('should increment message count', () => {
      const initialCount = streamingResponse.getMessageCount();
      streamingResponse.sendToken('Test');
      expect(streamingResponse.getMessageCount()).toBe(initialCount + 1);
    });

    test('should throw error if stream not started', () => {
      const newStream = new StreamingResponse(new MockResponse());
      expect(() => newStream.sendToken('Test')).toThrow('Stream not started');
    });

    test('should support method chaining', () => {
      const result = streamingResponse.sendToken('Hello');
      expect(result).toBe(streamingResponse);
    });

    test('should handle multiple tokens', () => {
      streamingResponse.sendToken('Hello', 0);
      streamingResponse.sendToken(' ', 1);
      streamingResponse.sendToken('World', 2);

      const events = mockResponse.parseSSEEvents();
      expect(events.length).toBe(3);
      expect((events[0].data as { token: string }).token).toBe('Hello');
      expect((events[1].data as { token: string }).token).toBe(' ');
      expect((events[2].data as { token: string }).token).toBe('World');
    });
  });

  describe('sendUsage()', () => {
    beforeEach(() => {
      streamingResponse.start();
      mockResponse.writtenData = [];
    });

    test('should send usage event with proper format', () => {
      const usage = {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      };

      streamingResponse.sendUsage(usage);

      const events = mockResponse.parseSSEEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe(SSEEventType.USAGE);
      expect(events[0].data).toEqual(usage);
    });

    test('should support optional fields', () => {
      const usage = {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        model: 'gpt-4',
        provider: 'openai'
      };

      streamingResponse.sendUsage(usage);

      const events = mockResponse.parseSSEEvents();
      expect(events[0].data).toEqual(usage);
    });

    test('should support method chaining', () => {
      const result = streamingResponse.sendUsage({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      });
      expect(result).toBe(streamingResponse);
    });
  });

  describe('sendError()', () => {
    beforeEach(() => {
      streamingResponse.start();
      mockResponse.writtenData = [];
    });

    test('should send error event with string message', () => {
      streamingResponse.sendError('Something went wrong');

      const events = mockResponse.parseSSEEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe(SSEEventType.ERROR);
      expect((events[0].data as { error: string }).error).toBe('Something went wrong');
    });

    test('should send error event with ErrorEvent object', () => {
      const errorEvent = {
        error: 'API Error',
        code: 'API_ERROR',
        details: { statusCode: 500 }
      };

      streamingResponse.sendError(errorEvent);

      const events = mockResponse.parseSSEEvents();
      expect(events[0].data).toEqual(errorEvent);
    });

    test('should support method chaining', () => {
      const result = streamingResponse.sendError('Test error');
      expect(result).toBe(streamingResponse);
    });
  });

  describe('sendMetadata()', () => {
    beforeEach(() => {
      streamingResponse.start();
      mockResponse.writtenData = [];
    });

    test('should send metadata event', () => {
      const metadata = {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      };

      streamingResponse.sendMetadata(metadata);

      const events = mockResponse.parseSSEEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe(SSEEventType.METADATA);
      expect(events[0].data).toEqual(metadata);
    });

    test('should support method chaining', () => {
      const result = streamingResponse.sendMetadata({ test: 'value' });
      expect(result).toBe(streamingResponse);
    });
  });

  describe('end()', () => {
    beforeEach(() => {
      streamingResponse.start();
      mockResponse.writtenData = [];
    });

    test('should send done event', () => {
      streamingResponse.end();

      const events = mockResponse.parseSSEEvents();
      const doneEvent = events.find(e => e.event === SSEEventType.DONE);
      expect(doneEvent).toBeDefined();
      expect(doneEvent?.data).toHaveProperty('timestamp');
    });

    test('should mark stream as inactive', () => {
      streamingResponse.end();
      expect(streamingResponse.isStreamActive()).toBe(false);
    });

    test('should end the response', () => {
      streamingResponse.end();
      expect(mockResponse.ended).toBe(true);
    });

    test('should be idempotent', () => {
      streamingResponse.end();
      streamingResponse.end(); // Should not throw
      expect(mockResponse.ended).toBe(true);
    });
  });

  describe('abort()', () => {
    beforeEach(() => {
      streamingResponse.start();
      mockResponse.writtenData = [];
    });

    test('should send error and end stream', () => {
      streamingResponse.abort('Aborted by user');

      const events = mockResponse.parseSSEEvents();
      const errorEvent = events.find(e => e.event === SSEEventType.ERROR);
      const doneEvent = events.find(e => e.event === SSEEventType.DONE);

      expect(errorEvent).toBeDefined();
      expect(doneEvent).toBeDefined();
      expect(mockResponse.ended).toBe(true);
    });

    test('should be idempotent', () => {
      streamingResponse.abort('Test');
      streamingResponse.abort('Test again'); // Should not throw
      expect(mockResponse.ended).toBe(true);
    });
  });

  describe('SSE Format Compliance', () => {
    beforeEach(() => {
      streamingResponse.start();
      mockResponse.writtenData = [];
    });

    test('should format events with proper SSE syntax', () => {
      streamingResponse.sendToken('Test');

      const rawData = mockResponse.getWrittenData();
      expect(rawData).toContain('event: token\n');
      expect(rawData).toContain('data: ');
      expect(rawData).toContain('\n\n'); // Double newline
    });

    test('should include message IDs', () => {
      streamingResponse.sendToken('Test');

      const rawData = mockResponse.getWrittenData();
      expect(rawData).toContain('id: ');
    });

    test('should handle multi-line data', () => {
      streamingResponse.sendToken('Line 1\nLine 2');

      const rawData = mockResponse.getWrittenData();
      const dataLines = rawData.split('\n').filter(line => line.startsWith('data: '));
      expect(dataLines.length).toBeGreaterThan(0);
    });
  });

  describe('Heartbeat', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should send heartbeat when enabled', () => {
      const heartbeatStream = new StreamingResponse(mockResponse, {
        enableHeartbeat: true,
        heartbeatInterval: 1000
      });

      heartbeatStream.start();
      mockResponse.writtenData = [];

      vi.advanceTimersByTime(1000);

      const rawData = mockResponse.getWrittenData();
      expect(rawData).toContain(': heartbeat');
    });

    test('should not send heartbeat when disabled', () => {
      streamingResponse.start();
      mockResponse.writtenData = [];

      vi.advanceTimersByTime(30000);

      const rawData = mockResponse.getWrittenData();
      expect(rawData).not.toContain(': heartbeat');
    });

    test('should stop heartbeat on end', () => {
      const heartbeatStream = new StreamingResponse(mockResponse, {
        enableHeartbeat: true,
        heartbeatInterval: 1000
      });

      heartbeatStream.start();
      heartbeatStream.end();
      mockResponse.writtenData = [];

      vi.advanceTimersByTime(5000);

      const rawData = mockResponse.getWrittenData();
      expect(rawData).not.toContain(': heartbeat');
    });
  });

  describe('Complete Flow', () => {
    test('should handle a complete streaming session', () => {
      streamingResponse.start();
      mockResponse.writtenData = [];

      streamingResponse.sendToken('Hello', 0);
      streamingResponse.sendToken(' ', 1);
      streamingResponse.sendToken('World', 2);
      streamingResponse.sendUsage({
        promptTokens: 5,
        completionTokens: 3,
        totalTokens: 8
      });
      streamingResponse.end();

      const events = mockResponse.parseSSEEvents();

      // Should have 3 token events, 1 usage event, and 1 done event
      const tokenEvents = events.filter(e => e.event === SSEEventType.TOKEN);
      const usageEvents = events.filter(e => e.event === SSEEventType.USAGE);
      const doneEvents = events.filter(e => e.event === SSEEventType.DONE);

      expect(tokenEvents.length).toBe(3);
      expect(usageEvents.length).toBe(1);
      expect(doneEvents.length).toBe(1);
      expect(mockResponse.ended).toBe(true);
    });
  });
});
