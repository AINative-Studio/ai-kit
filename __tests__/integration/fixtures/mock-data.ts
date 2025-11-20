/**
 * Mock Data Fixtures
 *
 * Reusable mock data for integration tests
 */

export const mockMessages = [
  {
    id: 'msg-1',
    role: 'user' as const,
    content: 'Hello, how are you?',
    timestamp: Date.now() - 10000,
  },
  {
    id: 'msg-2',
    role: 'assistant' as const,
    content: "I'm doing well, thank you! How can I help you today?",
    timestamp: Date.now() - 9000,
  },
  {
    id: 'msg-3',
    role: 'user' as const,
    content: 'I need help with my code',
    timestamp: Date.now() - 8000,
  },
  {
    id: 'msg-4',
    role: 'assistant' as const,
    content: "I'd be happy to help! What specific issue are you facing?",
    timestamp: Date.now() - 7000,
  },
];

export const mockConversation = {
  id: 'conv-test',
  title: 'Test Conversation',
  messages: mockMessages,
  createdAt: Date.now() - 10000,
  updatedAt: Date.now(),
  metadata: {
    model: 'gpt-4',
    temperature: 0.7,
  },
};

export const mockTools = [
  {
    name: 'calculator',
    description: 'Performs basic arithmetic operations',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: 'The operation to perform',
        },
        a: {
          type: 'number',
          description: 'First number',
        },
        b: {
          type: 'number',
          description: 'Second number',
        },
      },
      required: ['operation', 'a', 'b'],
    },
    execute: async ({ operation, a, b }: any) => {
      switch (operation) {
        case 'add':
          return a + b;
        case 'subtract':
          return a - b;
        case 'multiply':
          return a * b;
        case 'divide':
          return a / b;
        default:
          throw new Error('Invalid operation');
      }
    },
  },
  {
    name: 'weather',
    description: 'Gets the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA',
        },
      },
      required: ['location'],
    },
    execute: async ({ location }: any) => {
      return {
        location,
        temperature: 72,
        conditions: 'sunny',
        humidity: 45,
      };
    },
  },
  {
    name: 'search',
    description: 'Searches for information on the web',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
    execute: async ({ query }: any) => {
      return {
        query,
        results: [
          {
            title: 'Result 1',
            url: 'https://example.com/1',
            snippet: 'This is the first result',
          },
          {
            title: 'Result 2',
            url: 'https://example.com/2',
            snippet: 'This is the second result',
          },
        ],
      };
    },
  },
];

export const mockAgentConfig = {
  id: 'agent-test',
  name: 'Test Agent',
  description: 'A helpful test agent',
  systemPrompt: 'You are a helpful assistant that provides accurate information.',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  tools: mockTools,
  memory: {
    enabled: true,
    maxItems: 100,
  },
};

export const mockMemoryItems = [
  {
    id: 'mem-1',
    content: 'User prefers TypeScript over JavaScript',
    type: 'preference',
    timestamp: Date.now() - 100000,
    metadata: {
      confidence: 0.95,
    },
  },
  {
    id: 'mem-2',
    content: 'User is working on a React project',
    type: 'context',
    timestamp: Date.now() - 90000,
    metadata: {
      confidence: 0.9,
    },
  },
  {
    id: 'mem-3',
    content: 'User has experience with Node.js',
    type: 'fact',
    timestamp: Date.now() - 80000,
    metadata: {
      confidence: 0.85,
    },
  },
];

export const mockStreamingChunks = [
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":","},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" how"},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" can"},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" I"},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" help"},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"?"},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
  'data: [DONE]\n\n',
];

export const mockToolCall = {
  id: 'call-1',
  type: 'function' as const,
  function: {
    name: 'calculator',
    arguments: JSON.stringify({
      operation: 'add',
      a: 5,
      b: 3,
    }),
  },
};

export const mockToolResponse = {
  role: 'tool' as const,
  content: '8',
  tool_call_id: 'call-1',
};

export const mockStreamingWithTools = [
  'data: {"id":"chatcmpl-2","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}\n\n',
  'data: {"id":"chatcmpl-2","choices":[{"index":0,"delta":{"content":"Let me calculate that for you."},"finish_reason":null}]}\n\n',
  `data: {"id":"chatcmpl-2","choices":[{"index":0,"delta":{"tool_calls":[${JSON.stringify(mockToolCall)}]},"finish_reason":"tool_calls"}]}\n\n`,
  'data: [DONE]\n\n',
];

export const mockUserProfile = {
  id: 'user-test',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    language: 'en',
    theme: 'dark',
    notifications: true,
  },
  createdAt: Date.now() - 1000000,
};

export const mockAnalytics = {
  sessions: 42,
  messages: 156,
  avgResponseTime: 1234,
  avgTokensPerMessage: 245,
  totalTokens: 38220,
  toolUsageCount: {
    calculator: 15,
    weather: 8,
    search: 12,
  },
  errorRate: 0.02,
};

export const mockFeedback = [
  {
    id: 'fb-1',
    messageId: 'msg-2',
    rating: 5,
    comment: 'Very helpful!',
    timestamp: Date.now() - 5000,
  },
  {
    id: 'fb-2',
    messageId: 'msg-4',
    rating: 4,
    comment: 'Good response',
    timestamp: Date.now() - 3000,
  },
];

export const mockAgentSwarm = [
  {
    id: 'agent-1',
    name: 'Research Agent',
    role: 'researcher',
    capabilities: ['search', 'analysis'],
  },
  {
    id: 'agent-2',
    name: 'Writer Agent',
    role: 'writer',
    capabilities: ['writing', 'editing'],
  },
  {
    id: 'agent-3',
    name: 'Review Agent',
    role: 'reviewer',
    capabilities: ['review', 'critique'],
  },
];

export const mockWorkflow = {
  id: 'workflow-test',
  name: 'Content Creation Workflow',
  steps: [
    {
      id: 'step-1',
      agentId: 'agent-1',
      action: 'research',
      input: 'Topic to research',
    },
    {
      id: 'step-2',
      agentId: 'agent-2',
      action: 'write',
      input: 'Research results',
      dependsOn: ['step-1'],
    },
    {
      id: 'step-3',
      agentId: 'agent-3',
      action: 'review',
      input: 'Written content',
      dependsOn: ['step-2'],
    },
  ],
};

export const mockAPIResponse = {
  success: true,
  data: {
    message: 'Operation completed successfully',
    timestamp: Date.now(),
  },
};

export const mockErrorResponse = {
  success: false,
  error: {
    code: 'INVALID_REQUEST',
    message: 'The request was invalid',
    details: {
      field: 'input',
      issue: 'Required field missing',
    },
  },
};

export const mockRLHFData = {
  prompt: 'What is the capital of France?',
  response: 'The capital of France is Paris.',
  feedback: {
    rating: 5,
    helpful: true,
    accurate: true,
    wellFormatted: true,
  },
  metadata: {
    model: 'gpt-4',
    tokens: 25,
    latency: 845,
  },
};
