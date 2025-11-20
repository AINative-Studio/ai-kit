import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricsOverview } from '@/components/dashboard/MetricsOverview'

describe('MetricsOverview', () => {
  it('renders all metric cards', () => {
    render(<MetricsOverview />)

    expect(screen.getByText('Total Executions')).toBeInTheDocument()
    expect(screen.getByText('Success Rate')).toBeInTheDocument()
    expect(screen.getByText('Failed Executions')).toBeInTheDocument()
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument()
  })

  it('displays metric values', () => {
    render(<MetricsOverview />)

    expect(screen.getByText('4,731')).toBeInTheDocument()
    expect(screen.getByText('98.3%')).toBeInTheDocument()
    expect(screen.getByText('81')).toBeInTheDocument()
    expect(screen.getByText('1.8s')).toBeInTheDocument()
  })

  it('shows change percentages', () => {
    render(<MetricsOverview />)

    expect(screen.getByText('+12.5%')).toBeInTheDocument()
    expect(screen.getByText('+2.1%')).toBeInTheDocument()
  })

  it('renders metric icons', () => {
    const { container } = render(<MetricsOverview />)

    expect(container.querySelector('.lucide-activity')).toBeInTheDocument()
    expect(container.querySelector('.lucide-check-circle')).toBeInTheDocument()
    expect(container.querySelector('.lucide-x-circle')).toBeInTheDocument()
    expect(container.querySelector('.lucide-zap')).toBeInTheDocument()
  })
})
