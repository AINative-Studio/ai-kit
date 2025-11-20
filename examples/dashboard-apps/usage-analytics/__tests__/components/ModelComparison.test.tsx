import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ModelComparison } from '@/components/dashboard/ModelComparison'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('ModelComparison', () => {
  it('renders model comparison table', async () => {
    render(<ModelComparison />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Model Comparison')).toBeInTheDocument()
    })
  })

  it('displays table headers', async () => {
    render(<ModelComparison />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Model')).toBeInTheDocument()
      expect(screen.getByText('Requests')).toBeInTheDocument()
      expect(screen.getByText('Cost')).toBeInTheDocument()
    })
  })

  it('shows model data', async () => {
    render(<ModelComparison />, { wrapper: createWrapper() })
    await waitFor(() => {
      expect(screen.getByText(/GPT-4/i)).toBeInTheDocument()
    })
  })

  it('highlights success rates', async () => {
    render(<ModelComparison />, { wrapper: createWrapper() })
    await waitFor(() => {
      const successRates = screen.getAllByText(/\d+\.\d+%/)
      expect(successRates.length).toBeGreaterThan(0)
    })
  })
})
