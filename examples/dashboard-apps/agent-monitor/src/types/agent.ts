export interface Agent {
  id: string
  name: string
  status: 'running' | 'idle' | 'error' | 'stopped'
  lastExecution: Date
  successRate: number
  avgExecutionTime: number
  totalExecutions: number
  errorCount: number
}

export interface AgentExecution {
  id: string
  agentId: string
  status: 'success' | 'failure' | 'running'
  startTime: Date
  endTime?: Date
  duration?: number
  toolsCalled: string[]
  errorMessage?: string
  metadata?: Record<string, any>
}

export interface ToolUsage {
  name: string
  callCount: number
  avgDuration: number
  successRate: number
  lastUsed: Date
}

export interface AgentMetrics {
  agentId: string
  timestamp: Date
  executionsPerMinute: number
  successRate: number
  avgExecutionTime: number
  memoryUsage: number
  cpuUsage: number
}
