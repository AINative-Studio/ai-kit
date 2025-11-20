'use client'

import { Card, CardHeader } from '@/components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useQuery } from '@tanstack/react-query'

interface UsageData {
  date: string
  requests: number
  tokens: number
}

async function fetchUsageData(): Promise<UsageData[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300))
  const data: UsageData[] = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      requests: Math.floor(Math.random() * 2000) + 1000,
      tokens: Math.floor(Math.random() * 500000) + 300000,
    })
  }

  return data
}

export function UsageMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['usage-metrics'],
    queryFn: fetchUsageData,
  })

  return (
    <Card>
      <CardHeader
        title="Usage Trends"
        description="API requests and token consumption over time"
      />

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              yAxisId="left"
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              yAxisId="right"
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="requests"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="tokens"
              stroke="hsl(217.2 91.2% 59.8%)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
