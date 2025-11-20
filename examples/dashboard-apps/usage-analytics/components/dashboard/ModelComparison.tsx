'use client'

import { Card, CardHeader } from '@/components/ui/Card'
import { useQuery } from '@tanstack/react-query'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface ModelStats {
  name: string
  requests: number
  tokens: number
  cost: number
  avgLatency: number
  successRate: number
}

async function fetchModelStats(): Promise<ModelStats[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    {
      name: 'GPT-4 Turbo',
      requests: 12543,
      tokens: 4567890,
      cost: 456.78,
      avgLatency: 1247,
      successRate: 99.2,
    },
    {
      name: 'GPT-3.5 Turbo',
      requests: 23456,
      tokens: 6789012,
      cost: 234.56,
      avgLatency: 856,
      successRate: 99.8,
    },
    {
      name: 'Claude-3 Opus',
      requests: 8765,
      tokens: 3456789,
      cost: 345.67,
      avgLatency: 1532,
      successRate: 98.9,
    },
    {
      name: 'Claude-3 Sonnet',
      requests: 15432,
      tokens: 5432109,
      cost: 123.45,
      avgLatency: 982,
      successRate: 99.5,
    },
  ]
}

export function ModelComparison() {
  const { data, isLoading } = useQuery({
    queryKey: ['model-comparison'],
    queryFn: fetchModelStats,
  })

  return (
    <Card>
      <CardHeader
        title="Model Comparison"
        description="Performance metrics across different AI models"
      />

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Model
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Requests
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Tokens
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Cost
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Avg Latency
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.map((model) => (
                <tr
                  key={model.name}
                  className="border-b border-border hover:bg-accent transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{model.name}</td>
                  <td className="py-3 px-4 text-right">
                    {formatNumber(model.requests)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatNumber(model.tokens)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(model.cost)}
                  </td>
                  <td className="py-3 px-4 text-right">{model.avgLatency}ms</td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={
                        model.successRate >= 99
                          ? 'text-green-500'
                          : 'text-yellow-500'
                      }
                    >
                      {model.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
