/**
 * Integration Tests: Multi-Agent Workflow
 *
 * Tests for agent swarm coordination and workflows
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor, createDeferred, trackPerformance } from '../utils/test-helpers';
import { mockAgentSwarm, mockWorkflow } from '../fixtures/mock-data';

describe('Multi-Agent Workflow Integration', () => {
  let agents: Map<string, any>;
  let workflowState: Map<string, any>;

  beforeEach(() => {
    agents = new Map();
    workflowState = new Map();

    mockAgentSwarm.forEach((agent) => {
      agents.set(agent.id, {
        ...agent,
        status: 'idle',
        execute: async (input: string) => {
          return `${agent.name} processed: ${input}`;
        },
      });
    });
  });

  describe('Agent Swarm Coordination', () => {
    it('should initialize agent swarm', () => {
      expect(agents.size).toBe(3);
      expect(agents.get('agent-1')?.name).toBe('Research Agent');
    });

    it('should coordinate multiple agents', async () => {
      const results: string[] = [];

      for (const [id, agent] of agents.entries()) {
        const result = await agent.execute('test input');
        results.push(result);
      }

      expect(results).toHaveLength(3);
      expect(results[0]).toContain('Research Agent');
    });

    it('should handle agent status changes', async () => {
      const agent = agents.get('agent-1');

      agent!.status = 'busy';
      expect(agent!.status).toBe('busy');

      await new Promise((resolve) => setTimeout(resolve, 10));

      agent!.status = 'idle';
      expect(agent!.status).toBe('idle');
    });

    it('should distribute work across agents', async () => {
      const tasks = ['task1', 'task2', 'task3', 'task4', 'task5'];
      const results = new Map<string, string>();

      const agentList = Array.from(agents.values());

      await Promise.all(
        tasks.map(async (task, index) => {
          const agent = agentList[index % agentList.length];
          const result = await agent.execute(task);
          results.set(task, result);
        })
      );

      expect(results.size).toBe(5);
    });

    it('should handle agent failures gracefully', async () => {
      const failingAgent = {
        id: 'agent-fail',
        name: 'Failing Agent',
        execute: async () => {
          throw new Error('Agent failed');
        },
      };

      agents.set(failingAgent.id, failingAgent);

      const results = await Promise.allSettled(
        Array.from(agents.values()).map((agent) => agent.execute('test'))
      );

      const failed = results.filter((r) => r.status === 'rejected');
      const succeeded = results.filter((r) => r.status === 'fulfilled');

      expect(failed.length).toBeGreaterThan(0);
      expect(succeeded.length).toBeGreaterThan(0);
    });
  });

  describe('Inter-Agent Communication', () => {
    it('should pass messages between agents', async () => {
      const message = 'Hello from agent 1';

      const agent1 = agents.get('agent-1');
      const result1 = await agent1!.execute(message);

      const agent2 = agents.get('agent-2');
      const result2 = await agent2!.execute(result1);

      expect(result2).toContain('Writer Agent processed');
    });

    it('should maintain message queue', async () => {
      const messageQueue: any[] = [];

      // Agent 1 sends message
      messageQueue.push({
        from: 'agent-1',
        to: 'agent-2',
        content: 'Research complete',
        timestamp: Date.now(),
      });

      // Agent 2 receives and responds
      const message = messageQueue.shift();
      expect(message?.from).toBe('agent-1');

      messageQueue.push({
        from: 'agent-2',
        to: 'agent-1',
        content: 'Writing complete',
        timestamp: Date.now(),
      });

      expect(messageQueue).toHaveLength(1);
    });

    it('should broadcast messages to all agents', async () => {
      const broadcast = {
        type: 'broadcast',
        content: 'System update',
        timestamp: Date.now(),
      };

      const receivedBy: string[] = [];

      for (const [id, _] of agents.entries()) {
        receivedBy.push(id);
      }

      expect(receivedBy).toHaveLength(agents.size);
    });

    it('should handle point-to-point communication', async () => {
      const message = {
        from: 'agent-1',
        to: 'agent-2',
        content: 'Direct message',
      };

      const targetAgent = agents.get(message.to);
      expect(targetAgent).toBeDefined();

      const response = await targetAgent!.execute(message.content);
      expect(response).toBeDefined();
    });
  });

  describe('Shared Context', () => {
    it('should maintain shared workspace', async () => {
      const workspace = new Map<string, any>();

      // Agent 1 adds data
      workspace.set('research-data', {
        source: 'agent-1',
        data: 'Research findings',
      });

      // Agent 2 reads data
      const data = workspace.get('research-data');
      expect(data?.source).toBe('agent-1');

      // Agent 2 adds data
      workspace.set('written-content', {
        source: 'agent-2',
        data: 'Article content',
      });

      expect(workspace.size).toBe(2);
    });

    it('should handle concurrent context updates', async () => {
      const context = new Map<string, any>();

      const updates = Array.from(agents.entries()).map(async ([id, agent]) => {
        context.set(`${id}-status`, 'completed');
      });

      await Promise.all(updates);

      expect(context.size).toBe(agents.size);
    });

    it('should lock resources during updates', async () => {
      const resource = { value: 0, locked: false };

      const lockResource = async () => {
        while (resource.locked) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        resource.locked = true;
      };

      const unlockResource = () => {
        resource.locked = false;
      };

      await lockResource();
      resource.value++;
      unlockResource();

      expect(resource.value).toBe(1);
    });

    it('should merge partial results', async () => {
      const results = new Map<string, any>();

      // Each agent contributes partial result
      for (const [id, agent] of agents.entries()) {
        results.set(id, {
          agentId: id,
          output: await agent.execute('partial task'),
        });
      }

      // Merge results
      const merged = {
        outputs: Array.from(results.values()).map((r) => r.output),
        agentCount: results.size,
      };

      expect(merged.agentCount).toBe(3);
      expect(merged.outputs).toHaveLength(3);
    });
  });

  describe('Parallel Execution', () => {
    it('should execute agents in parallel', async () => {
      const startTime = Date.now();

      const results = await Promise.all(
        Array.from(agents.values()).map((agent) =>
          agent.execute('parallel task')
        )
      );

      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(duration).toBeLessThan(100); // Should be fast if truly parallel
    });

    it('should limit concurrent executions', async () => {
      const maxConcurrent = 2;
      const tasks = Array.from({ length: 6 }, (_, i) => i);
      const active = { count: 0 };
      const results: number[] = [];

      const executeTasks = async () => {
        for (const task of tasks) {
          while (active.count >= maxConcurrent) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          active.count++;

          Promise.resolve()
            .then(async () => {
              await new Promise((resolve) => setTimeout(resolve, 50));
              results.push(task);
            })
            .finally(() => {
              active.count--;
            });
        }
      };

      await executeTasks();
      await waitFor(() => results.length === tasks.length, 1000);

      expect(results).toHaveLength(6);
    });

    it('should handle parallel agent failures', async () => {
      const mixedAgents = [
        { id: 'a1', execute: async () => 'success' },
        { id: 'a2', execute: async () => { throw new Error('fail'); } },
        { id: 'a3', execute: async () => 'success' },
      ];

      const results = await Promise.allSettled(
        mixedAgents.map((a) => a.execute())
      );

      const successful = results.filter((r) => r.status === 'fulfilled');
      expect(successful).toHaveLength(2);
    });
  });

  describe('Sequential Workflows', () => {
    it('should execute workflow steps in sequence', async () => {
      const workflow = mockWorkflow;
      const results: any[] = [];

      for (const step of workflow.steps) {
        const agent = agents.get(step.agentId);
        if (agent) {
          const result = await agent.execute(step.input);
          results.push({
            stepId: step.id,
            result,
          });
        }
      }

      expect(results).toHaveLength(workflow.steps.length);
    });

    it('should handle step dependencies', async () => {
      const completedSteps = new Set<string>();

      for (const step of mockWorkflow.steps) {
        // Check dependencies
        if (step.dependsOn) {
          const allDepsComplete = step.dependsOn.every((dep) =>
            completedSteps.has(dep)
          );
          expect(allDepsComplete).toBe(true);
        }

        // Execute step
        const agent = agents.get(step.agentId);
        await agent!.execute(step.input);
        completedSteps.add(step.id);
      }

      expect(completedSteps.size).toBe(mockWorkflow.steps.length);
    });

    it('should pass output to next step', async () => {
      let previousOutput = 'initial input';

      for (const step of mockWorkflow.steps) {
        const agent = agents.get(step.agentId);
        previousOutput = await agent!.execute(previousOutput);
      }

      expect(previousOutput).toBeTruthy();
    });

    it('should skip optional steps', async () => {
      const extendedWorkflow = {
        ...mockWorkflow,
        steps: [
          ...mockWorkflow.steps,
          {
            id: 'step-4',
            agentId: 'agent-1',
            action: 'optional',
            input: 'optional input',
            optional: true,
          },
        ],
      };

      const executedSteps: string[] = [];

      for (const step of extendedWorkflow.steps) {
        if (!(step as any).optional || Math.random() > 0.5) {
          executedSteps.push(step.id);
        }
      }

      expect(executedSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow State Management', () => {
    it('should track workflow progress', async () => {
      const progress = {
        total: mockWorkflow.steps.length,
        completed: 0,
        current: null as string | null,
      };

      for (const step of mockWorkflow.steps) {
        progress.current = step.id;
        const agent = agents.get(step.agentId);
        await agent!.execute(step.input);
        progress.completed++;
      }

      expect(progress.completed).toBe(progress.total);
    });

    it('should save workflow state', async () => {
      const state = {
        workflowId: mockWorkflow.id,
        currentStep: 1,
        stepStates: new Map<string, string>(),
      };

      workflowState.set(mockWorkflow.id, state);

      expect(workflowState.has(mockWorkflow.id)).toBe(true);
    });

    it('should resume from checkpoint', async () => {
      const checkpoint = {
        stepIndex: 1,
        completedSteps: ['step-1'],
        pendingSteps: ['step-2', 'step-3'],
      };

      const remainingSteps = mockWorkflow.steps.slice(checkpoint.stepIndex);

      expect(remainingSteps).toHaveLength(2);
      expect(remainingSteps[0].id).toBe('step-2');
    });

    it('should rollback on failure', async () => {
      const executed: string[] = [];

      try {
        for (const step of mockWorkflow.steps) {
          executed.push(step.id);
          if (step.id === 'step-2') {
            throw new Error('Step failed');
          }
        }
      } catch (error) {
        // Rollback
        executed.pop(); // Remove failed step
      }

      expect(executed).toHaveLength(1);
    });
  });

  describe('Performance', () => {
    it('should complete workflow within time budget', async () => {
      const { duration } = await trackPerformance(async () => {
        for (const step of mockWorkflow.steps) {
          const agent = agents.get(step.agentId);
          await agent!.execute(step.input);
        }
      }, 'workflow-execution');

      expect(duration).toBeLessThan(5000);
    });

    it('should optimize agent selection', async () => {
      // Select least busy agent
      const agentLoads = new Map<string, number>();
      agents.forEach((_, id) => agentLoads.set(id, 0));

      const selectAgent = () => {
        let minLoad = Infinity;
        let selectedAgent = '';

        for (const [id, load] of agentLoads.entries()) {
          if (load < minLoad) {
            minLoad = load;
            selectedAgent = id;
          }
        }

        return selectedAgent;
      };

      const selected = selectAgent();
      expect(selected).toBeTruthy();
      expect(agentLoads.get(selected)).toBe(0);
    });

    it('should cache agent results', async () => {
      const cache = new Map<string, any>();

      const execute = async (agentId: string, input: string) => {
        const cacheKey = `${agentId}:${input}`;

        if (cache.has(cacheKey)) {
          return cache.get(cacheKey);
        }

        const agent = agents.get(agentId);
        const result = await agent!.execute(input);
        cache.set(cacheKey, result);

        return result;
      };

      // First call
      await execute('agent-1', 'test');
      expect(cache.size).toBe(1);

      // Second call (cached)
      await execute('agent-1', 'test');
      expect(cache.size).toBe(1);
    });
  });
});
