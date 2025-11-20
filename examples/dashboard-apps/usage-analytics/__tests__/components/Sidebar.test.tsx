import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('Sidebar', () => {
  it('renders the sidebar with navigation items', () => {
    render(<Sidebar />)

    expect(screen.getByText('AI Kit')).toBeInTheDocument()
    expect(screen.getByText('Usage Analytics')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Cost Tracking')).toBeInTheDocument()
  })

  it('displays user information', () => {
    render(<Sidebar />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    render(<Sidebar />)

    const overviewLink = screen.getByText('Overview').closest('a')
    expect(overviewLink).toHaveClass('bg-primary')
  })
})
