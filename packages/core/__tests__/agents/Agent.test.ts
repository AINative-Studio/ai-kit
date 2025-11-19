/**
 * Tests for Agent class
 */

import { z } from 'zod';
import { Agent, createAgent } from '../../src/agents/Agent';
import { AgentConfig, ToolDefinition, AgentError } from '../../src/agents/types';

describe('Agent', () => {
  let basicConfig: AgentConfig;

  beforeEach(() => {
    basicConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'A test agent',
      systemPrompt: 'You are a helpful assistant.',
      llm: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
      },
      tools: [],
    };
  });

  describe('Constructor', () => {
    it('should create an agent with valid config', () => {
      const agent = new Agent(basicConfig);
      expect(agent).toBeInstanceOf(Agent);
      expect(agent.config).toEqual(basicConfig);
    });

    it('should register tools from config', () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'A test tool',
        parameters: z.object({
          input: z.string(),
        }),
        execute: async (params) => ({ result: params.input }),
      };

      const configWithTools = {
        ...basicConfig,
        tools: [tool],
      };

      const agent = new Agent(configWithTools);
      expect(agent.hasTool('test_tool')).toBe(true);
    });
  });

  describe('Tool Registration', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = new Agent(basicConfig);
    });

    it('should register a valid tool', () => {
      const tool: ToolDefinition = {
        name: 'calculator',
        description: 'Performs calculations',
        parameters: z.object({
          operation: z.enum(['add', 'subtract']),
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ operation, a, b }) => {
          if (operation === 'add') return a + b;
          return a - b;
        },
      };

      agent.registerTool(tool);
      expect(agent.hasTool('calculator')).toBe(true);
      expect(agent.getTool('calculator')).toBe(tool);
    });

    it('should throw error for duplicate tool names', () => {
      const tool: ToolDefinition = {
        name: 'duplicate',
        description: 'Test',
        parameters: z.object({}),
        execute: async () => ({}),
      };

      agent.registerTool(tool);

      expect(() => agent.registerTool(tool)).toThrow(AgentError);
      expect(() => agent.registerTool(tool)).toThrow(/already registered/);
    });

    it('should register multiple tools', () => {
      const tools: ToolDefinition[] = [
        {
          name: 'tool1',
          description: 'First tool',
          parameters: z.object({}),
          execute: async () => ({}),
        },
        {
          name: 'tool2',
          description: 'Second tool',
          parameters: z.object({}),
          execute: async () => ({}),
        },
      ];

      agent.registerTools(tools);
      expect(agent.getTools()).toHaveLength(2);
      expect(agent.hasTool('tool1')).toBe(true);
      expect(agent.hasTool('tool2')).toBe(true);
    });

    it('should unregister a tool', () => {
      const tool: ToolDefinition = {
        name: 'temp_tool',
        description: 'Temporary tool',
        parameters: z.object({}),
        execute: async () => ({}),
      };

      agent.registerTool(tool);
      expect(agent.hasTool('temp_tool')).toBe(true);

      const removed = agent.unregisterTool('temp_tool');
      expect(removed).toBe(true);
      expect(agent.hasTool('temp_tool')).toBe(false);
    });

    it('should validate tool definition - missing name', () => {
      const invalidTool: any = {
        description: 'Test',
        parameters: z.object({}),
        execute: async () => ({}),
      };

      expect(() => agent.registerTool(invalidTool)).toThrow(AgentError);
      expect(() => agent.registerTool(invalidTool)).toThrow(/name is required/);
    });

    it('should validate tool definition - missing description', () => {
      const invalidTool: any = {
        name: 'test',
        parameters: z.object({}),
        execute: async () => ({}),
      };

      expect(() => agent.registerTool(invalidTool)).toThrow(AgentError);
      expect(() => agent.registerTool(invalidTool)).toThrow(/description is required/);
    });

    it('should validate tool definition - invalid parameters', () => {
      const invalidTool: any = {
        name: 'test',
        description: 'Test',
        parameters: { not: 'a zod schema' },
        execute: async () => ({}),
      };

      expect(() => agent.registerTool(invalidTool)).toThrow(AgentError);
      expect(() => agent.registerTool(invalidTool)).toThrow(/Zod schema/);
    });

    it('should validate tool definition - missing execute', () => {
      const invalidTool: any = {
        name: 'test',
        description: 'Test',
        parameters: z.object({}),
      };

      expect(() => agent.registerTool(invalidTool)).toThrow(AgentError);
      expect(() => agent.registerTool(invalidTool)).toThrow(/execute must be a function/);
    });
  });

  describe('Tool Validation', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = new Agent(basicConfig);

      const tool: ToolDefinition = {
        name: 'greet',
        description: 'Greets a person',
        parameters: z.object({
          name: z.string(),
          age: z.number().optional(),
        }),
        execute: async ({ name, age }) => ({
          message: `Hello, ${name}${age ? ` (age ${age})` : ''}`,
        }),
      };

      agent.registerTool(tool);
    });

    it('should validate valid tool call parameters', () => {
      const toolCall = {
        id: 'call-123',
        name: 'greet',
        parameters: {
          name: 'Alice',
          age: 30,
        },
      };

      const result = agent.validateToolCall(toolCall);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.validatedParams).toEqual({
        name: 'Alice',
        age: 30,
      });
    });

    it('should validate tool call with optional parameters', () => {
      const toolCall = {
        id: 'call-123',
        name: 'greet',
        parameters: {
          name: 'Bob',
        },
      };

      const result = agent.validateToolCall(toolCall);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid tool call parameters', () => {
      const toolCall = {
        id: 'call-123',
        name: 'greet',
        parameters: {
          name: 123, // Should be string
        },
      };

      const result = agent.validateToolCall(toolCall);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject tool call for non-existent tool', () => {
      const toolCall = {
        id: 'call-123',
        name: 'nonexistent',
        parameters: {},
      };

      const result = agent.validateToolCall(toolCall);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('not found');
    });
  });

  describe('Tool Execution', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = new Agent(basicConfig);
    });

    it('should execute a tool successfully', async () => {
      const tool: ToolDefinition = {
        name: 'add',
        description: 'Adds two numbers',
        parameters: z.object({
          a: z.number(),
          b: z.number(),
        }),
        execute: async ({ a, b }) => ({ sum: a + b }),
      };

      agent.registerTool(tool);

      const toolCall = {
        id: 'call-123',
        name: 'add',
        parameters: { a: 5, b: 3 },
      };

      const result = await agent.executeToolCall(toolCall);

      expect(result.toolCallId).toBe('call-123');
      expect(result.toolName).toBe('add');
      expect(result.result).toEqual({ sum: 8 });
      expect(result.error).toBeUndefined();
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle tool execution errors', async () => {
      const tool: ToolDefinition = {
        name: 'error_tool',
        description: 'Always throws an error',
        parameters: z.object({}),
        execute: async () => {
          throw new Error('Tool execution failed');
        },
      };

      agent.registerTool(tool);

      const toolCall = {
        id: 'call-123',
        name: 'error_tool',
        parameters: {},
      };

      const result = await agent.executeToolCall(toolCall);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Tool execution failed');
    });

    it('should retry failed tool executions', async () => {
      let attempts = 0;

      const tool: ToolDefinition = {
        name: 'flaky_tool',
        description: 'Fails twice then succeeds',
        parameters: z.object({}),
        execute: async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return { success: true };
        },
        retry: {
          maxAttempts: 3,
          backoffMs: 10,
        },
      };

      agent.registerTool(tool);

      const toolCall = {
        id: 'call-123',
        name: 'flaky_tool',
        parameters: {},
      };

      const result = await agent.executeToolCall(toolCall);

      expect(attempts).toBe(3);
      expect(result.error).toBeUndefined();
      expect(result.result).toEqual({ success: true });
      expect(result.metadata.retryCount).toBe(2);
    });

    it('should handle tool timeout', async () => {
      const tool: ToolDefinition = {
        name: 'slow_tool',
        description: 'Takes too long',
        parameters: z.object({}),
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return { done: true };
        },
        timeoutMs: 100,
      };

      agent.registerTool(tool);

      const toolCall = {
        id: 'call-123',
        name: 'slow_tool',
        parameters: {},
      };

      const result = await agent.executeToolCall(toolCall);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Timeout');
    });

    it('should execute multiple tools in parallel', async () => {
      const tool1: ToolDefinition = {
        name: 'tool1',
        description: 'First tool',
        parameters: z.object({ value: z.number() }),
        execute: async ({ value }) => ({ result: value * 2 }),
      };

      const tool2: ToolDefinition = {
        name: 'tool2',
        description: 'Second tool',
        parameters: z.object({ value: z.number() }),
        execute: async ({ value }) => ({ result: value + 10 }),
      };

      agent.registerTools([tool1, tool2]);

      const toolCalls = [
        { id: 'call-1', name: 'tool1', parameters: { value: 5 } },
        { id: 'call-2', name: 'tool2', parameters: { value: 3 } },
      ];

      const startTime = Date.now();
      const results = await agent.executeToolCalls(toolCalls);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(2);
      expect(results[0].result).toEqual({ result: 10 });
      expect(results[1].result).toEqual({ result: 13 });

      // Verify parallel execution (should be fast)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Tool Schemas', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = new Agent(basicConfig);
    });

    it('should generate tool schemas for LLM', () => {
      const tool: ToolDefinition = {
        name: 'weather',
        description: 'Gets weather information',
        parameters: z.object({
          city: z.string(),
          units: z.enum(['celsius', 'fahrenheit']).optional(),
        }),
        execute: async () => ({}),
      };

      agent.registerTool(tool);

      const schemas = agent.getToolSchemas();

      expect(schemas).toHaveLength(1);
      expect(schemas[0]).toMatchObject({
        name: 'weather',
        description: 'Gets weather information',
        parameters: {
          type: 'object',
          properties: expect.any(Object),
        },
      });
    });
  });

  describe('Message Building', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = new Agent(basicConfig);
    });

    it('should build initial messages with system prompt', () => {
      const messages = agent.buildInitialMessages('Hello!');

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toBe('You are a helpful assistant.');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('Hello!');
    });

    it('should build messages without system prompt if not provided', () => {
      const configNoSystem = { ...basicConfig, systemPrompt: '' };
      const agentNoSystem = new Agent(configNoSystem);

      const messages = agentNoSystem.buildInitialMessages('Hi there!');

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hi there!');
    });
  });

  describe('Metadata', () => {
    it('should return agent metadata', () => {
      const agent = new Agent(basicConfig);

      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'Test',
        parameters: z.object({}),
        execute: async () => ({}),
      };

      agent.registerTool(tool);

      const metadata = agent.getMetadata();

      expect(metadata).toMatchObject({
        id: 'test-agent',
        name: 'Test Agent',
        description: 'A test agent',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
        toolCount: 1,
        toolNames: ['test_tool'],
      });
    });
  });

  describe('Factory Function', () => {
    it('should create agent using factory function', () => {
      const agent = createAgent(basicConfig);
      expect(agent).toBeInstanceOf(Agent);
      expect(agent.config).toEqual(basicConfig);
    });
  });
});
