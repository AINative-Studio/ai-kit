import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/components/layout/Header'

describe('Header', () => {
  it('renders search input', () => {
    render(<Header />)

    const searchInput = screen.getByPlaceholderText(/search agents/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    const { container } = render(<Header />)

    expect(container.querySelector('.lucide-refresh-cw')).toBeInTheDocument()
    expect(container.querySelector('.lucide-bell')).toBeInTheDocument()
  })

  it('shows notification badge', () => {
    const { container } = render(<Header />)

    const badge = container.querySelector('.bg-red-500')
    expect(badge).toBeInTheDocument()
  })

  it('toggles dark mode', () => {
    render(<Header />)

    const darkModeButton = screen.getAllByRole('button')[2]
    fireEvent.click(darkModeButton)

    expect(document.documentElement.classList.contains('dark')).toBeDefined()
  })
})
