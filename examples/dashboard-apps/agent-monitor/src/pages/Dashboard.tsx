import { useQuery } from '@tanstack/react-query'
import { AgentCard } from '@/components/dashboard/AgentCard'
import { ExecutionTimeline } from '@/components/dashboard/ExecutionTimeline'
import { MetricsOverview } from '@/components/dashboard/MetricsOverview'
import { ToolUsageChart } from '@/components/dashboard/ToolUsageChart'
import type { Agent } from '@/types/agent'

async function fetchAgents(): Promise<Agent[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    {
      id: '1',
      name: 'Customer Support Agent',
      status: 'running',
      lastExecution: new Date(),
      successRate: 98.5,
      avgExecutionTime: 1247,
      totalExecutions: 1523,
      errorCount: 23,
    },
    {
      id: '2',
      name: 'Data Analysis Agent',
      status: 'idle',
      lastExecution: new Date(Date.now() - 300000),
      successRate: 99.2,
      avgExecutionTime: 3456,
      totalExecutions: 867,
      errorCount: 7,
    },
    {
      id: '3',
      name: 'Content Generation Agent',
      status: 'running',
      lastExecution: new Date(),
      successRate: 97.8,
      avgExecutionTime: 2134,
      totalExecutions: 2341,
      errorCount: 51,
    },
  ]
}

export function Dashboard() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agent Monitoring</h1>
        <p className="text-muted-foreground mt-1">
          Real-time monitoring of AI agent execution and performance
        </p>
      </div>

      <MetricsOverview />

      <div>
        <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-card border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents?.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExecutionTimeline />
        <ToolUsageChart />
      </div>
    </div>
  )
}
