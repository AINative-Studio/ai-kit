/**
 * Shared type definitions for agent applications
 */

export interface AgentConfig {
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  maxIterations?: number;
  temperature?: number;
  tools?: string[];
}

export interface ExecutionContext {
  agentId: string;
  sessionId: string;
  userId?: string;
  metadata: Record<string, unknown>;
}

export interface StepResult {
  stepName: string;
  success: boolean;
  output?: unknown;
  error?: Error;
  tokensUsed: number;
  durationMs: number;
}

export interface AgentResult {
  success: boolean;
  output: unknown;
  steps: StepResult[];
  totalTokens: number;
  totalCost: number;
  durationMs: number;
  error?: Error;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}
