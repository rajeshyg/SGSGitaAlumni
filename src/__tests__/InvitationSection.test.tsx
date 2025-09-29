import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock APIService module
vi.mock('../services/APIService', () => ({
  APIService: {
    searchAlumniMembers: vi.fn(async () => []),
    getInvitations: vi.fn(async () => []),
    getFamilyInvitations: vi.fn(async () => []),
    searchAppUsers: vi.fn(async () => []),
    sendInvitationToAlumniMember: vi.fn(async () => ({})),
    resendInvitation: vi.fn(async () => ({})),
    revokeInvitation: vi.fn(async () => ({})),
    updateAlumniMember: vi.fn(async () => ({})),
    updateAppUser: vi.fn(async () => ({}))
  }
}))

import { InvitationSection } from '../components/admin/InvitationSection'

describe('InvitationSection (smoke)', () => {
  it('renders the hub with tabs', async () => {
    render(<InvitationSection />)

    // Wait for the members tab to appear (component performs async loads)
    const membersTab = await screen.findByRole('tab', { name: /Alumni Members/i })
    expect(membersTab).toBeInTheDocument()
  })
})
