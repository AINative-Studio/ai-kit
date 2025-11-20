/**
 * Type tests for AI Kit
 * Comprehensive type safety tests using TypeScript's type system
 */

import { describe, it, expectTypeOf } from 'vitest';
import type {
  // Utility types
  Brand,
  UserId,
  SessionId,
  MessageId,
  AgentId,
  ModelId,
  ToolId,
  DeepPartial,
  DeepReadonly,
  RequireAtLeastOne,
  RequireExactlyOne,
  Result,
  Success,
  Failure,
  Option,
  Some,
  None,
  JsonValue,
  Nullable,
  Maybe,
  // Streaming types
  Message,
  MessageRole,
  StreamEvent,
  StreamConfig,
  StreamResult,
  StreamState,
  UsageStats,
  // Agent types
  AgentConfig,
  AgentAction,
  Task,
  TaskResult,
  AgentMessage,
  // Tool types
  ToolConfig,
  ToolCall,
  ToolCallResult,
  ToolError,
  Tool,
  // Model types
  ModelConfig,
  ModelProvider,
  CompletionResponse,
  EmbeddingResponse,
  // Error types
  AIKitError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
  ErrorCategory,
  // Config types
  AIKitConfig,
  Environment,
  LogLevel,
} from '../../src/types';

describe('Type Tests', () => {
  describe('Branded Types', () => {
    it('should create type-safe branded IDs', () => {
      const userId: UserId = 'user-123' as UserId;
      const sessionId: SessionId = 'session-456' as SessionId;
      const messageId: MessageId = 'msg-789' as MessageId;

      expectTypeOf(userId).toEqualTypeOf<UserId>();
      expectTypeOf(sessionId).toEqualTypeOf<SessionId>();
      expectTypeOf(messageId).toEqualTypeOf<MessageId>();

      // Different branded types should not be assignable to each other
      // @ts-expect-error - UserId is not assignable to SessionId
      const wrongAssignment: SessionId = userId;
    });

    it('should prevent mixing of similar branded types', () => {
      const agentId: AgentId = 'agent-1' as AgentId;
      const toolId: ToolId = 'tool-1' as ToolId;
      const modelId: ModelId = 'model-1' as ModelId;

      expectTypeOf(agentId).not.toEqualTypeOf<ToolId>();
      expectTypeOf(toolId).not.toEqualTypeOf<ModelId>();
      expectTypeOf(modelId).not.toEqualTypeOf<AgentId>();
    });
  });

  describe('Utility Types', () => {
    it('should create deep partial types', () => {
      interface Nested {
        level1: {
          level2: {
            value: string;
          };
        };
      }

      type PartialNested = DeepPartial<Nested>;

      const partial: PartialNested = {
        level1: {
          level2: {},
        },
      };

      expectTypeOf(partial).toMatchTypeOf<PartialNested>();
    });

    it('should create deep readonly types', () => {
      interface Mutable {
        name: string;
        nested: {
          value: number;
        };
      }

      type ReadonlyMutable = DeepReadonly<Mutable>;

      const readonly: ReadonlyMutable = {
        name: 'test',
        nested: { value: 42 },
      };

      expectTypeOf(readonly).toMatchTypeOf<ReadonlyMutable>();
      expectTypeOf(readonly.name).toEqualTypeOf<string>();
      expectTypeOf(readonly.nested.value).toEqualTypeOf<number>();
    });

    it('should require at least one property', () => {
      interface Options {
        a?: string;
        b?: number;
        c?: boolean;
      }

      type RequiredOptions = RequireAtLeastOne<Options, 'a' | 'b'>;

      // Valid: has 'a'
      const valid1: RequiredOptions = { a: 'test' };
      // Valid: has 'b'
      const valid2: RequiredOptions = { b: 42 };
      // Valid: has both
      const valid3: RequiredOptions = { a: 'test', b: 42 };

      expectTypeOf(valid1).toMatchTypeOf<RequiredOptions>();
      expectTypeOf(valid2).toMatchTypeOf<RequiredOptions>();
      expectTypeOf(valid3).toMatchTypeOf<RequiredOptions>();

      // @ts-expect-error - Neither 'a' nor 'b' is present
      const invalid: RequiredOptions = { c: true };
    });

    it('should require exactly one property', () => {
      interface Options {
        a?: string;
        b?: number;
      }

      type ExactlyOne = RequireExactlyOne<Options, 'a' | 'b'>;

      // Valid: has only 'a'
      const valid1: ExactlyOne = { a: 'test' };
      // Valid: has only 'b'
      const valid2: ExactlyOne = { b: 42 };

      expectTypeOf(valid1).toMatchTypeOf<ExactlyOne>();
      expectTypeOf(valid2).toMatchTypeOf<ExactlyOne>();

      // @ts-expect-error - Has both 'a' and 'b'
      const invalid: ExactlyOne = { a: 'test', b: 42 };
    });
  });

  describe('Result Type', () => {
    it('should create success results', () => {
      const success: Success<string> = {
        success: true,
        data: 'result',
      };

      expectTypeOf(success).toMatchTypeOf<Success<string>>();
      expectTypeOf(success.success).toEqualTypeOf<true>();
      expectTypeOf(success.data).toEqualTypeOf<string>();
    });

    it('should create failure results', () => {
      const failure: Failure<Error> = {
        success: false,
        error: new Error('Failed'),
      };

      expectTypeOf(failure).toMatchTypeOf<Failure<Error>>();
      expectTypeOf(failure.success).toEqualTypeOf<false>();
      expectTypeOf(failure.error).toEqualTypeOf<Error>();
    });

    it('should handle Result union type', () => {
      const result: Result<string, Error> = {
        success: true,
        data: 'test',
      };

      expectTypeOf(result).toMatchTypeOf<Result<string, Error>>();

      if (result.success) {
        expectTypeOf(result.data).toEqualTypeOf<string>();
      } else {
        expectTypeOf(result.error).toEqualTypeOf<Error>();
      }
    });
  });

  describe('Option Type', () => {
    it('should create Some option', () => {
      const some: Some<number> = {
        kind: 'some',
        value: 42,
      };

      expectTypeOf(some).toMatchTypeOf<Some<number>>();
      expectTypeOf(some.kind).toEqualTypeOf<'some'>();
      expectTypeOf(some.value).toEqualTypeOf<number>();
    });

    it('should create None option', () => {
      const none: None = {
        kind: 'none',
      };

      expectTypeOf(none).toMatchTypeOf<None>();
      expectTypeOf(none.kind).toEqualTypeOf<'none'>();
    });

    it('should handle Option union type', () => {
      const option: Option<string> = {
        kind: 'some',
        value: 'test',
      };

      expectTypeOf(option).toMatchTypeOf<Option<string>>();

      if (option.kind === 'some') {
        expectTypeOf(option.value).toEqualTypeOf<string>();
      }
    });
  });

  describe('JSON Types', () => {
    it('should validate JSON primitive types', () => {
      const str: JsonValue = 'string';
      const num: JsonValue = 42;
      const bool: JsonValue = true;
      const nil: JsonValue = null;

      expectTypeOf(str).toMatchTypeOf<JsonValue>();
      expectTypeOf(num).toMatchTypeOf<JsonValue>();
      expectTypeOf(bool).toMatchTypeOf<JsonValue>();
      expectTypeOf(nil).toMatchTypeOf<JsonValue>();
    });

    it('should validate JSON object types', () => {
      const obj: JsonValue = {
        name: 'test',
        count: 42,
        active: true,
        nested: {
          value: 'nested',
        },
      };

      expectTypeOf(obj).toMatchTypeOf<JsonValue>();
    });

    it('should validate JSON array types', () => {
      const arr: JsonValue = [1, 'two', true, null, { key: 'value' }];

      expectTypeOf(arr).toMatchTypeOf<JsonValue>();
    });

    it('should reject non-JSON types', () => {
      // @ts-expect-error - Function is not JSON-serializable
      const fn: JsonValue = () => {};

      // @ts-expect-error - undefined is not a valid JsonValue
      const undef: JsonValue = undefined;

      // @ts-expect-error - Symbol is not JSON-serializable
      const sym: JsonValue = Symbol('test');
    });
  });

  describe('Nullable and Maybe Types', () => {
    it('should handle nullable types', () => {
      const nullable: Nullable<string> = null;
      const withValue: Nullable<string> = 'value';

      expectTypeOf(nullable).toMatchTypeOf<Nullable<string>>();
      expectTypeOf(withValue).toMatchTypeOf<Nullable<string>>();
    });

    it('should handle maybe types', () => {
      const maybeNull: Maybe<number> = null;
      const maybeUndefined: Maybe<number> = undefined;
      const maybeValue: Maybe<number> = 42;

      expectTypeOf(maybeNull).toMatchTypeOf<Maybe<number>>();
      expectTypeOf(maybeUndefined).toMatchTypeOf<Maybe<number>>();
      expectTypeOf(maybeValue).toMatchTypeOf<Maybe<number>>();
    });
  });

  describe('Message Types', () => {
    it('should validate message structure', () => {
      const message: Message = {
        id: 'msg-1' as MessageId,
        role: 'user',
        content: 'Hello',
        timestamp: Date.now() as number,
      };

      expectTypeOf(message).toMatchTypeOf<Message>();
      expectTypeOf(message.role).toEqualTypeOf<MessageRole>();
    });

    it('should validate message roles', () => {
      const userRole: MessageRole = 'user';
      const assistantRole: MessageRole = 'assistant';
      const systemRole: MessageRole = 'system';

      expectTypeOf(userRole).toEqualTypeOf<MessageRole>();
      expectTypeOf(assistantRole).toEqualTypeOf<MessageRole>();
      expectTypeOf(systemRole).toEqualTypeOf<MessageRole>();

      // @ts-expect-error - Invalid role
      const invalidRole: MessageRole = 'invalid';
    });

    it('should allow optional message fields', () => {
      const messageWithMetadata: Message = {
        id: 'msg-1' as MessageId,
        role: 'assistant',
        content: 'Response',
        timestamp: Date.now() as number,
        metadata: {
          model: 'gpt-4',
          tokens: 100,
        },
      };

      expectTypeOf(messageWithMetadata).toMatchTypeOf<Message>();
      expectTypeOf(messageWithMetadata.metadata).toEqualTypeOf<
        Record<string, JsonValue> | undefined
      >();
    });
  });

  describe('Stream Types', () => {
    it('should validate stream configuration', () => {
      const config: StreamConfig = {
        endpoint: 'https://api.example.com',
        model: 'gpt-4' as ModelId,
        temperature: 0.7,
        maxTokens: 1000,
      };

      expectTypeOf(config).toMatchTypeOf<StreamConfig>();
      expectTypeOf(config.endpoint).toEqualTypeOf<string>();
      expectTypeOf(config.temperature).toEqualTypeOf<number | undefined>();
    });

    it('should validate stream state', () => {
      const state: StreamState = 'streaming';

      expectTypeOf(state).toEqualTypeOf<StreamState>();

      // @ts-expect-error - Invalid state
      const invalidState: StreamState = 'invalid';
    });

    it('should validate usage stats', () => {
      const usage: UsageStats = {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      };

      expectTypeOf(usage).toMatchTypeOf<UsageStats>();
      expectTypeOf(usage.promptTokens).toEqualTypeOf<number>();
    });

    it('should validate stream events', () => {
      const tokenEvent: StreamEvent = {
        type: 'token',
        timestamp: Date.now() as number,
        token: 'hello',
        messageId: 'msg-1' as MessageId,
      };

      expectTypeOf(tokenEvent).toMatchTypeOf<StreamEvent>();
    });
  });

  describe('Agent Types', () => {
    it('should validate agent configuration', () => {
      const config: AgentConfig = {
        name: 'Test Agent',
        role: 'assistant',
        systemPrompt: 'You are a helpful assistant',
      };

      expectTypeOf(config).toMatchTypeOf<AgentConfig>();
      expectTypeOf(config.name).toEqualTypeOf<string>();
    });

    it('should validate agent actions', () => {
      const action: AgentAction = {
        id: 'action-1',
        agentId: 'agent-1' as AgentId,
        type: 'message',
        timestamp: Date.now() as number,
        success: true,
      };

      expectTypeOf(action).toMatchTypeOf<AgentAction>();
    });

    it('should validate task structure', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Complete task',
        description: 'Task description',
        priority: 'high',
        status: 'pending',
      };

      expectTypeOf(task).toMatchTypeOf<Task>();
      expectTypeOf(task.priority).toEqualTypeOf<'low' | 'medium' | 'high' | 'critical'>();
    });

    it('should validate task result', () => {
      const result: TaskResult = {
        success: true,
        output: { result: 'completed' },
      };

      expectTypeOf(result).toMatchTypeOf<TaskResult>();
    });

    it('should validate agent messages', () => {
      const message: AgentMessage = {
        id: 'msg-1' as MessageId,
        from: 'agent-1' as AgentId,
        to: 'agent-2' as AgentId,
        type: 'request',
        content: 'Please help',
        timestamp: Date.now() as number,
      };

      expectTypeOf(message).toMatchTypeOf<AgentMessage>();
    });
  });

  describe('Tool Types', () => {
    it('should validate tool configuration', () => {
      const config: ToolConfig = {
        id: 'tool-1' as ToolId,
        name: 'Calculator',
        description: 'Perform calculations',
        category: 'computation',
        parameters: [],
        returns: {
          type: 'number',
          description: 'Calculation result',
        },
      };

      expectTypeOf(config).toMatchTypeOf<ToolConfig>();
    });

    it('should validate tool call', () => {
      const call: ToolCall = {
        id: 'call-1',
        toolId: 'tool-1' as ToolId,
        toolName: 'Calculator',
        input: { operation: 'add', a: 1, b: 2 },
        timestamp: Date.now(),
      };

      expectTypeOf(call).toMatchTypeOf<ToolCall>();
    });

    it('should validate tool call result', () => {
      const result: ToolCallResult = {
        callId: 'call-1',
        success: true,
        output: 3,
        duration: 100,
        timestamp: Date.now(),
      };

      expectTypeOf(result).toMatchTypeOf<ToolCallResult>();
    });

    it('should validate tool error', () => {
      const error: ToolError = {
        code: 'INVALID_INPUT',
        message: 'Invalid input provided',
        recoverable: true,
      };

      expectTypeOf(error).toMatchTypeOf<ToolError>();
    });
  });

  describe('Model Types', () => {
    it('should validate model configuration', () => {
      const config: ModelConfig = {
        id: 'gpt-4' as ModelId,
        name: 'GPT-4',
        provider: 'openai',
        category: 'chat',
        capabilities: ['chat', 'streaming', 'function-calling'],
        contextWindow: 8192,
        maxOutputTokens: 4096,
      };

      expectTypeOf(config).toMatchTypeOf<ModelConfig>();
    });

    it('should validate model providers', () => {
      const provider: ModelProvider = 'openai';

      expectTypeOf(provider).toEqualTypeOf<ModelProvider>();

      // @ts-expect-error - Invalid provider
      const invalidProvider: ModelProvider = 'invalid';
    });

    it('should validate completion response', () => {
      const response: CompletionResponse = {
        id: 'cmpl-1',
        model: 'gpt-4' as ModelId,
        choices: [
          {
            index: 0,
            text: 'Response text',
            finishReason: 'stop',
          },
        ],
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        created: Date.now(),
      };

      expectTypeOf(response).toMatchTypeOf<CompletionResponse>();
    });

    it('should validate embedding response', () => {
      const response: EmbeddingResponse = {
        model: 'text-embedding-ada-002' as ModelId,
        embeddings: [
          {
            index: 0,
            embedding: [0.1, 0.2, 0.3],
            object: 'embedding',
          },
        ],
        usage: {
          promptTokens: 10,
          completionTokens: 0,
          totalTokens: 10,
        },
      };

      expectTypeOf(response).toMatchTypeOf<EmbeddingResponse>();
    });
  });

  describe('Error Types', () => {
    it('should validate base error structure', () => {
      const error: AIKitError = {
        name: 'AIKitError',
        message: 'An error occurred',
        code: 'ERROR_CODE' as any,
        category: 'internal',
        severity: 'medium',
        recoverable: true,
        timestamp: Date.now(),
      };

      expectTypeOf(error).toMatchTypeOf<AIKitError>();
    });

    it('should validate error categories', () => {
      const category: ErrorCategory = 'validation';

      expectTypeOf(category).toEqualTypeOf<ErrorCategory>();

      // @ts-expect-error - Invalid category
      const invalidCategory: ErrorCategory = 'invalid';
    });

    it('should validate validation error', () => {
      const error: ValidationError = {
        name: 'ValidationError',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR' as any,
        category: 'validation',
        severity: 'medium',
        recoverable: true,
        timestamp: Date.now(),
        field: 'email',
        expected: 'valid email',
        received: 'invalid',
      };

      expectTypeOf(error).toMatchTypeOf<ValidationError>();
    });

    it('should validate authentication error', () => {
      const error: AuthenticationError = {
        name: 'AuthenticationError',
        message: 'Authentication failed',
        code: 'AUTH_ERROR' as any,
        category: 'authentication',
        severity: 'high',
        recoverable: false,
        timestamp: Date.now(),
        authMethod: 'api-key',
      };

      expectTypeOf(error).toMatchTypeOf<AuthenticationError>();
    });

    it('should validate rate limit error', () => {
      const error: RateLimitError = {
        name: 'RateLimitError',
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT' as any,
        category: 'rate-limit',
        severity: 'medium',
        recoverable: true,
        timestamp: Date.now(),
        limit: 100,
        remaining: 0,
        resetAt: Date.now() + 3600000,
        retryAfter: 3600000,
        scope: 'user',
      };

      expectTypeOf(error).toMatchTypeOf<RateLimitError>();
    });
  });

  describe('Configuration Types', () => {
    it('should validate AIKit configuration', () => {
      const config: AIKitConfig = {
        environment: 'production',
        version: '1.0.0',
      };

      expectTypeOf(config).toMatchTypeOf<AIKitConfig>();
    });

    it('should validate environment types', () => {
      const env: Environment = 'production';

      expectTypeOf(env).toEqualTypeOf<Environment>();

      // @ts-expect-error - Invalid environment
      const invalidEnv: Environment = 'invalid';
    });

    it('should validate log levels', () => {
      const level: LogLevel = 'info';

      expectTypeOf(level).toEqualTypeOf<LogLevel>();

      // @ts-expect-error - Invalid log level
      const invalidLevel: LogLevel = 'invalid';
    });
  });

  describe('Type Inference', () => {
    it('should infer generic constraints correctly', () => {
      function processResult<T>(result: Result<T, Error>): T | null {
        if (result.success) {
          return result.data;
        }
        return null;
      }

      const stringResult = processResult({ success: true, data: 'test' });
      const numberResult = processResult({ success: true, data: 42 });

      expectTypeOf(stringResult).toEqualTypeOf<string | null>();
      expectTypeOf(numberResult).toEqualTypeOf<number | null>();
    });

    it('should infer discriminated unions correctly', () => {
      type Shape =
        | { kind: 'circle'; radius: number }
        | { kind: 'rectangle'; width: number; height: number };

      function getArea(shape: Shape): number {
        if (shape.kind === 'circle') {
          expectTypeOf(shape.radius).toEqualTypeOf<number>();
          return Math.PI * shape.radius ** 2;
        } else {
          expectTypeOf(shape.width).toEqualTypeOf<number>();
          expectTypeOf(shape.height).toEqualTypeOf<number>();
          return shape.width * shape.height;
        }
      }

      const circle: Shape = { kind: 'circle', radius: 10 };
      const rectangle: Shape = { kind: 'rectangle', width: 20, height: 30 };

      expectTypeOf(getArea(circle)).toEqualTypeOf<number>();
      expectTypeOf(getArea(rectangle)).toEqualTypeOf<number>();
    });
  });

  describe('Readonly and Immutability', () => {
    it('should enforce readonly arrays', () => {
      const messages: readonly Message[] = [];

      expectTypeOf(messages).toEqualTypeOf<readonly Message[]>();

      // @ts-expect-error - Cannot push to readonly array
      messages.push({
        id: 'msg-1' as MessageId,
        role: 'user',
        content: 'test',
        timestamp: Date.now() as number,
      });
    });

    it('should enforce readonly objects', () => {
      const config: Readonly<StreamConfig> = {
        endpoint: 'https://api.example.com',
      };

      expectTypeOf(config).toMatchTypeOf<Readonly<StreamConfig>>();

      // @ts-expect-error - Cannot assign to readonly property
      config.endpoint = 'https://new-api.example.com';
    });
  });
});
