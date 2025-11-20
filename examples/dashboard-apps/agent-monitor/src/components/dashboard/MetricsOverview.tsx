import { Activity, CheckCircle, XCircle, Zap } from 'lucide-react'

export function MetricsOverview() {
  const metrics = [
    {
      label: 'Total Executions',
      value: '4,731',
      change: '+12.5%',
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Success Rate',
      value: '98.3%',
      change: '+2.1%',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Failed Executions',
      value: '81',
      change: '-8.3%',
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Avg Response Time',
      value: '1.8s',
      change: '-5.2%',
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-2xl font-bold mt-1">{metric.value}</p>
              <p className="text-sm text-green-500 mt-1">{metric.change}</p>
            </div>
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
