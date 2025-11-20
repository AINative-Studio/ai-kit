import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Overview } from '@/components/dashboard/Overview'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Overview', () => {
  it('shows loading state initially', () => {
    render(<Overview />, { wrapper: createWrapper() })

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays metrics after loading', async () => {
    render(<Overview />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument()
      expect(screen.getByText('Total Cost')).toBeInTheDocument()
      expect(screen.getByText('Tokens Used')).toBeInTheDocument()
      expect(screen.getByText('Active Users')).toBeInTheDocument()
    })
  })

  it('formats numbers correctly', async () => {
    render(<Overview />, { wrapper: createWrapper() })

    await waitFor(() => {
      // Check for comma-separated numbers
      expect(screen.getByText(/45,231/)).toBeInTheDocument()
    })
  })

  it('displays change percentages', async () => {
    render(<Overview />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('12.5%')).toBeInTheDocument()
    })
  })
})
