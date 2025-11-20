import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExecutionTimeline } from '@/components/dashboard/ExecutionTimeline'

describe('ExecutionTimeline', () => {
  it('renders execution timeline title', () => {
    render(<ExecutionTimeline />)
    expect(screen.getByText('Execution Timeline')).toBeInTheDocument()
  })

  it('renders chart component', () => {
    const { container } = render(<ExecutionTimeline />)
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument()
  })

  it('displays time labels', () => {
    render(<ExecutionTimeline />)
    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()
  })
})
