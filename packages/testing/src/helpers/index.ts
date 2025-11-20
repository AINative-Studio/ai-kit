/**
 * Test helper functions for AI Kit
 */

export {
  createTestMessage,
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createToolMessage,
  createTestConversation,
} from './testMessages';

export {
  waitForStream,
  mockStreamingResponse,
  collectStreamTokens,
  collectStreamMessages,
} from './streamHelpers';

export {
  simulateNetworkError,
  createFailingFetch,
  createRetryableFetch,
  createSlowFetch,
  createStatusCodeFetch,
  simulateNetworkLatency,
  createFlakyOperation,
} from './networkHelpers';
