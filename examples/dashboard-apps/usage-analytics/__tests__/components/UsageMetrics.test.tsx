import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UsageMetrics } from '@/components/dashboard/UsageMetrics'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('UsageMetrics', () => {
  it('shows loading state', () => {
    render(<UsageMetrics />, { wrapper: createWrapper() })
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders chart after loading', async () => {
    render(<UsageMetrics />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Usage Trends')).toBeInTheDocument()
    })
  })

  it('displays chart description', async () => {
    render(<UsageMetrics />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText(/API requests and token consumption/i)).toBeInTheDocument()
    })
  })
})
