import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { time: '00:00', executions: 45 },
  { time: '04:00', executions: 32 },
  { time: '08:00', executions: 78 },
  { time: '12:00', executions: 125 },
  { time: '16:00', executions: 98 },
  { time: '20:00', executions: 67 },
]

export function ExecutionTimeline() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Execution Timeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="executions"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
