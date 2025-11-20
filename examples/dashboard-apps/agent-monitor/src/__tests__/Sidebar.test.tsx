import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'

describe('Sidebar', () => {
  it('renders sidebar with branding', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('Agent Monitor')).toBeInTheDocument()
    expect(screen.getByText('AI Kit')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Live Agents')).toBeInTheDocument()
    expect(screen.getByText('Execution Logs')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
  })

  it('shows active agents count', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('5 Active Agents')).toBeInTheDocument()
    expect(screen.getByText('All systems operational')).toBeInTheDocument()
  })

  it('renders status indicator', () => {
    const { container } = render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    const statusIndicator = container.querySelector('.animate-pulse')
    expect(statusIndicator).toBeInTheDocument()
  })
})
