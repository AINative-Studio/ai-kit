import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Dashboard } from '@/pages/Dashboard'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    expect(screen.getByText('Agent Monitoring')).toBeInTheDocument()
  })

  it('displays description', () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    expect(screen.getByText(/Real-time monitoring/i)).toBeInTheDocument()
  })

  it('shows loading skeletons initially', () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders active agents section', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Active Agents')).toBeInTheDocument()
    })
  })
})
