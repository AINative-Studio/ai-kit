'use client'

import { Card, CardHeader } from '@/components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'

interface CostData {
  model: string
  cost: number
}

async function fetchCostData(): Promise<CostData[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    { model: 'GPT-4', cost: 456.78 },
    { model: 'GPT-3.5', cost: 234.56 },
    { model: 'Claude-3', cost: 345.67 },
    { model: 'Claude-2', cost: 123.45 },
    { model: 'Gemini', cost: 87.32 },
  ]
}

export function CostAnalysis() {
  const { data, isLoading } = useQuery({
    queryKey: ['cost-analysis'],
    queryFn: fetchCostData,
  })

  const totalCost = data?.reduce((sum, item) => sum + item.cost, 0) || 0

  return (
    <Card>
      <CardHeader
        title="Cost by Model"
        description={`Total: ${formatCurrency(totalCost)}`}
      />

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="model"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Bar
              dataKey="cost"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
