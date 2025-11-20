/**
 * Tests for MockLLMProvider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockLLMProvider } from '../../src/mocks/MockLLMProvider';

describe('MockLLMProvider', () => {
  let provider: MockLLMProvider;

  beforeEach(() => {
    provider = new MockLLMProvider({
      provider: 'openai',
      model: 'gpt-4',
      mockResponses: ['Response 1', 'Response 2'],
      tokenDelay: 0,
    });
  });

  describe('Chat Completion', () => {
    it('should return a chat response', async () => {
      const response = await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
      });

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('finishReason');
      expect(response.content).toBe('Response 1');
      expect(response.finishReason).toBe('stop');
    });

    it('should return usage statistics', async () => {
      const response = await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
      });

      expect(response.usage).toBeDefined();
      expect(response.usage?.promptTokens).toBeGreaterThan(0);
      expect(response.usage?.completionTokens).toBeGreaterThan(0);
      expect(response.usage?.totalTokens).toBeGreaterThan(0);
    });

    it('should cycle through mock responses', async () => {
      const response1 = await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'First', timestamp: Date.now() }],
      });

      const response2 = await provider.chat({
        messages: [{ id: '2', role: 'user', content: 'Second', timestamp: Date.now() }],
      });

      const response3 = await provider.chat({
        messages: [{ id: '3', role: 'user', content: 'Third', timestamp: Date.now() }],
      });

      expect(response1.content).toBe('Response 1');
      expect(response2.content).toBe('Response 2');
      expect(response3.content).toBe('Response 1'); // Cycles back
    });
  });

  describe('Tool Calls', () => {
    it('should return tool calls when configured', async () => {
      const toolProvider = new MockLLMProvider({
        provider: 'openai',
        model: 'gpt-4',
        mockToolCalls: [
          {
            id: 'call-1',
            name: 'get_weather',
            parameters: { location: 'SF' },
          },
        ],
      });

      const response = await toolProvider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
        tools: [],
      });

      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls).toHaveLength(1);
      expect(response.finishReason).toBe('tool_calls');
    });
  });

  describe('Streaming', () => {
    it('should support streaming', async () => {
      const chunks: string[] = [];
      const onStream = vi.fn((chunk: string) => {
        chunks.push(chunk);
      });

      await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
        streaming: true,
        onStream,
      });

      expect(onStream).toHaveBeenCalled();
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Error Simulation', () => {
    it('should throw errors when configured', async () => {
      const errorProvider = new MockLLMProvider({
        provider: 'openai',
        model: 'gpt-4',
        simulateError: true,
        error: new Error('API Error'),
      });

      await expect(
        errorProvider.chat({
          messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
        })
      ).rejects.toThrow('API Error');
    });
  });

  describe('Call History', () => {
    it('should track call history', async () => {
      await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'First', timestamp: Date.now() }],
      });

      await provider.chat({
        messages: [{ id: '2', role: 'user', content: 'Second', timestamp: Date.now() }],
      });

      const history = provider.getCallHistory();
      expect(history).toHaveLength(2);
    });

    it('should get call count', async () => {
      expect(provider.getCallCount()).toBe(0);

      await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
      });

      expect(provider.getCallCount()).toBe(1);
    });

    it('should get last call', async () => {
      await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
        temperature: 0.5,
      });

      const lastCall = provider.getLastCall();
      expect(lastCall).toBeDefined();
      expect(lastCall?.temperature).toBe(0.5);
    });

    it('should reset call history', async () => {
      await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
      });

      provider.resetCallHistory();

      expect(provider.getCallCount()).toBe(0);
    });
  });

  describe('Assertions', () => {
    it('should assert called with specific parameters', async () => {
      await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
        temperature: 0.7,
      });

      expect(
        provider.assertCalledWith({
          temperature: 0.7,
        })
      ).toBe(true);
    });

    it('should assert called with matcher function', async () => {
      await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
      });

      expect(
        provider.assertCalledWith((params) => params.messages.length > 0)
      ).toBe(true);
    });

    it('should assert call count', async () => {
      await provider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
      });

      expect(provider.assertCallCount(1)).toBe(true);
      expect(provider.assertCallCount(2)).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should allow setting mock responses', () => {
      provider.setMockResponses(['New 1', 'New 2']);
      // Response index should be reset
      expect(provider).toBeDefined();
    });

    it('should allow setting mock tool calls', () => {
      provider.setMockToolCalls([
        {
          id: 'call-1',
          name: 'test_tool',
          parameters: {},
        },
      ]);
      expect(provider).toBeDefined();
    });

    it('should allow setting error simulation', () => {
      provider.setSimulateError(new Error('Custom error'));
      expect(provider).toBeDefined();
    });
  });

  describe('Custom Usage', () => {
    it('should use custom mock usage', async () => {
      const customProvider = new MockLLMProvider({
        provider: 'openai',
        model: 'gpt-4',
        mockUsage: {
          promptTokens: 200,
          completionTokens: 100,
          totalTokens: 300,
          estimatedCost: 0.01,
        },
      });

      const response = await customProvider.chat({
        messages: [{ id: '1', role: 'user', content: 'Test', timestamp: Date.now() }],
      });

      expect(response.usage?.promptTokens).toBe(200);
      expect(response.usage?.completionTokens).toBe(100);
      expect(response.usage?.totalTokens).toBe(300);
      expect(response.usage?.estimatedCost).toBe(0.01);
    });
  });
});
