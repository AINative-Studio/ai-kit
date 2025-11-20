import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CostAnalysis } from '@/components/dashboard/CostAnalysis'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('CostAnalysis', () => {
  it('renders cost analysis component', async () => {
    render(<CostAnalysis />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Cost by Model')).toBeInTheDocument()
    })
  })

  it('displays total cost', async () => {
    render(<CostAnalysis />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText(/Total:/i)).toBeInTheDocument()
    })
  })

  it('shows loading spinner initially', () => {
    render(<CostAnalysis />, { wrapper: createWrapper() })
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
