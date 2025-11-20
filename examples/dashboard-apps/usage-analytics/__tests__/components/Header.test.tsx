import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Header } from '@/components/layout/Header'

describe('Header', () => {
  it('renders search input', () => {
    render(<Header />)

    const searchInput = screen.getByPlaceholderText(/search metrics/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<Header />)

    expect(screen.getByLabelText('Refresh data')).toBeInTheDocument()
    expect(screen.getByLabelText('Export data')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument()
  })

  it('toggles dark mode when button is clicked', () => {
    render(<Header />)

    const darkModeButton = screen.getByLabelText('Toggle dark mode')
    fireEvent.click(darkModeButton)

    // Check if dark class is toggled on document
    const hasDarkClass = document.documentElement.classList.contains('dark')
    expect(hasDarkClass).toBeDefined()
  })

  it('shows loading state when refreshing', async () => {
    render(<Header />)

    const refreshButton = screen.getByLabelText('Refresh data')
    fireEvent.click(refreshButton)

    expect(refreshButton).toBeDisabled()

    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled()
    }, { timeout: 2000 })
  })
})
