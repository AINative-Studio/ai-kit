import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AgentCard } from '@/components/dashboard/AgentCard'
import type { Agent } from '@/types/agent'

const mockAgent: Agent = {
  id: '1',
  name: 'Test Agent',
  status: 'running',
  lastExecution: new Date(),
  successRate: 98.5,
  avgExecutionTime: 1247,
  totalExecutions: 1523,
  errorCount: 23,
}

describe('AgentCard', () => {
  it('renders agent information', () => {
    render(
      <BrowserRouter>
        <AgentCard agent={mockAgent} />
      </BrowserRouter>
    )

    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('running')).toBeInTheDocument()
    expect(screen.getByText('98.5%')).toBeInTheDocument()
    expect(screen.getByText('1,523')).toBeInTheDocument()
  })

  it('displays formatted execution time', () => {
    render(
      <BrowserRouter>
        <AgentCard agent={mockAgent} />
      </BrowserRouter>
    )

    expect(screen.getByText('1.2s')).toBeInTheDocument()
  })

  it('shows error count', () => {
    render(
      <BrowserRouter>
        <AgentCard agent={mockAgent} />
      </BrowserRouter>
    )

    expect(screen.getByText('23')).toBeInTheDocument()
  })
})
