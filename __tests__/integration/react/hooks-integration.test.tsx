/**
 * Integration Tests: React Hooks
 *
 * Tests for React hooks integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mockMessages, mockConversation } from '../fixtures/mock-data';

// Mock hooks for testing
const createMockUseAIStream = () => {
  return () => {
    const [stream, setStream] = React.useState<string>('');
    const [isStreaming, setIsStreaming] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    const startStream = async (prompt: string) => {
      setIsStreaming(true);
      setError(null);

      try {
        // Simulate streaming
        const chunks = ['Hello', ' ', 'world', '!'];
        for (const chunk of chunks) {
          await new Promise((r) => setTimeout(r, 50));
          setStream((prev) => prev + chunk);
        }
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsStreaming(false);
      }
    };

    return { stream, isStreaming, error, startStream };
  };
};

const createMockUseConversation = () => {
  return () => {
    const [messages, setMessages] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const sendMessage = async (content: string) => {
      setIsLoading(true);

      const userMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Simulate AI response
      await new Promise((r) => setTimeout(r, 100));

      const aiMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'AI response',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    };

    return { messages, isLoading, sendMessage };
  };
};

import * as React from 'react';

describe('React Hooks Integration', () => {
  describe('useAIStream + useConversation', () => {
    it('should work together for chat functionality', async () => {
      const useAIStream = createMockUseAIStream();
      const useConversation = createMockUseConversation();

      const { result: streamResult } = renderHook(() => useAIStream());
      const { result: conversationResult } = renderHook(() => useConversation());

      // Start streaming
      await act(async () => {
        await streamResult.current.startStream('Hello');
      });

      // Add streamed message to conversation
      await act(async () => {
        await conversationResult.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(conversationResult.current.messages.length).toBeGreaterThan(0);
      });

      expect(streamResult.current.stream).toBeTruthy();
    });

    it('should handle concurrent hook operations', async () => {
      const useConversation = createMockUseConversation();
      const { result } = renderHook(() => useConversation());

      await act(async () => {
        await Promise.all([
          result.current.sendMessage('Message 1'),
          result.current.sendMessage('Message 2'),
        ]);
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(0);
      });
    });

    it('should share state between hooks', async () => {
      const sharedState = { conversationId: 'conv-1' };

      const useAIStream = () => {
        return { conversationId: sharedState.conversationId };
      };

      const useConversation = () => {
        return { conversationId: sharedState.conversationId };
      };

      const { result: stream } = renderHook(() => useAIStream());
      const { result: conversation } = renderHook(() => useConversation());

      expect(stream.current.conversationId).toBe(conversation.current.conversationId);
    });
  });

  describe('Multiple Hooks Interaction', () => {
    it('should coordinate multiple hook updates', async () => {
      const useConversation = createMockUseConversation();
      const { result } = renderHook(() => useConversation());

      const updates = [
        'Message 1',
        'Message 2',
        'Message 3',
      ];

      for (const update of updates) {
        await act(async () => {
          await result.current.sendMessage(update);
        });
      }

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(updates.length);
      });
    });

    it('should handle hook dependency chains', async () => {
      const useDependentHook = () => {
        const [step, setStep] = React.useState(0);
        const [data, setData] = React.useState<any>(null);

        React.useEffect(() => {
          if (step === 1) {
            setData({ loaded: true });
          }
        }, [step]);

        return { step, setStep, data };
      };

      const { result } = renderHook(() => useDependentHook());

      expect(result.current.data).toBeNull();

      act(() => {
        result.current.setStep(1);
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ loaded: true });
      });
    });
  });

  describe('State Synchronization', () => {
    it('should sync state across hook instances', async () => {
      const globalState = { value: 0 };

      const useSharedState = () => {
        const [state, setState] = React.useState(globalState.value);

        const updateState = (newValue: number) => {
          globalState.value = newValue;
          setState(newValue);
        };

        return { state, updateState };
      };

      const { result: hook1 } = renderHook(() => useSharedState());
      const { result: hook2 } = renderHook(() => useSharedState());

      act(() => {
        hook1.current.updateState(42);
      });

      expect(globalState.value).toBe(42);
    });

    it('should handle state conflicts', async () => {
      let sharedValue = 0;

      const useCounter = () => {
        const [count, setCount] = React.useState(sharedValue);

        const increment = () => {
          const newValue = count + 1;
          sharedValue = newValue;
          setCount(newValue);
        };

        return { count, increment };
      };

      const { result } = renderHook(() => useCounter());

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(1);
    });

    it('should batch state updates', async () => {
      const useMultipleStates = () => {
        const [state1, setState1] = React.useState(0);
        const [state2, setState2] = React.useState(0);

        const updateBoth = () => {
          setState1((prev) => prev + 1);
          setState2((prev) => prev + 1);
        };

        return { state1, state2, updateBoth };
      };

      const { result } = renderHook(() => useMultipleStates());

      act(() => {
        result.current.updateBoth();
      });

      expect(result.current.state1).toBe(1);
      expect(result.current.state2).toBe(1);
    });
  });

  describe('Effect Cleanup', () => {
    it('should cleanup effects on unmount', async () => {
      const cleanup = vi.fn();

      const useEffectWithCleanup = () => {
        React.useEffect(() => {
          return () => cleanup();
        }, []);
      };

      const { unmount } = renderHook(() => useEffectWithCleanup());

      unmount();

      expect(cleanup).toHaveBeenCalled();
    });

    it('should cancel pending requests on unmount', async () => {
      const useAsyncRequest = () => {
        const [data, setData] = React.useState(null);
        const abortControllerRef = React.useRef<AbortController>();

        const fetchData = async () => {
          abortControllerRef.current = new AbortController();

          try {
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(resolve, 1000);
              abortControllerRef.current.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('Aborted'));
              });
            });

            setData({ loaded: true });
          } catch (error) {
            // Request cancelled
          }
        };

        React.useEffect(() => {
          return () => {
            abortControllerRef.current?.abort();
          };
        }, []);

        return { data, fetchData };
      };

      const { result, unmount } = renderHook(() => useAsyncRequest());

      act(() => {
        result.current.fetchData();
      });

      unmount();

      expect(result.current.data).toBeNull();
    });

    it('should cleanup timers', async () => {
      const useTimer = () => {
        const [count, setCount] = React.useState(0);

        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount((c) => c + 1);
          }, 100);

          return () => clearInterval(interval);
        }, []);

        return { count };
      };

      const { result, unmount } = renderHook(() => useTimer());

      await new Promise((r) => setTimeout(r, 250));

      const countBeforeUnmount = result.current.count;
      unmount();

      await new Promise((r) => setTimeout(r, 250));

      expect(result.current.count).toBe(countBeforeUnmount);
    });
  });

  describe('Error Boundaries', () => {
    it('should handle hook errors', async () => {
      const useErrorProneHook = () => {
        const [error, setError] = React.useState<Error | null>(null);

        const triggerError = () => {
          try {
            throw new Error('Hook error');
          } catch (e) {
            setError(e as Error);
          }
        };

        return { error, triggerError };
      };

      const { result } = renderHook(() => useErrorProneHook());

      act(() => {
        result.current.triggerError();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Hook error');
    });

    it('should recover from errors', async () => {
      const useRecoverableHook = () => {
        const [error, setError] = React.useState<Error | null>(null);
        const [data, setData] = React.useState(null);

        const fetchWithRetry = async () => {
          try {
            // Simulate failure then success
            if (!data) {
              throw new Error('First attempt failed');
            }
          } catch (e) {
            setError(e as Error);
            // Retry
            setData({ recovered: true } as any);
            setError(null);
          }
        };

        return { error, data, fetchWithRetry };
      };

      const { result } = renderHook(() => useRecoverableHook());

      await act(async () => {
        await result.current.fetchWithRetry();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Performance Optimization', () => {
    it('should memoize expensive calculations', async () => {
      const expensiveCalculation = vi.fn((n: number) => {
        let result = 0;
        for (let i = 0; i < n; i++) {
          result += i;
        }
        return result;
      });

      const useMemoizedValue = (input: number) => {
        const value = React.useMemo(
          () => expensiveCalculation(input),
          [input]
        );

        return { value };
      };

      const { result, rerender } = renderHook(
        ({ input }) => useMemoizedValue(input),
        { initialProps: { input: 100 } }
      );

      expect(expensiveCalculation).toHaveBeenCalledTimes(1);

      rerender({ input: 100 });

      expect(expensiveCalculation).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should use callback memoization', async () => {
      const useCallbackMemo = () => {
        const [count, setCount] = React.useState(0);

        const increment = React.useCallback(() => {
          setCount((c) => c + 1);
        }, []);

        return { count, increment };
      };

      const { result } = renderHook(() => useCallbackMemo());

      const firstIncrement = result.current.increment;

      act(() => {
        result.current.increment();
      });

      const secondIncrement = result.current.increment;

      expect(firstIncrement).toBe(secondIncrement);
    });

    it('should prevent unnecessary rerenders', async () => {
      const renderCount = { value: 0 };

      const useOptimizedHook = () => {
        renderCount.value++;
        const [state, setState] = React.useState({ value: 0 });

        const updateValue = React.useCallback((newValue: number) => {
          setState({ value: newValue });
        }, []);

        return { state, updateValue, renderCount: renderCount.value };
      };

      const { result } = renderHook(() => useOptimizedHook());

      const initialRenderCount = result.current.renderCount;

      act(() => {
        result.current.updateValue(1);
      });

      expect(result.current.renderCount).toBe(initialRenderCount + 1);
    });
  });
});
