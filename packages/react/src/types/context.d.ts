/**
 * React context type definitions for AI Kit
 * Comprehensive types for React context providers and consumers
 */

import type { ReactNode } from 'react';
import type {
  ModelId,
  AgentId,
  SessionId,
  ToolId,
  JsonValue,
  StreamConfig,
} from '@ainative/ai-kit-core';

// ============================================================================
// AIKit Context
// ============================================================================

/**
 * AIKit context value
 */
export interface AIKitContextValue {
  readonly config: AIKitConfig;
  readonly models: ModelsRegistry;
  readonly tools: ToolsRegistry;
  readonly agents: AgentsRegistry;
  readonly theme: ThemeContextValue;
  readonly updateConfig: (config: Partial<AIKitConfig>) => void;
}

/**
 * AIKit configuration
 */
export interface AIKitConfig {
  readonly apiKey?: string;
  readonly endpoint?: string;
  readonly defaultModel?: ModelId;
  readonly streaming?: boolean;
  readonly caching?: boolean;
  readonly debug?: boolean;
  readonly [key: string]: JsonValue | undefined;
}

// ============================================================================
// Models Context
// ============================================================================

/**
 * Models registry
 */
export interface ModelsRegistry {
  readonly available: readonly ModelId[];
  readonly default?: ModelId;
  readonly current?: ModelId;
  setModel: (modelId: ModelId) => void;
  getModel: (modelId: ModelId) => ModelInfo | undefined;
}

/**
 * Model information
 */
export interface ModelInfo {
  readonly id: ModelId;
  readonly name: string;
  readonly provider: string;
  readonly category: string;
  readonly contextWindow: number;
  readonly cost?: CostInfo;
}

/**
 * Cost information
 */
export interface CostInfo {
  readonly inputPerToken: number;
  readonly outputPerToken: number;
  readonly currency: string;
}

// ============================================================================
// Tools Context
// ============================================================================

/**
 * Tools registry
 */
export interface ToolsRegistry {
  readonly available: readonly ToolId[];
  readonly enabled: readonly ToolId[];
  enableTool: (toolId: ToolId) => void;
  disableTool: (toolId: ToolId) => void;
  getTool: (toolId: ToolId) => ToolInfo | undefined;
}

/**
 * Tool information
 */
export interface ToolInfo {
  readonly id: ToolId;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly enabled: boolean;
}

// ============================================================================
// Agents Context
// ============================================================================

/**
 * Agents registry
 */
export interface AgentsRegistry {
  readonly available: readonly AgentId[];
  readonly active?: AgentId;
  setActiveAgent: (agentId: AgentId) => void;
  getAgent: (agentId: AgentId) => AgentInfo | undefined;
}

/**
 * Agent information
 */
export interface AgentInfo {
  readonly id: AgentId;
  readonly name: string;
  readonly role: string;
  readonly description: string;
  readonly status: 'idle' | 'active' | 'busy';
}

// ============================================================================
// Theme Context
// ============================================================================

/**
 * Theme context value
 */
export interface ThemeContextValue {
  readonly mode: 'light' | 'dark' | 'auto';
  readonly colors: ThemeColors;
  readonly fonts: ThemeFonts;
  readonly spacing: ThemeSpacing;
  readonly borderRadius: string;
  setMode: (mode: 'light' | 'dark' | 'auto') => void;
  toggleMode: () => void;
}

/**
 * Theme colors
 */
export interface ThemeColors {
  readonly primary: string;
  readonly secondary: string;
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly error: string;
  readonly warning: string;
  readonly success: string;
  readonly info: string;
  readonly border: string;
}

/**
 * Theme fonts
 */
export interface ThemeFonts {
  readonly body: string;
  readonly heading: string;
  readonly monospace: string;
}

/**
 * Theme spacing
 */
export interface ThemeSpacing {
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
}

// ============================================================================
// Chat Context
// ============================================================================

/**
 * Chat context value
 */
export interface ChatContextValue {
  readonly sessionId: SessionId;
  readonly messages: readonly ChatMessage[];
  readonly isStreaming: boolean;
  readonly error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
}

/**
 * Chat message
 */
export interface ChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly timestamp: number;
  readonly metadata?: Record<string, JsonValue>;
}

// ============================================================================
// Stream Context
// ============================================================================

/**
 * Stream context value
 */
export interface StreamContextValue {
  readonly config: StreamConfig;
  readonly state: 'idle' | 'connecting' | 'streaming' | 'paused' | 'done' | 'error';
  readonly isStreaming: boolean;
  readonly error: Error | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  updateConfig: (config: Partial<StreamConfig>) => void;
}

// ============================================================================
// Session Context
// ============================================================================

/**
 * Session context value
 */
export interface SessionContextValue {
  readonly sessionId: SessionId;
  readonly userId?: string;
  readonly metadata: Record<string, JsonValue>;
  readonly startTime: number;
  updateMetadata: (metadata: Record<string, JsonValue>) => void;
  endSession: () => Promise<void>;
}
