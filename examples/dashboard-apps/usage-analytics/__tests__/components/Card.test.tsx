import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader } from '@/components/ui/Card'

describe('Card', () => {
  it('renders card with children', () => {
    render(<Card>Test Content</Card>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders card header with title', () => {
    render(<CardHeader title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders card header with description', () => {
    render(<CardHeader title="Title" description="Test Description" />)
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('renders card header with action', () => {
    const action = <button>Action</button>
    render(<CardHeader title="Title" action={action} />)
    expect(screen.getByText('Action')).toBeInTheDocument()
  })
})
