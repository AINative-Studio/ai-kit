import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  format?: 'number' | 'currency' | 'percentage'
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  format = 'number',
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === 0

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>

          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && <ArrowUp className="h-4 w-4 text-green-500" />}
              {isNegative && <ArrowDown className="h-4 w-4 text-red-500" />}
              {isNeutral && <Minus className="h-4 w-4 text-muted-foreground" />}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-green-500',
                  isNegative && 'text-red-500',
                  isNeutral && 'text-muted-foreground'
                )}
              >
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>

        {icon && (
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
