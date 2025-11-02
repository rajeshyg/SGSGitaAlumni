import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import ProfileEditPage from '../ProfileEditPage'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'user@example.com' }, isAuthenticated: true })
}))

const mockProfile = {
  id: 'u1',
  firstName: 'John',
  lastName: 'Doe',
  currentPosition: 'Engineer',
  location: 'City',
  company: 'Acme',
  linkedinUrl: '',
  bio: ''
}

const updateProfile = vi.fn(async (p: any) => p)

vi.mock('../../hooks/useAlumniData', () => ({
  useAlumniProfile: () => ({
    profile: mockProfile,
    isLoading: false,
    error: null,
    fetchProfile: vi.fn(),
    updateProfile
  })
}))

describe('ProfileEditPage', () => {
  beforeEach(() => {
    updateProfile.mockClear()
  })

  it('renders form fields and saves changes', async () => {
    render(<ProfileEditPage />)

    const firstName = screen.getByLabelText(/First name/i)
    expect(firstName).toHaveValue('John')

    fireEvent.change(firstName, { target: { value: 'Jane' } })
    const save = screen.getByRole('button', { name: /Save changes/i })
    fireEvent.click(save)

    await waitFor(() => expect(updateProfile).toHaveBeenCalled())
  })
})


