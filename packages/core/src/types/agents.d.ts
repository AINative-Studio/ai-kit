/**
 * Agent type definitions for AI Kit
 * Comprehensive types for AI agents and multi-agent systems
 */

import type {
  AgentId,
  SessionId,
  MessageId,
  Timestamp,
  JsonValue,
  Result,
  Option,
} from './utils';
import type { Message, StreamConfig, UsageStats } from './streaming';
import type { PerformanceMetrics } from './common.d';
import type {
  CollaborationConfig,
  CollaborationMode,
  LearningConfig,
  LearningMode,
  MemoryConfig,
} from './common';

// ============================================================================
// Core Agent Types
// ============================================================================

/**
 * Agent role/type
 */
export type AgentRole =
  | 'assistant'
  | 'researcher'
  | 'analyst'
  | 'coder'
  | 'reviewer'
  | 'planner'
  | 'executor'
  | 'coordinator'
  | 'custom';

/**
 * Agent status
 */
export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'paused'
  | 'error'
  | 'done';

/**
 * Agent capability
 */
export interface AgentCapability {
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly config?: Record<string, JsonValue>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  readonly id?: AgentId;
  readonly name: string;
  readonly role: AgentRole;
  readonly description?: string;
  readonly systemPrompt?: string;
  readonly capabilities?: readonly AgentCapability[];
  readonly tools?: readonly string[]; // Tool IDs
  readonly model?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly maxIterations?: number;
  readonly timeout?: number; // milliseconds
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Agent context
 */
export interface AgentContext {
  readonly sessionId: SessionId;
  readonly messages: readonly Message[];
  readonly variables: Record<string, JsonValue>;
  readonly state: AgentState;
  readonly history: readonly AgentAction[];
}

/**
 * Agent state
 */
export interface AgentState {
  readonly status: AgentStatus;
  readonly currentTask?: Task;
  readonly progress?: number; // 0-100
  readonly iteration?: number;
  readonly startTime?: Timestamp;
  readonly endTime?: Timestamp;
  readonly error?: Error;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Agent action (for audit trail)
 */
export interface AgentAction {
  readonly id: string;
  readonly agentId: AgentId;
  readonly type: AgentActionType;
  readonly timestamp: Timestamp;
  readonly input?: JsonValue;
  readonly output?: JsonValue;
  readonly duration?: number; // milliseconds
  readonly success: boolean;
  readonly error?: Error;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Agent action types
 */
export type AgentActionType =
  | 'message'
  | 'tool_use'
  | 'decision'
  | 'delegation'
  | 'planning'
  | 'reflection'
  | 'memory_access'
  | 'custom';

// ============================================================================
// Tasks and Goals
// ============================================================================

/**
 * Task priority
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task status
 */
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Task definition
 */
export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly assignedTo?: AgentId;
  readonly dependencies?: readonly string[]; // Task IDs
  readonly subtasks?: readonly Task[];
  readonly deadline?: Timestamp;
  readonly estimatedDuration?: number; // milliseconds
  readonly actualDuration?: number; // milliseconds
  readonly startTime?: Timestamp;
  readonly endTime?: Timestamp;
  readonly result?: TaskResult;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Task result
 */
export interface TaskResult {
  readonly success: boolean;
  readonly output?: JsonValue;
  readonly error?: Error;
  readonly artifacts?: readonly Artifact[];
  readonly metrics?: TaskMetrics;
}

/**
 * Task metrics
 */
export interface TaskMetrics {
  readonly duration: number; // milliseconds
  readonly iterations: number;
  readonly toolCalls: number;
  readonly tokensUsed: number;
  readonly cost?: number;
}

/**
 * Artifact produced by a task
 */
export interface Artifact {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly data: JsonValue;
  readonly mimeType?: string;
  readonly size?: number; // bytes
  readonly createdAt: Timestamp;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Goal definition (higher-level than task)
 */
export interface Goal {
  readonly id: string;
  readonly description: string;
  readonly success_criteria: readonly string[];
  readonly tasks: readonly Task[];
  readonly status: 'active' | 'achieved' | 'abandoned';
  readonly priority: TaskPriority;
  readonly deadline?: Timestamp;
  readonly progress?: number; // 0-100
  readonly metadata?: Record<string, JsonValue>;
}

// ============================================================================
// Agent Communication
// ============================================================================

/**
 * Message between agents
 */
export interface AgentMessage {
  readonly id: MessageId;
  readonly from: AgentId;
  readonly to: AgentId | readonly AgentId[];
  readonly type: AgentMessageType;
  readonly content: string | JsonValue;
  readonly timestamp: Timestamp;
  readonly replyTo?: MessageId;
  readonly priority?: TaskPriority;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Agent message types
 */
export type AgentMessageType =
  | 'request'
  | 'response'
  | 'notification'
  | 'delegation'
  | 'query'
  | 'command'
  | 'broadcast';

/**
 * Agent communication protocol
 */
export interface AgentProtocol {
  readonly name: string;
  readonly version: string;
  readonly messageFormat: 'json' | 'protobuf' | 'custom';
  readonly transport: 'direct' | 'queue' | 'pubsub' | 'custom';
  readonly reliability: 'at-most-once' | 'at-least-once' | 'exactly-once';
}

// ============================================================================
// Multi-Agent Systems
// ============================================================================

/**
 * Agent team configuration
 */
export interface AgentTeam {
  readonly id: string;
  readonly name: string;
  readonly agents: readonly AgentId[];
  readonly coordinator?: AgentId;
  readonly communicationProtocol?: AgentProtocol;
  readonly sharedContext?: Record<string, JsonValue>;
  readonly metadata?: Record<string, JsonValue>;
}

// Re-export collaboration types from common
export type { CollaborationConfig, CollaborationMode } from './common';

/**
 * Agent orchestration plan
 */
export interface OrchestrationPlan {
  readonly id: string;
  readonly goal: Goal;
  readonly steps: readonly OrchestrationStep[];
  readonly collaborationConfig: CollaborationConfig;
  readonly status: 'pending' | 'executing' | 'completed' | 'failed';
  readonly startTime?: Timestamp;
  readonly endTime?: Timestamp;
}

/**
 * Orchestration step
 */
export interface OrchestrationStep {
  readonly id: string;
  readonly type: 'task' | 'decision' | 'delegation' | 'sync';
  readonly assignedTo?: AgentId | readonly AgentId[];
  readonly task?: Task;
  readonly dependencies?: readonly string[]; // Step IDs
  readonly timeout?: number;
  readonly status: TaskStatus;
}

// ============================================================================
// Agent Decision Making
// ============================================================================

/**
 * Decision point
 */
export interface Decision {
  readonly id: string;
  readonly question: string;
  readonly options: readonly DecisionOption[];
  readonly selectedOption?: string;
  readonly confidence?: number; // 0-1
  readonly reasoning?: string;
  readonly timestamp: Timestamp;
  readonly agentId: AgentId;
}

/**
 * Decision option
 */
export interface DecisionOption {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly score?: number;
  readonly pros?: readonly string[];
  readonly cons?: readonly string[];
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Decision strategy
 */
export type DecisionStrategy =
  | 'greedy' // Choose highest scored option
  | 'random' // Random selection
  | 'epsilon-greedy' // Explore vs exploit
  | 'unanimous' // All agents must agree
  | 'majority' // Majority vote
  | 'weighted' // Weighted voting
  | 'custom';

// ============================================================================
// Agent Planning
// ============================================================================

/**
 * Planning strategy
 */
export type PlanningStrategy =
  | 'forward' // Forward chaining
  | 'backward' // Backward chaining (goal-driven)
  | 'hierarchical' // Hierarchical task network
  | 'reactive' // React to environment
  | 'deliberative' // Think then act
  | 'hybrid'; // Mix of reactive and deliberative

/**
 * Plan
 */
export interface Plan {
  readonly id: string;
  readonly goal: string;
  readonly strategy: PlanningStrategy;
  readonly steps: readonly PlanStep[];
  readonly alternatives?: readonly Plan[];
  readonly estimatedCost?: number;
  readonly estimatedDuration?: number; // milliseconds
  readonly confidence?: number; // 0-1
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Plan step
 */
export interface PlanStep {
  readonly id: string;
  readonly action: string;
  readonly description?: string;
  readonly preconditions?: readonly string[];
  readonly effects?: readonly string[];
  readonly cost?: number;
  readonly duration?: number; // milliseconds
  readonly alternatives?: readonly PlanStep[];
}

// ============================================================================
// Agent Learning and Adaptation
// ============================================================================

// Re-export learning types from common
export type { LearningConfig, LearningMode } from './common';

/**
 * Learning experience
 */
export interface Experience {
  readonly id: string;
  readonly state: JsonValue;
  readonly action: JsonValue;
  readonly reward: number;
  readonly nextState: JsonValue;
  readonly done: boolean;
  readonly timestamp: Timestamp;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Agent performance metrics
 * Re-export from common types for consistency
 */
export type { PerformanceMetrics };

// ============================================================================
// Agent Memory
// ============================================================================

/**
 * Agent memory types
 */
export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working';

/**
 * Memory entry
 */
export interface MemoryEntry {
  readonly id: string;
  readonly type: MemoryType;
  readonly content: JsonValue;
  readonly importance: number; // 0-1
  readonly accessCount: number;
  readonly createdAt: Timestamp;
  readonly lastAccessedAt?: Timestamp;
  readonly expiresAt?: Timestamp;
  readonly metadata?: Record<string, JsonValue>;
}

// Re-export MemoryConfig from common
export type { MemoryConfig } from './common';

// ============================================================================
// Agent Reflection and Self-Improvement
// ============================================================================

/**
 * Reflection result
 */
export interface Reflection {
  readonly id: string;
  readonly trigger: 'periodic' | 'error' | 'completion' | 'manual';
  readonly focus: 'performance' | 'strategy' | 'learning' | 'general';
  readonly insights: readonly string[];
  readonly improvements: readonly Improvement[];
  readonly timestamp: Timestamp;
  readonly agentId: AgentId;
}

/**
 * Proposed improvement
 */
export interface Improvement {
  readonly id: string;
  readonly category: 'process' | 'strategy' | 'communication' | 'learning';
  readonly description: string;
  readonly expectedImpact: 'low' | 'medium' | 'high';
  readonly implemented: boolean;
  readonly metadata?: Record<string, JsonValue>;
}

// ============================================================================
// Agent Execution
// ============================================================================

/**
 * Agent execution options
 */
export interface AgentExecutionOptions {
  readonly sessionId?: SessionId;
  readonly context?: Partial<AgentContext>;
  readonly streamConfig?: StreamConfig;
  readonly timeout?: number; // milliseconds
  readonly maxIterations?: number;
  readonly tools?: readonly string[];
  readonly callbacks?: AgentCallbacks;
  readonly metadata?: Record<string, JsonValue>;
}

/**
 * Agent callbacks
 */
export interface AgentCallbacks {
  readonly onStateChange?: (state: AgentState) => void | Promise<void>;
  readonly onAction?: (action: AgentAction) => void | Promise<void>;
  readonly onDecision?: (decision: Decision) => void | Promise<void>;
  readonly onTaskStart?: (task: Task) => void | Promise<void>;
  readonly onTaskComplete?: (task: Task, result: TaskResult) => void | Promise<void>;
  readonly onError?: (error: Error) => void | Promise<void>;
  readonly onMessage?: (message: AgentMessage) => void | Promise<void>;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  readonly success: boolean;
  readonly output?: JsonValue;
  readonly messages: readonly Message[];
  readonly actions: readonly AgentAction[];
  readonly usage: UsageStats;
  readonly duration: number; // milliseconds
  readonly error?: Error;
  readonly artifacts?: readonly Artifact[];
  readonly metadata?: Record<string, JsonValue>;
}

// ============================================================================
// Agent Interface
// ============================================================================

/**
 * Core agent interface
 */
export interface Agent {
  readonly id: AgentId;
  readonly config: AgentConfig;
  readonly state: AgentState;

  // Execution
  execute(input: string, options?: AgentExecutionOptions): Promise<AgentExecutionResult>;
  executeTask(task: Task, options?: AgentExecutionOptions): Promise<TaskResult>;

  // Communication
  sendMessage(message: Omit<AgentMessage, 'id' | 'from' | 'timestamp'>): Promise<void>;
  receiveMessage(message: AgentMessage): Promise<void>;

  // State management
  getState(): AgentState;
  updateState(updates: Partial<AgentState>): void;
  reset(): void;

  // Memory
  remember(entry: Omit<MemoryEntry, 'id' | 'createdAt'>): Promise<void>;
  recall(query: string, type?: MemoryType): Promise<readonly MemoryEntry[]>;
  forget(entryId: string): Promise<void>;

  // Planning
  plan(goal: string, strategy?: PlanningStrategy): Promise<Plan>;

  // Reflection
  reflect(focus?: Reflection['focus']): Promise<Reflection>;

  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): void;
  resume(): void;
}

/**
 * Agent factory function type
 */
export type AgentFactory = (config: AgentConfig) => Promise<Agent> | Agent;
