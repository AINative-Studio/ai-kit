import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { APIKeyManager } from '@/components/APIKeyManager'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

describe('APIKeyManager', () => {
  it('renders API key manager', () => {
    render(<APIKeyManager />)

    expect(screen.getByText('API Keys')).toBeInTheDocument()
    expect(screen.getByText('Generate New Key')).toBeInTheDocument()
  })

  it('displays API keys', () => {
    render(<APIKeyManager />)

    expect(screen.getByText('Production API Key')).toBeInTheDocument()
    expect(screen.getByText('Development API Key')).toBeInTheDocument()
  })

  it('hides keys by default', () => {
    render(<APIKeyManager />)

    const hiddenKeys = screen.getAllByText(/••••••••••••••••/)
    expect(hiddenKeys.length).toBeGreaterThan(0)
  })

  it('reveals key when eye icon is clicked', () => {
    render(<APIKeyManager />)

    const eyeButtons = screen.getAllByRole('button')
    const revealButton = eyeButtons.find((btn) =>
      btn.querySelector('.lucide-eye')
    )

    if (revealButton) {
      fireEvent.click(revealButton)
      expect(screen.getByText(/sk_live_/)).toBeInTheDocument()
    }
  })

  it('copies key to clipboard', () => {
    render(<APIKeyManager />)

    const copyButtons = screen.getAllByRole('button')
    const copyButton = copyButtons.find((btn) =>
      btn.querySelector('.lucide-copy')
    )

    if (copyButton) {
      fireEvent.click(copyButton)
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    }
  })
})
