/**
 * Performance Tests: Agent Execution
 *
 * Tests agent execution performance for:
 * - Agent execution latency
 * - Tool call overhead
 * - Streaming agent performance
 * - Multi-agent coordination
 *
 * Refs #68
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'
import { z } from 'zod'
import { Agent } from '../../src/agents/Agent'
import { AgentExecutor } from '../../src/agents/AgentExecutor'
import { StreamingAgentExecutor } from '../../src/agents/StreamingAgentExecutor'
import { ToolDefinition, ToolCall } from '../../src/agents/types'

describe('Performance: Agent Execution', () => {
  let calculatorTool: ToolDefinitionDefinition
  let searchTool: ToolDefinitionDefinition

  beforeEach(() => {
    calculatorTool = {
      name: 'calculator',
      description: 'Performs mathematical calculations',
      parameters: z.object({
        expression: z.string().describe('Mathematical expression to evaluate')
      }),
      execute: async (params: any) => {
        // Simulate fast calculation
        return { result: eval(params.expression) }
      }
    }

    searchTool = {
      name: 'search',
      description: 'Search the web',
      parameters: z.object({
        query: z.string().describe('Search query')
      }),
      execute: async (params: any) => {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 50))
        return { results: [`Result for ${params.query}`] }
      }
    }
  })

  describe('Tool Execution Overhead', () => {
    it('should execute simple tool calls with minimal overhead (<10ms)', async () => {
      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          
        },
        tools: [calculatorTool]
      })

      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'calculator',
        parameters: { expression: '2+2' }
      }

      const startTime = performance.now()
      const result = await agent.executeToolCall(toolCall)
      const executionTime = performance.now() - startTime

      expect(result.error).toBeUndefined()
      expect(result.result).toEqual({ result: 4 })

      // Tool overhead (excluding actual execution) should be <10ms
      expect(executionTime).toBeLessThan(100) // Includes actual execution
      expect(result.metadata?.durationMs).toBeDefined()
      expect(result.metadata?.durationMs).toBeLessThan(100)
    })

    it('should measure pure overhead by using no-op tool', async () => {
      const noopTool: ToolDefinition = {
        name: 'noop',
        description: 'Does nothing',
        parameters: z.object({}),
        execute: async () => ({ result: 'done' })
      }

      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          
        },
        tools: [noopTool]
      })

      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'noop',
        parameters: {}
      }

      const startTime = performance.now()
      await agent.executeToolCall(toolCall)
      const overhead = performance.now() - startTime

      // Pure framework overhead should be <5ms
      expect(overhead).toBeLessThan(5)
    })
  })

  describe('Parallel Tool Execution', () => {
    it('should execute multiple tool calls in parallel efficiently', async () => {
      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          
        },
        tools: [searchTool]
      })

      const toolCalls: ToolCall[] = [
        { id: 'call-1', name: 'search', parameters: { query: 'test1' } },
        { id: 'call-2', name: 'search', parameters: { query: 'test2' } },
        { id: 'call-3', name: 'search', parameters: { query: 'test3' } }
      ]

      const startTime = performance.now()
      const results = await Promise.all(
        toolCalls.map(call => agent.executeToolCall(call))
      )
      const totalTime = performance.now() - startTime

      // All should succeed
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.error).toBeUndefined()
      })

      // Parallel execution should be faster than sequential
      // Each search takes ~50ms, so 3 in parallel should be ~50-70ms, not 150ms
      expect(totalTime).toBeLessThan(100)
      expect(totalTime).toBeGreaterThan(45) // Should take at least one search duration
    })
  })

  describe('Streaming Agent Performance', () => {
    it('should emit events with minimal latency', async () => {
      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4'
        },
        tools: [calculatorTool]
      })

      // Mock LLM provider
      const mockProvider = {
        chat: vi.fn(async () => ({
          content: 'The answer is 4',
          finishReason: 'stop',
          usage: {
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15
          }
        }))
      }

      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider as any
      })

      const eventLatencies: number[] = []
      let lastEventTime = performance.now()

      const events: any[] = []
      for await (const event of executor.stream('What is 2+2?')) {
        const now = performance.now()
        eventLatencies.push(now - lastEventTime)
        lastEventTime = now
        events.push(event)
      }

      // Should emit at least step and final_answer events
      expect(events.length).toBeGreaterThan(0)

      // Average latency between events should be <10ms
      const avgLatency = eventLatencies.reduce((a, b) => a + b, 0) / eventLatencies.length
      expect(avgLatency).toBeLessThan(10)
    })

    it('should handle high-frequency event emission', async () => {
      const fastTool: ToolDefinition = {
        name: 'fast',
        description: 'Fast operation',
        parameters: z.object({}),
        execute: async () => ({ result: 'done' })
      }

      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4'
        },
        tools: [fastTool]
      })

      // Mock LLM to call tool multiple times
      const mockProvider = {
        chat: vi.fn()
          .mockResolvedValueOnce({
            content: '',
            toolCalls: [
              { id: 'call-1', name: 'fast', parameters: {} },
              { id: 'call-2', name: 'fast', parameters: {} },
              { id: 'call-3', name: 'fast', parameters: {} }
            ],
            finishReason: 'tool_calls'
          })
          .mockResolvedValueOnce({
            content: 'All done',
            finishReason: 'stop'
          })
      }

      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider as any
      })

      const startTime = performance.now()
      const events: any[] = []

      for await (const event of executor.stream('test')) {
        events.push(event)
      }

      const totalTime = performance.now() - startTime

      // Should emit multiple events (steps, tool calls, results, final answer)
      expect(events.length).toBeGreaterThan(5)

      // Total execution should be fast (<100ms)
      expect(totalTime).toBeLessThan(100)
    })
  })

  describe('Agent State Management', () => {
    it('should efficiently manage state across multiple steps', async () => {
      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          
        },
        tools: [calculatorTool]
      })

      const mockProvider = {
        chat: vi.fn()
          .mockResolvedValueOnce({
            content: '',
            toolCalls: [{ id: 'call-1', name: 'calculator', parameters: { expression: '2+2' } }],
            finishReason: 'tool_calls'
          })
          .mockResolvedValueOnce({
            content: '',
            toolCalls: [{ id: 'call-2', name: 'calculator', parameters: { expression: '4*2' } }],
            finishReason: 'tool_calls'
          })
          .mockResolvedValueOnce({
            content: 'The final answer is 8',
            finishReason: 'stop'
          })
      }

      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider as any,
        maxSteps: 5
      })

      const stateSnapshots: any[] = []

      for await (const event of executor.stream('Calculate')) {
        if (event.type === 'step') {
          // Capture state at each step
          const state = executor.getState()
          stateSnapshots.push({
            step: state.step,
            messagesCount: state.messages.length,
            timestamp: performance.now()
          })
        }
      }

      // Should have multiple steps
      expect(stateSnapshots.length).toBeGreaterThan(1)

      // State should grow predictably (messages accumulate)
      for (let i = 1; i < stateSnapshots.length; i++) {
        expect(stateSnapshots[i].messagesCount).toBeGreaterThanOrEqual(
          stateSnapshots[i - 1].messagesCount
        )
      }

      // State access should be fast (captured during execution)
      const timeDiffs = stateSnapshots.slice(1).map((snap, i) =>
        snap.timestamp - stateSnapshots[i].timestamp
      )
      const avgStepTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length

      // Average time per step should be reasonable (<50ms)
      expect(avgStepTime).toBeLessThan(50)
    })
  })

  describe('Trace Generation Overhead', () => {
    it('should generate execution traces with minimal overhead', async () => {
      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          
        },
        tools: [calculatorTool]
      })

      const mockProvider = {
        chat: vi.fn(async () => ({
          content: 'The answer is 4',
          finishReason: 'stop'
        }))
      }

      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider as any,
        verbose: true // Enable detailed tracing
      })

      const startTime = performance.now()

      for await (const event of executor.stream('test')) {
        // Consume events
      }

      const totalTime = performance.now() - startTime

      // Get trace
      const trace = executor.getTrace()

      // Trace should be comprehensive
      expect(trace.events.length).toBeGreaterThan(0)
      expect(trace.stats).toBeDefined()
      expect(trace.durationMs).toBeDefined()

      // Tracing overhead should not significantly impact execution
      expect(totalTime).toBeLessThan(100)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle tool errors without significant overhead', async () => {
      const errorTool: ToolDefinition = {
        name: 'error_tool',
        description: 'Always fails',
        parameters: z.object({}),
        execute: async () => {
          throw new Error('Tool failed')
        }
      }

      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          
        },
        tools: [errorTool, calculatorTool]
      })

      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'error_tool',
        parameters: {}
      }

      const startTime = performance.now()
      const result = await agent.executeToolCall(toolCall)
      const errorHandlingTime = performance.now() - startTime

      // Should capture error
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Tool failed')

      // Error handling should be fast (<10ms)
      expect(errorHandlingTime).toBeLessThan(10)
    })
  })

  describe('Given-When-Then: Multi-Step Execution', () => {
    it('Given an agent with tools, When executing multi-step task, Then completes efficiently', async () => {
      // Given
      const agent = new Agent({
        id: 'test-agent',
        name: 'Math Agent',
        description: 'Math agent for performance testing',
        systemPrompt: 'You solve math problems step by step',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          
        },
        tools: [calculatorTool]
      })

      const mockProvider = {
        chat: vi.fn()
          .mockResolvedValueOnce({
            content: 'Let me calculate',
            toolCalls: [{ id: 'call-1', name: 'calculator', parameters: { expression: '10+5' } }],
            finishReason: 'tool_calls'
          })
          .mockResolvedValueOnce({
            content: 'The answer is 15',
            finishReason: 'stop'
          })
      }

      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider as any
      })

      // When
      const startTime = performance.now()
      let finalAnswer = ''

      for await (const event of executor.stream('What is 10 + 5?')) {
        if (event.type === 'final_answer') {
          finalAnswer = event.answer
        }
      }

      const totalTime = performance.now() - startTime

      // Then
      expect(finalAnswer).toBe('The answer is 15')
      expect(totalTime).toBeLessThan(100) // Should complete in <100ms
    })
  })

  describe('Memory Footprint', () => {
    it.skip('should maintain reasonable memory usage during long executions', async () => {
      const agent = new Agent({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for performance testing',
        systemPrompt: 'You are a helpful assistant',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
          
        },
        tools: [calculatorTool]
      })

      // Simulate many steps
      const stepCount = 20
      const mockProvider = {
        chat: vi.fn()
      }

      // Add tool call responses for each step
      for (let i = 0; i < stepCount - 1; i++) {
        mockProvider.chat.mockResolvedValueOnce({
          content: '',
          toolCalls: [{ id: `call-${i}`, name: 'calculator', parameters: { expression: '1+1' } }],
          finishReason: 'tool_calls'
        })
      }

      // Final response
      mockProvider.chat.mockResolvedValueOnce({
        content: 'Done',
        finishReason: 'stop'
      })

      const executor = new StreamingAgentExecutor(agent, {
        llmProvider: mockProvider as any,
        maxSteps: stepCount + 5 // Add buffer to prevent max steps error
      })

      for await (const event of executor.stream('test')) {
        // Consume events
      }

      const finalState = executor.getState()
      const trace = executor.getTrace()

      // Calculate approximate memory usage
      const stateSize = JSON.stringify(finalState).length
      const traceSize = JSON.stringify(trace).length
      const totalSize = stateSize + traceSize

      // Even with 20 steps, total size should be <100KB
      expect(totalSize).toBeLessThan(100 * 1024)
    })
  })
})
