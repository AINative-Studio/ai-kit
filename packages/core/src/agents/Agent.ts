/**
 * AIKIT Agent - Base Agent Class
 *
 * This module provides the base Agent class with tool registration,
 * validation, and management capabilities.
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  AgentConfig,
  ToolDefinition,
  ToolRegistry,
  ToolCall,
  ToolResult,
  Message,
  AgentError,
  ToolValidationError,
} from './types';

/**
 * Base Agent class that manages tools and provides execution context
 */
export class Agent {
  /**
   * Agent configuration
   */
  public readonly config: AgentConfig;

  /**
   * Tool registry (name -> definition)
   */
  private toolRegistry: ToolRegistry;

  constructor(config: AgentConfig) {
    this.config = config;
    this.toolRegistry = new Map();

    // Register provided tools
    if (config.tools && config.tools.length > 0) {
      config.tools.forEach((tool) => this.registerTool(tool));
    }
  }

  /**
   * Register a tool with the agent
   */
  public registerTool(tool: ToolDefinition): void {
    // Validate tool definition
    this.validateToolDefinition(tool);

    // Check for duplicate tool names
    if (this.toolRegistry.has(tool.name)) {
      throw new AgentError(
        `Tool with name "${tool.name}" is already registered`,
        'DUPLICATE_TOOL_NAME',
        { toolName: tool.name }
      );
    }

    this.toolRegistry.set(tool.name, tool);
  }

  /**
   * Register multiple tools at once
   */
  public registerTools(tools: ToolDefinition[]): void {
    tools.forEach((tool) => this.registerTool(tool));
  }

  /**
   * Unregister a tool by name
   */
  public unregisterTool(toolName: string): boolean {
    return this.toolRegistry.delete(toolName);
  }

  /**
   * Get a tool by name
   */
  public getTool(toolName: string): ToolDefinition | undefined {
    return this.toolRegistry.get(toolName);
  }

  /**
   * Get all registered tools
   */
  public getTools(): ToolDefinition[] {
    return Array.from(this.toolRegistry.values());
  }

  /**
   * Check if a tool is registered
   */
  public hasTool(toolName: string): boolean {
    return this.toolRegistry.has(toolName);
  }

  /**
   * Get tool names for LLM function calling
   */
  public getToolSchemas(): Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }> {
    return this.getTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: this.zodSchemaToJsonSchema(tool.parameters),
    }));
  }

  /**
   * Validate tool call parameters against the tool's schema
   */
  public validateToolCall(toolCall: ToolCall): {
    valid: boolean;
    error?: ToolValidationError;
    validatedParams?: unknown;
  } {
    const tool = this.toolRegistry.get(toolCall.name);

    if (!tool) {
      return {
        valid: false,
        error: new ToolValidationError(
          `Tool "${toolCall.name}" not found`,
          toolCall.name,
          new z.ZodError([
            {
              code: 'custom',
              path: [],
              message: `Tool "${toolCall.name}" not found`,
            },
          ])
        ),
      };
    }

    try {
      const validatedParams = tool.parameters.parse(toolCall.parameters);
      return { valid: true, validatedParams };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          error: new ToolValidationError(
            `Invalid parameters for tool "${toolCall.name}"`,
            toolCall.name,
            error,
            { parameters: toolCall.parameters }
          ),
        };
      }
      throw error;
    }
  }

  /**
   * Execute a single tool call
   */
  public async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.toolRegistry.get(toolCall.name);

    if (!tool) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result: null,
        error: {
          message: `Tool "${toolCall.name}" not found`,
          code: 'TOOL_NOT_FOUND',
        },
        metadata: {
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Validate parameters
    const validation = this.validateToolCall(toolCall);
    if (!validation.valid) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result: null,
        error: {
          message: validation.error!.message,
          code: 'VALIDATION_ERROR',
          stack: validation.error!.stack,
        },
        metadata: {
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Execute with retry logic
    const maxAttempts = tool.retry?.maxAttempts ?? 1;
    const backoffMs = tool.retry?.backoffMs ?? 1000;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Execute with timeout if specified
        const result = tool.timeoutMs
          ? await this.executeWithTimeout(
              () => tool.execute(validation.validatedParams),
              tool.timeoutMs
            )
          : await tool.execute(validation.validatedParams);

        return {
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          result,
          metadata: {
            durationMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            retryCount: attempt,
          },
        };
      } catch (error) {
        lastError = error as Error;

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxAttempts - 1) {
          await this.sleep(backoffMs * (attempt + 1));
        }
      }
    }

    // All attempts failed
    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      result: null,
      error: {
        message: lastError?.message ?? 'Unknown error',
        code: 'EXECUTION_ERROR',
        stack: lastError?.stack,
      },
      metadata: {
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        retryCount: maxAttempts - 1,
      },
    };
  }

  /**
   * Execute multiple tool calls in parallel
   */
  public async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(toolCalls.map((tc) => this.executeToolCall(tc)));
  }

  /**
   * Build initial messages for the agent
   */
  public buildInitialMessages(userMessage: string): Message[] {
    const messages: Message[] = [];

    // Add system prompt
    if (this.config.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.config.systemPrompt,
        timestamp: new Date().toISOString(),
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    return messages;
  }

  /**
   * Get agent metadata for logging/tracing
   */
  public getMetadata(): Record<string, unknown> {
    return {
      id: this.config.id,
      name: this.config.name,
      description: this.config.description,
      llm: {
        provider: this.config.llm.provider,
        model: this.config.llm.model,
      },
      toolCount: this.toolRegistry.size,
      toolNames: Array.from(this.toolRegistry.keys()),
      maxSteps: this.config.maxSteps,
      streaming: this.config.streaming,
      ...this.config.metadata,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validate tool definition structure
   */
  private validateToolDefinition(tool: ToolDefinition): void {
    if (!tool.name || typeof tool.name !== 'string') {
      throw new AgentError(
        'Tool name is required and must be a string',
        'INVALID_TOOL_DEFINITION'
      );
    }

    if (!tool.description || typeof tool.description !== 'string') {
      throw new AgentError(
        'Tool description is required and must be a string',
        'INVALID_TOOL_DEFINITION',
        { toolName: tool.name }
      );
    }

    if (!tool.parameters || !(tool.parameters instanceof z.ZodType)) {
      throw new AgentError(
        'Tool parameters must be a valid Zod schema',
        'INVALID_TOOL_DEFINITION',
        { toolName: tool.name }
      );
    }

    if (!tool.execute || typeof tool.execute !== 'function') {
      throw new AgentError(
        'Tool execute must be a function',
        'INVALID_TOOL_DEFINITION',
        { toolName: tool.name }
      );
    }
  }

  /**
   * Convert Zod schema to JSON schema for LLM function calling
   */
  private zodSchemaToJsonSchema(schema: z.ZodType): Record<string, unknown> {
    try {
      // Use zod-to-json-schema library for complete, accurate conversion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsonSchema = zodToJsonSchema(schema as any, {
        target: 'openApi3',           // OpenAI-compatible format
        $refStrategy: 'none',          // Inline all schemas (no $ref)
        strictUnions: false,           // More permissive union handling
        errorMessages: false,          // Exclude error messages from schema
        markdownDescription: false,    // Use 'description' not 'markdownDescription'
        dateStrategy: 'string',        // Convert dates to ISO strings
        emailStrategy: 'format:email', // Use 'format: email' for z.email()
        base64Strategy: 'contentEncoding:base64', // Base64 handling
      }) as any;

      // Remove $schema property as it's not needed for LLM function calling
      if (jsonSchema.$schema) {
        delete jsonSchema.$schema;
      }

      return jsonSchema as Record<string, unknown>;
    } catch (error) {
      console.warn('Failed to convert Zod schema to JSON schema:', error);
      // Fallback to basic object schema
      return {
        type: 'object',
        properties: {},
        additionalProperties: true
      };
    }
  }


  /**
   * Execute a function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create an agent
 */
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
