import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToolUsageChart } from '@/components/dashboard/ToolUsageChart'

describe('ToolUsageChart', () => {
  it('renders tool usage title', () => {
    render(<ToolUsageChart />)
    expect(screen.getByText('Tool Usage')).toBeInTheDocument()
  })

  it('renders chart component', () => {
    const { container } = render(<ToolUsageChart />)
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument()
  })

  it('displays tool names', () => {
    render(<ToolUsageChart />)
    expect(screen.getByText('Web Search')).toBeInTheDocument()
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('API Call')).toBeInTheDocument()
  })
})
