import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '@/components/ui/MetricCard'
import { Activity } from 'lucide-react'

describe('MetricCard', () => {
  it('renders metric with title and value', () => {
    render(<MetricCard title="Total Requests" value="1,234" />)

    expect(screen.getByText('Total Requests')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('displays positive change indicator', () => {
    render(<MetricCard title="Cost" value="$100" change={12.5} />)

    expect(screen.getByText('12.5%')).toBeInTheDocument()
    expect(screen.getByText('vs last period')).toBeInTheDocument()
  })

  it('displays negative change indicator', () => {
    render(<MetricCard title="Errors" value="5" change={-8.3} />)

    expect(screen.getByText('8.3%')).toBeInTheDocument()
  })

  it('displays zero change indicator', () => {
    render(<MetricCard title="Users" value="100" change={0} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const { container } = render(
      <MetricCard
        title="Activity"
        value="500"
        icon={<Activity className="h-6 w-6" />}
      />
    )

    expect(container.querySelector('.lucide-activity')).toBeInTheDocument()
  })

  it('works without change prop', () => {
    render(<MetricCard title="Status" value="Active" />)

    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.queryByText('vs last period')).not.toBeInTheDocument()
  })
})
