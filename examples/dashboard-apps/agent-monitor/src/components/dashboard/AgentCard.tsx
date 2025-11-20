import { Link } from 'react-router-dom'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { Agent } from '@/types/agent'
import { cn, formatDuration, getStatusColor, getStatusBg } from '@/utils/helpers'

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link
      to={`/agent/${agent.id}`}
      className="block bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{agent.name}</h3>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mt-2',
              getStatusBg(agent.status),
              getStatusColor(agent.status)
            )}
          >
            {agent.status === 'running' && <Activity className="h-3 w-3" />}
            {agent.status}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Success Rate</span>
          <span className="font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            {agent.successRate}%
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Execution</span>
          <span className="font-medium flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-500" />
            {formatDuration(agent.avgExecutionTime)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Executions</span>
          <span className="font-medium">{agent.totalExecutions.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Errors</span>
          <span className="font-medium flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            {agent.errorCount}
          </span>
        </div>
      </div>
    </Link>
  )
}
