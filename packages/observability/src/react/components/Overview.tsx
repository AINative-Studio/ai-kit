'use client'

import { MetricCard } from '@/components/ui/MetricCard'
import { Activity, DollarSign, Zap, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface OverviewMetrics {
  totalRequests: number
  totalCost: number
  totalTokens: number
  activeUsers: number
  requestsChange: number
  costChange: number
  tokensChange: number
  usersChange: number
}

async function fetchOverviewMetrics(): Promise<OverviewMetrics> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    totalRequests: 45231,
    totalCost: 1247.89,
    totalTokens: 12456789,
    activeUsers: 342,
    requestsChange: 12.5,
    costChange: 8.3,
    tokensChange: 15.2,
    usersChange: 5.7,
  }
}

export function Overview() {
  const { data, isLoading } = useQuery({
    queryKey: ['overview-metrics'],
    queryFn: fetchOverviewMetrics,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-6 animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-1/2 mb-4" />
            <div className="h-8 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Requests"
        value={formatNumber(data?.totalRequests || 0)}
        change={data?.requestsChange}
        icon={<Activity className="h-6 w-6" />}
      />
      <MetricCard
        title="Total Cost"
        value={formatCurrency(data?.totalCost || 0)}
        change={data?.costChange}
        icon={<DollarSign className="h-6 w-6" />}
      />
      <MetricCard
        title="Tokens Used"
        value={formatNumber(data?.totalTokens || 0)}
        change={data?.tokensChange}
        icon={<Zap className="h-6 w-6" />}
      />
      <MetricCard
        title="Active Users"
        value={formatNumber(data?.activeUsers || 0)}
        change={data?.usersChange}
        icon={<Users className="h-6 w-6" />}
      />
    </div>
  )
}
