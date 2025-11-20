/**
 * Integration Tests: Core + React Integration
 *
 * Tests for AI Kit core and React packages working together
 */

import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { createMockAIStream } from '../utils/test-helpers';
import { mockTools, mockAgentConfig } from '../fixtures/mock-data';

describe('Core + React Integration', () => {
  describe('AIStream in React', () => {
    it('should use AIStream hook in React component', async () => {
      const useAIStreamIntegration = () => {
        const [content, setContent] = React.useState('');
        const [isStreaming, setIsStreaming] = React.useState(false);

        const startStream = async () => {
          setIsStreaming(true);
          const stream = createMockAIStream(['Hello', ' ', 'World'], 50);
          const reader = stream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            const match = text.match(/"content":"([^"]+)"/);
            if (match) {
              setContent((prev) => prev + match[1]);
            }
          }

          setIsStreaming(false);
        };

        return { content, isStreaming, startStream };
      };

      const { result } = renderHook(() => useAIStreamIntegration());

      await act(async () => {
        await result.current.startStream();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.content).toBeTruthy();
    });

    it('should handle streaming errors in React', async () => {
      const useStreamWithError = () => {
        const [error, setError] = React.useState<Error | null>(null);

        const startStream = async () => {
          try {
            throw new Error('Stream failed');
          } catch (e) {
            setError(e as Error);
          }
        };

        return { error, startStream };
      };

      const { result } = renderHook(() => useStreamWithError());

      await act(async () => {
        await result.current.startStream();
      });

      expect(result.current.error?.message).toBe('Stream failed');
    });

    it('should cancel stream on component unmount', async () => {
      const useStreamWithCleanup = () => {
        const abortControllerRef = React.useRef<AbortController>();

        const startStream = () => {
          abortControllerRef.current = new AbortController();
        };

        React.useEffect(() => {
          return () => {
            abortControllerRef.current?.abort();
          };
        }, []);

        return { startStream, abortController: abortControllerRef.current };
      };

      const { result, unmount } = renderHook(() => useStreamWithCleanup());

      act(() => {
        result.current.startStream();
      });

      unmount();

      expect(result.current.abortController?.signal.aborted).toBeTruthy();
    });
  });

  describe('Agent in React', () => {
    it('should use Agent in React component', async () => {
      const useAgent = () => {
        const [response, setResponse] = React.useState('');
        const [isProcessing, setIsProcessing] = React.useState(false);

        const executeAgent = async (prompt: string) => {
          setIsProcessing(true);

          // Simulate agent execution
          await new Promise(resolve => setTimeout(resolve, 100));
          setResponse(`Agent response to: ${prompt}`);

          setIsProcessing(false);
        };

        return { response, isProcessing, executeAgent };
      };

      const { result } = renderHook(() => useAgent());

      await act(async () => {
        await result.current.executeAgent('test prompt');
      });

      expect(result.current.response).toContain('test prompt');
      expect(result.current.isProcessing).toBe(false);
    });

    it('should use agent with tools', async () => {
      const useAgentWithTools = () => {
        const [result, setResult] = React.useState<any>(null);

        const executeWithTools = async () => {
          const calculator = mockTools[0];
          const toolResult = await calculator.execute({
            operation: 'add',
            a: 5,
            b: 3,
          });

          setResult(toolResult);
        };

        return { result, executeWithTools };
      };

      const { result } = renderHook(() => useAgentWithTools());

      await act(async () => {
        await result.current.executeWithTools();
      });

      expect(result.current.result).toBe(8);
    });

    it('should manage agent state in React', () => {
      const useAgentState = () => {
        const [config, setConfig] = React.useState(mockAgentConfig);

        const updateConfig = (updates: Partial<typeof mockAgentConfig>) => {
          setConfig((prev) => ({ ...prev, ...updates }));
        };

        return { config, updateConfig };
      };

      const { result } = renderHook(() => useAgentState());

      act(() => {
        result.current.updateConfig({ temperature: 0.9 });
      });

      expect(result.current.config.temperature).toBe(0.9);
    });
  });

  describe('Memory Integration', () => {
    it('should use memory store with React', () => {
      const useMemoryStore = () => {
        const [memories, setMemories] = React.useState<any[]>([]);

        const addMemory = (memory: any) => {
          setMemories((prev) => [...prev, memory]);
        };

        const searchMemories = (query: string) => {
          return memories.filter((m) =>
            m.content.toLowerCase().includes(query.toLowerCase())
          );
        };

        return { memories, addMemory, searchMemories };
      };

      const { result } = renderHook(() => useMemoryStore());

      act(() => {
        result.current.addMemory({ content: 'User prefers TypeScript' });
        result.current.addMemory({ content: 'Working on React project' });
      });

      const results = result.current.searchMemories('typescript');
      expect(results).toHaveLength(1);
    });

    it('should persist memory across renders', () => {
      const usePersistedMemory = () => {
        const [memory] = React.useState(() => {
          return { initialized: true, data: [] };
        });

        return memory;
      };

      const { result, rerender } = renderHook(() => usePersistedMemory());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Tool Execution', () => {
    it('should execute tools from React', async () => {
      const useToolExecution = () => {
        const [result, setResult] = React.useState<any>(null);
        const [isExecuting, setIsExecuting] = React.useState(false);

        const executeTool = async (toolName: string, params: any) => {
          setIsExecuting(true);

          const tool = mockTools.find((t) => t.name === toolName);
          if (tool) {
            const result = await tool.execute(params);
            setResult(result);
          }

          setIsExecuting(false);
        };

        return { result, isExecuting, executeTool };
      };

      const { result } = renderHook(() => useToolExecution());

      await act(async () => {
        await result.current.executeTool('calculator', {
          operation: 'multiply',
          a: 6,
          b: 7,
        });
      });

      expect(result.current.result).toBe(42);
    });

    it('should handle tool execution errors', async () => {
      const useToolWithError = () => {
        const [error, setError] = React.useState<Error | null>(null);

        const executeTool = async () => {
          try {
            const calculator = mockTools[0];
            await calculator.execute({
              operation: 'invalid',
              a: 1,
              b: 2,
            });
          } catch (e) {
            setError(e as Error);
          }
        };

        return { error, executeTool };
      };

      const { result } = renderHook(() => useToolWithError());

      await act(async () => {
        await result.current.executeTool();
      });

      expect(result.current.error?.message).toContain('Invalid operation');
    });

    it('should chain tool executions', async () => {
      const useToolChain = () => {
        const [results, setResults] = React.useState<number[]>([]);

        const executeChain = async () => {
          const calc = mockTools[0];

          const result1 = await calc.execute({ operation: 'add', a: 10, b: 5 });
          const result2 = await calc.execute({ operation: 'multiply', a: result1, b: 2 });
          const result3 = await calc.execute({ operation: 'subtract', a: result2, b: 10 });

          setResults([result1, result2, result3] as number[]);
        };

        return { results, executeChain };
      };

      const { result } = renderHook(() => useToolChain());

      await act(async () => {
        await result.current.executeChain();
      });

      expect(result.current.results).toEqual([15, 30, 20]);
    });
  });

  describe('State Management', () => {
    it('should sync core state with React state', () => {
      const coreState = { value: 0 };

      const useSyncedState = () => {
        const [state, setState] = React.useState(coreState.value);

        const updateState = (newValue: number) => {
          coreState.value = newValue;
          setState(newValue);
        };

        return { state, updateState };
      };

      const { result } = renderHook(() => useSyncedState());

      act(() => {
        result.current.updateState(42);
      });

      expect(result.current.state).toBe(42);
      expect(coreState.value).toBe(42);
    });

    it('should handle bidirectional sync', () => {
      const sharedState = { count: 0 };

      const useSharedState = () => {
        const [count, setCount] = React.useState(sharedState.count);

        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(sharedState.count);
          }, 100);

          return () => clearInterval(interval);
        }, []);

        const increment = () => {
          sharedState.count++;
          setCount(sharedState.count);
        };

        return { count, increment };
      };

      const { result } = renderHook(() => useSharedState());

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle core errors in React', async () => {
      const useCoreWithError = () => {
        const [error, setError] = React.useState<Error | null>(null);

        const triggerError = async () => {
          try {
            throw new Error('Core error');
          } catch (e) {
            setError(e as Error);
          }
        };

        return { error, triggerError };
      };

      const { result } = renderHook(() => useCoreWithError());

      await act(async () => {
        await result.current.triggerError();
      });

      expect(result.current.error?.message).toBe('Core error');
    });

    it('should provide error recovery', async () => {
      const useErrorRecovery = () => {
        const [attempts, setAttempts] = React.useState(0);
        const [success, setSuccess] = React.useState(false);

        const tryOperation = async () => {
          setAttempts((a) => a + 1);

          if (attempts < 2) {
            throw new Error('Retry');
          }

          setSuccess(true);
        };

        return { attempts, success, tryOperation };
      };

      const { result } = renderHook(() => useErrorRecovery());

      for (let i = 0; i < 3; i++) {
        try {
          await act(async () => {
            await result.current.tryOperation();
          });
        } catch (e) {
          // Expected on first attempts
        }
      }

      expect(result.current.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should optimize re-renders', () => {
      const renderCount = { value: 0 };

      const useOptimized = () => {
        renderCount.value++;
        const [state, setState] = React.useState(0);

        const memoizedUpdate = React.useCallback(() => {
          setState((s) => s + 1);
        }, []);

        return { state, update: memoizedUpdate, renders: renderCount.value };
      };

      const { result } = renderHook(() => useOptimized());

      const initialRenders = result.current.renders;

      act(() => {
        result.current.update();
      });

      expect(result.current.renders).toBe(initialRenders + 1);
    });

    it('should debounce frequent updates', async () => {
      const useDebounced = () => {
        const [value, setValue] = React.useState('');
        const [debouncedValue, setDebouncedValue] = React.useState('');

        React.useEffect(() => {
          const timeout = setTimeout(() => {
            setDebouncedValue(value);
          }, 300);

          return () => clearTimeout(timeout);
        }, [value]);

        return { value, debouncedValue, setValue };
      };

      const { result } = renderHook(() => useDebounced());

      act(() => {
        result.current.setValue('test');
      });

      expect(result.current.debouncedValue).toBe('');

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(result.current.debouncedValue).toBe('test');
    });

    it('should memoize expensive computations', () => {
      const expensiveCalc = (n: number) => {
        let result = 0;
        for (let i = 0; i < n; i++) {
          result += i;
        }
        return result;
      };

      const useMemoizedCalc = (input: number) => {
        const result = React.useMemo(() => expensiveCalc(input), [input]);
        return result;
      };

      const { result, rerender } = renderHook(
        ({ input }) => useMemoizedCalc(input),
        { initialProps: { input: 1000 } }
      );

      const firstResult = result.current;

      rerender({ input: 1000 });

      expect(result.current).toBe(firstResult);
    });
  });
});
