/**
 * AIKIT AgentSwarm - Multi-Agent Coordination System
 *
 * This module implements a swarm architecture where a supervisor agent
 * coordinates multiple specialist agents to handle complex tasks.
 */

import { EventEmitter } from 'events';
import { Agent } from './Agent';
import { AgentExecutor, ExecutionConfig, ExecutionResult } from './AgentExecutor';
import {
  SwarmConfig,
  SwarmResult,
  SpecialistAgent,
  SpecialistResult,
  TaskRoutingDecision,
  ExecutionTrace,
  TraceEvent,
  AgentError,
} from './types';
import { generateId } from '../utils/id';

/**
 * Events emitted by the AgentSwarm
 */
export interface SwarmEvents {
  'swarm:start': { input: string; timestamp: string };
  'swarm:routing': { task: string; decision: TaskRoutingDecision };
  'specialist:start': { specialistId: string; task: string };
  'specialist:complete': { specialistId: string; result: SpecialistResult };
  'specialist:error': { specialistId: string; error: Error };
  'swarm:synthesis': { results: SpecialistResult[] };
  'swarm:complete': { result: SwarmResult };
  'swarm:error': { error: Error };
}

/**
 * AgentSwarm - Coordinates multiple specialist agents under a supervisor
 */
export class AgentSwarm extends EventEmitter {
  /**
   * Swarm configuration
   */
  public readonly config: SwarmConfig;

  /**
   * Supervisor agent
   */
  private supervisor: Agent;

  /**
   * Map of specialist agents
   */
  private specialists: Map<string, SpecialistAgent>;

  /**
   * Execution ID for the current swarm execution
   */
  private executionId?: string;

  constructor(config: SwarmConfig) {
    super();
    this.validateConfig(config);
    this.config = config;
    this.supervisor = config.supervisor;
    this.specialists = new Map();

    // Register all specialists
    config.specialists.forEach((specialist) => {
      this.registerSpecialist(specialist);
    });
  }

  /**
   * Register a new specialist agent
   */
  public registerSpecialist(specialist: SpecialistAgent): void {
    // Validate specialist configuration
    if (!specialist.id || typeof specialist.id !== 'string') {
      throw new AgentError(
        'Specialist ID is required and must be a string',
        'INVALID_SPECIALIST_CONFIG'
      );
    }

    if (!specialist.agent) {
      throw new AgentError(
        `Specialist ${specialist.id} must have an agent instance`,
        'INVALID_SPECIALIST_CONFIG',
        { specialistId: specialist.id }
      );
    }

    if (!specialist.specialization || typeof specialist.specialization !== 'string') {
      throw new AgentError(
        `Specialist ${specialist.id} must have a specialization`,
        'INVALID_SPECIALIST_CONFIG',
        { specialistId: specialist.id }
      );
    }

    // Check for duplicate specialist IDs
    if (this.specialists.has(specialist.id)) {
      throw new AgentError(
        `Specialist with ID "${specialist.id}" is already registered`,
        'DUPLICATE_SPECIALIST_ID',
        { specialistId: specialist.id }
      );
    }

    this.specialists.set(specialist.id, specialist);
  }

  /**
   * Unregister a specialist agent
   */
  public unregisterSpecialist(specialistId: string): boolean {
    return this.specialists.delete(specialistId);
  }

  /**
   * Get a specialist by ID
   */
  public getSpecialist(specialistId: string): SpecialistAgent | undefined {
    return this.specialists.get(specialistId);
  }

  /**
   * Get all registered specialists
   */
  public getSpecialists(): SpecialistAgent[] {
    return Array.from(this.specialists.values());
  }

  /**
   * Execute the swarm with the given task
   */
  public async execute(
    task: string,
    config?: ExecutionConfig
  ): Promise<SwarmResult> {
    this.executionId = generateId('swarm');
    const startTime = Date.now();

    // Emit start event
    this.emit('swarm:start', {
      input: task,
      timestamp: new Date().toISOString(),
    });

    try {
      // Step 1: Use supervisor to analyze and route the task
      const routingDecisions = await this.routeTask(task, config);

      // Step 2: Execute specialists based on routing decisions
      const specialistResults = await this.executeSpecialists(
        task,
        routingDecisions,
        config
      );

      // Step 3: Synthesize results from all specialists
      const synthesizedResponse = await this.synthesizeResults(
        task,
        specialistResults,
        config
      );

      // Step 4: Build combined trace
      const combinedTrace = this.buildCombinedTrace(
        specialistResults,
        startTime
      );

      // Build final result
      const result: SwarmResult = {
        response: synthesizedResponse,
        specialistResults,
        combinedTrace,
        supervisorTrace: this.getSupervisorTrace(routingDecisions),
        success: specialistResults.every((r) => r.success),
        stats: {
          totalSpecialistsInvoked: specialistResults.length,
          successfulSpecialists: specialistResults.filter((r) => r.success).length,
          failedSpecialists: specialistResults.filter((r) => !r.success).length,
          totalDurationMs: Date.now() - startTime,
          parallelExecutions: this.config.parallelExecution ? specialistResults.length : 0,
        },
      };

      // Emit complete event
      this.emit('swarm:complete', { result });

      return result;
    } catch (error) {
      const errorObj = error as Error;

      // Emit error event
      this.emit('swarm:error', { error: errorObj });

      // Return error result
      return {
        response: '',
        specialistResults: [],
        combinedTrace: this.buildEmptyTrace(startTime),
        supervisorTrace: this.buildEmptyTrace(startTime),
        success: false,
        error: errorObj,
        stats: {
          totalSpecialistsInvoked: 0,
          successfulSpecialists: 0,
          failedSpecialists: 0,
          totalDurationMs: Date.now() - startTime,
          parallelExecutions: 0,
        },
      };
    }
  }

  /**
   * Route the task to appropriate specialists
   */
  private async routeTask(
    task: string,
    config?: ExecutionConfig
  ): Promise<TaskRoutingDecision[]> {
    // Use custom router if provided
    if (this.config.customRouter) {
      const decision = await this.config.customRouter(
        task,
        Array.from(this.specialists.values())
      );
      this.emit('swarm:routing', { task, decision });
      return [decision];
    }

    // Default routing: keyword-based matching
    const matchedSpecialists = this.matchSpecialistsByKeywords(task);

    if (matchedSpecialists.length === 0) {
      // If no keywords match, ask supervisor to decide
      return this.supervisorRouting(task, config);
    }

    // Sort by priority and return routing decisions
    const sortedSpecialists = matchedSpecialists.sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );

    const decisions: TaskRoutingDecision[] = sortedSpecialists.map((specialist) => ({
      specialistId: specialist.id,
      reason: `Matched keywords: ${specialist.keywords?.join(', ')}`,
      confidence: 0.8,
    }));

    // Emit routing events
    decisions.forEach((decision) => {
      this.emit('swarm:routing', { task, decision });
    });

    return decisions;
  }

  /**
   * Match specialists based on keywords in the task
   */
  private matchSpecialistsByKeywords(task: string): SpecialistAgent[] {
    const taskLower = task.toLowerCase();
    const matched: SpecialistAgent[] = [];

    this.specialists.forEach((specialist) => {
      if (specialist.keywords && specialist.keywords.length > 0) {
        const hasMatch = specialist.keywords.some((keyword) =>
          taskLower.includes(keyword.toLowerCase())
        );
        if (hasMatch) {
          matched.push(specialist);
        }
      }
    });

    return matched;
  }

  /**
   * Use supervisor agent to route the task
   */
  private async supervisorRouting(
    task: string,
    config?: ExecutionConfig
  ): Promise<TaskRoutingDecision[]> {
    // Build prompt for supervisor
    const specialistsList = Array.from(this.specialists.values())
      .map(
        (s) =>
          `- ${s.id}: ${s.specialization} (keywords: ${s.keywords?.join(', ') || 'none'})`
      )
      .join('\n');

    const supervisorPrompt = `You are a supervisor agent coordinating a team of specialists.

Available specialists:
${specialistsList}

Task: ${task}

Based on this task, which specialist(s) should handle it? Respond with a JSON object containing:
{
  "specialistId": "the ID of the specialist",
  "reason": "why this specialist should handle the task",
  "confidence": 0.0-1.0
}

If multiple specialists are needed, respond with a JSON array of such objects.`;

    try {
      const executor = new AgentExecutor(this.supervisor, config);
      const result = await executor.execute(supervisorPrompt, config);

      // Parse supervisor's response
      const decisions = this.parseSupervisorResponse(result.response);

      // Emit routing events
      decisions.forEach((decision) => {
        this.emit('swarm:routing', { task, decision });
      });

      return decisions;
    } catch (error) {
      // Fallback: use first available specialist
      const firstSpecialist = Array.from(this.specialists.values())[0];
      if (!firstSpecialist) {
        throw new AgentError(
          'No specialists available and supervisor routing failed',
          'ROUTING_FAILED',
          { originalError: error }
        );
      }

      const fallbackDecision: TaskRoutingDecision = {
        specialistId: firstSpecialist.id,
        reason: 'Fallback to first available specialist',
        confidence: 0.3,
      };

      this.emit('swarm:routing', { task, decision: fallbackDecision });
      return [fallbackDecision];
    }
  }

  /**
   * Parse supervisor's routing response
   */
  private parseSupervisorResponse(response: string): TaskRoutingDecision[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Handle single decision or array
      const decisions = Array.isArray(parsed) ? parsed : [parsed];

      // Validate decisions
      return decisions
        .filter((d) => d.specialistId && this.specialists.has(d.specialistId))
        .map((d) => ({
          specialistId: d.specialistId,
          reason: d.reason || 'No reason provided',
          confidence: d.confidence ?? 0.5,
        }));
    } catch (error) {
      // Fallback: use first available specialist
      const firstSpecialist = Array.from(this.specialists.values())[0];
      if (!firstSpecialist) {
        return [];
      }

      return [
        {
          specialistId: firstSpecialist.id,
          reason: 'Failed to parse supervisor response, using fallback',
          confidence: 0.2,
        },
      ];
    }
  }

  /**
   * Execute specialist agents based on routing decisions
   */
  private async executeSpecialists(
    task: string,
    decisions: TaskRoutingDecision[],
    config?: ExecutionConfig
  ): Promise<SpecialistResult[]> {
    if (decisions.length === 0) {
      throw new AgentError(
        'No routing decisions provided',
        'NO_ROUTING_DECISIONS'
      );
    }

    // Determine execution mode
    const parallelExecution = this.config.parallelExecution ?? false;
    const maxConcurrent = this.config.maxConcurrent ?? decisions.length;

    if (parallelExecution) {
      return this.executeSpecialistsParallel(task, decisions, maxConcurrent, config);
    } else {
      return this.executeSpecialistsSequential(task, decisions, config);
    }
  }

  /**
   * Execute specialists in parallel
   */
  private async executeSpecialistsParallel(
    task: string,
    decisions: TaskRoutingDecision[],
    maxConcurrent: number,
    config?: ExecutionConfig
  ): Promise<SpecialistResult[]> {
    const results: SpecialistResult[] = [];
    const executing: Promise<SpecialistResult>[] = [];

    for (const decision of decisions) {
      const promise = this.executeSpecialist(task, decision, config);
      executing.push(promise);

      // Limit concurrent executions
      if (executing.length >= maxConcurrent) {
        const result = await Promise.race(executing);
        results.push(result);
        executing.splice(
          executing.findIndex((p) => p === promise),
          1
        );
      }
    }

    // Wait for remaining executions
    const remaining = await Promise.all(executing);
    results.push(...remaining);

    return results;
  }

  /**
   * Execute specialists sequentially
   */
  private async executeSpecialistsSequential(
    task: string,
    decisions: TaskRoutingDecision[],
    config?: ExecutionConfig
  ): Promise<SpecialistResult[]> {
    const results: SpecialistResult[] = [];

    for (const decision of decisions) {
      const result = await this.executeSpecialist(task, decision, config);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single specialist
   */
  private async executeSpecialist(
    task: string,
    decision: TaskRoutingDecision,
    config?: ExecutionConfig
  ): Promise<SpecialistResult> {
    const specialist = this.specialists.get(decision.specialistId);
    if (!specialist) {
      return this.buildErrorResult(
        decision.specialistId,
        'unknown',
        new Error(`Specialist ${decision.specialistId} not found`)
      );
    }

    const startTime = Date.now();

    // Emit start event
    this.emit('specialist:start', {
      specialistId: specialist.id,
      task,
    });

    try {
      // Execute the specialist agent
      const executor = new AgentExecutor(specialist.agent, config);

      // Apply timeout if configured
      const specialistConfig = {
        ...config,
        maxSteps: config?.maxSteps ?? 10,
      };

      const executionPromise = executor.execute(task, specialistConfig);

      const result: ExecutionResult = this.config.specialistTimeoutMs
        ? await this.executeWithTimeout(
            executionPromise,
            this.config.specialistTimeoutMs
          )
        : await executionPromise;

      const specialistResult: SpecialistResult = {
        specialistId: specialist.id,
        specialization: specialist.specialization,
        response: result.response,
        trace: result.trace,
        success: result.success,
        error: result.error,
        metadata: {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        },
      };

      // Emit complete event
      this.emit('specialist:complete', {
        specialistId: specialist.id,
        result: specialistResult,
      });

      return specialistResult;
    } catch (error) {
      const errorObj = error as Error;

      // Emit error event
      this.emit('specialist:error', {
        specialistId: specialist.id,
        error: errorObj,
      });

      return this.buildErrorResult(
        specialist.id,
        specialist.specialization,
        errorObj,
        startTime
      );
    }
  }

  /**
   * Synthesize results from multiple specialists
   */
  private async synthesizeResults(
    originalTask: string,
    results: SpecialistResult[],
    config?: ExecutionConfig
  ): Promise<string> {
    // Use custom synthesizer if provided
    if (this.config.customSynthesizer) {
      return this.config.customSynthesizer(results);
    }

    // If only one specialist, return its response directly
    if (results.length === 1) {
      return results[0].response;
    }

    // Emit synthesis event
    this.emit('swarm:synthesis', { results });

    // Default synthesis: combine all specialist responses
    const combinedResponses = results
      .map(
        (r, i) =>
          `### Specialist ${i + 1}: ${r.specialization}\n${r.success ? r.response : `Error: ${r.error?.message}`}`
      )
      .join('\n\n');

    // Use supervisor to synthesize the final response
    const synthesisPrompt = `You are a supervisor agent. You delegated a complex task to specialists and received their responses.

Original task: ${originalTask}

Specialist responses:
${combinedResponses}

Please synthesize these responses into a single, coherent answer that addresses the original task.`;

    try {
      const executor = new AgentExecutor(this.supervisor, config);
      const result = await executor.execute(synthesisPrompt, config);
      return result.response;
    } catch (error) {
      // Fallback: return concatenated responses
      return combinedResponses;
    }
  }

  /**
   * Build combined execution trace from all specialists
   */
  private buildCombinedTrace(
    results: SpecialistResult[],
    startTime: number
  ): ExecutionTrace {
    const allEvents: TraceEvent[] = [];

    // Collect all events from specialist traces
    results.forEach((result) => {
      const specialistEvents = result.trace.events.map((event) => ({
        ...event,
        data: {
          ...event.data,
          specialistId: result.specialistId,
          specialization: result.specialization,
        },
      }));
      allEvents.push(...specialistEvents);
    });

    // Sort events by timestamp
    allEvents.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Aggregate stats
    const totalStats = results.reduce(
      (acc, result) => ({
        totalSteps: acc.totalSteps + result.trace.stats.totalSteps,
        totalToolCalls: acc.totalToolCalls + result.trace.stats.totalToolCalls,
        totalLLMCalls: acc.totalLLMCalls + result.trace.stats.totalLLMCalls,
        successfulToolCalls:
          acc.successfulToolCalls + result.trace.stats.successfulToolCalls,
        failedToolCalls: acc.failedToolCalls + result.trace.stats.failedToolCalls,
        totalTokensUsed:
          (acc.totalTokensUsed ?? 0) + (result.trace.stats.totalTokensUsed ?? 0),
      }),
      {
        totalSteps: 0,
        totalToolCalls: 0,
        totalLLMCalls: 0,
        successfulToolCalls: 0,
        failedToolCalls: 0,
        totalTokensUsed: 0,
      }
    );

    return {
      executionId: this.executionId ?? generateId('swarm'),
      agentId: this.config.id,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      events: allEvents,
      stats: totalStats,
    };
  }

  /**
   * Get supervisor trace (routing decisions)
   */
  private getSupervisorTrace(decisions: TaskRoutingDecision[]): ExecutionTrace {
    const events: TraceEvent[] = decisions.map((decision) => ({
      type: 'agent_start',
      timestamp: new Date().toISOString(),
      data: {
        action: 'routing_decision',
        specialistId: decision.specialistId,
        reason: decision.reason,
        confidence: decision.confidence,
      },
    }));

    return {
      executionId: generateId('supervisor'),
      agentId: this.supervisor.config.id,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      events,
      stats: {
        totalSteps: decisions.length,
        totalToolCalls: 0,
        totalLLMCalls: 0,
        successfulToolCalls: 0,
        failedToolCalls: 0,
      },
    };
  }

  /**
   * Build an empty trace for error cases
   */
  private buildEmptyTrace(startTime: number): ExecutionTrace {
    return {
      executionId: this.executionId ?? generateId('swarm'),
      agentId: this.config.id,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      events: [],
      stats: {
        totalSteps: 0,
        totalToolCalls: 0,
        totalLLMCalls: 0,
        successfulToolCalls: 0,
        failedToolCalls: 0,
      },
    };
  }

  /**
   * Build error result for a specialist
   */
  private buildErrorResult(
    specialistId: string,
    specialization: string,
    error: Error,
    startTime?: number
  ): SpecialistResult {
    const start = startTime ?? Date.now();
    return {
      specialistId,
      specialization,
      response: '',
      trace: this.buildEmptyTrace(start),
      success: false,
      error,
      metadata: {
        startTime: new Date(start).toISOString(),
        endTime: new Date().toISOString(),
        durationMs: Date.now() - start,
      },
    };
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Specialist execution timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Validate swarm configuration
   */
  private validateConfig(config: SwarmConfig): void {
    if (!config.id || typeof config.id !== 'string') {
      throw new AgentError(
        'Swarm ID is required and must be a string',
        'INVALID_SWARM_CONFIG'
      );
    }

    if (!config.name || typeof config.name !== 'string') {
      throw new AgentError(
        'Swarm name is required and must be a string',
        'INVALID_SWARM_CONFIG',
        { swarmId: config.id }
      );
    }

    if (!config.supervisor) {
      throw new AgentError(
        'Supervisor agent is required',
        'INVALID_SWARM_CONFIG',
        { swarmId: config.id }
      );
    }

    if (!config.specialists || !Array.isArray(config.specialists)) {
      throw new AgentError(
        'Specialists array is required',
        'INVALID_SWARM_CONFIG',
        { swarmId: config.id }
      );
    }

    if (config.specialists.length === 0) {
      throw new AgentError(
        'At least one specialist is required',
        'INVALID_SWARM_CONFIG',
        { swarmId: config.id }
      );
    }
  }

  /**
   * Get swarm metadata
   */
  public getMetadata(): Record<string, unknown> {
    return {
      id: this.config.id,
      name: this.config.name,
      description: this.config.description,
      supervisorId: this.supervisor.config.id,
      specialistsCount: this.specialists.size,
      specialists: Array.from(this.specialists.values()).map((s) => ({
        id: s.id,
        specialization: s.specialization,
        keywords: s.keywords,
        priority: s.priority,
      })),
      maxConcurrent: this.config.maxConcurrent,
      parallelExecution: this.config.parallelExecution,
      ...this.config.metadata,
    };
  }
}

/**
 * Factory function to create an AgentSwarm
 */
export function createAgentSwarm(config: SwarmConfig): AgentSwarm {
  return new AgentSwarm(config);
}
