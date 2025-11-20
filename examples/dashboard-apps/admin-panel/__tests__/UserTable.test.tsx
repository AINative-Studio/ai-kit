import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserTable } from '@/components/UserTable'

describe('UserTable', () => {
  it('renders user table with headers', () => {
    render(<UserTable />)

    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
  })

  it('displays user data', () => {
    render(<UserTable />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('shows user status badges', () => {
    render(<UserTable />)

    const activeStatuses = screen.getAllByText('active')
    expect(activeStatuses.length).toBeGreaterThan(0)
  })

  it('includes edit actions', () => {
    render(<UserTable />)

    const editButtons = screen.getAllByText('Edit')
    expect(editButtons.length).toBeGreaterThan(0)
  })
})
