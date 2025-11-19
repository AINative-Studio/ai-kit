/**
 * AIKIT Agent Orchestration System
 *
 * Main entry point for the agent system
 */

// Core types
export * from './types';

// Agent classes
export { Agent, createAgent } from './Agent';
export { AgentExecutor, executeAgent } from './AgentExecutor';
export type { ExecutionConfig, ExecutionResult } from './AgentExecutor';

// Streaming execution
export {
  StreamingAgentExecutor,
  streamAgentExecution,
} from './StreamingAgentExecutor';
export type {
  StreamingExecutionConfig,
  StreamingExecutionResult,
} from './StreamingAgentExecutor';

// LLM providers
export { LLMProvider } from './llm/LLMProvider';
export type { ChatRequest, ChatResponse } from './llm/LLMProvider';
export { OpenAIProvider } from './llm/OpenAIProvider';
export type { OpenAIConfig } from './llm/OpenAIProvider';
export { AnthropicProvider } from './llm/AnthropicProvider';
export type { AnthropicConfig } from './llm/AnthropicProvider';
