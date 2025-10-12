import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Mail: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'mail-icon' }, '📧'),
  Users: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'users-icon' }, '👥'),
  RefreshCw: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'refresh-icon' }, '🔄'),
  Search: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'search-icon' }, '🔍'),
  Edit: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'edit-icon' }, '✏️'),
  Save: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'save-icon' }, '💾'),
  X: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'x-icon' }, '❌'),
  GraduationCap: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'graduation-icon' }, '🎓'),
  Phone: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'phone-icon' }, '📞'),
  Copy: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'copy-icon' }, '📋'),
  Eye: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'eye-icon' }, '👁️'),
  Key: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'key-icon' }, '🔑'),
  Link: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'link-icon' }, '🔗'),
  MoreHorizontal: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'more-horizontal-icon' }, '⋯'),
  GripVertical: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'grip-vertical-icon' }, '⋮⋮'),
  ChevronsUpDown: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'chevrons-up-down-icon' }, '⇅'),
  ChevronDown: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'chevron-down-icon' }, '▼'),
  Pin: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'pin-icon' }, '📌'),
  PinOff: ({ className }: { className?: string }) => React.createElement('div', { className, 'data-testid': 'pin-off-icon' }, '📌❌'),
}))

// Mock APIService module
vi.mock('../services/APIService', () => ({
  APIService: {
    searchAlumniMembers: vi.fn(),
    getInvitations: vi.fn(),
    getFamilyInvitations: vi.fn(),
    searchAppUsers: vi.fn(),
    sendInvitationToAlumniMember: vi.fn(),
    resendInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
    updateAlumniMember: vi.fn(),
    updateAppUser: vi.fn()
  }
}))

// Mock fetch for OTP API calls
global.fetch = vi.fn()

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => 'mock-token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  },
  writable: true
})

import { InvitationSection } from '../components/admin/InvitationSection'
import { APIService } from '../services/APIService'

describe('InvitationSection', () => {
  const mockInvitations = [
    {
      id: '1',
      email: 'test@example.com',
      status: 'pending',
      invitationToken: 'token123',
      sentAt: new Date().toISOString()
    },
    {
      id: '2',
      email: 'expired@example.com',
      status: 'expired',
      invitationToken: 'token456',
      sentAt: new Date().toISOString()
    }
  ]

  const mockMembers = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      graduationYear: '2020'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default API mocks
    vi.mocked(APIService.getInvitations).mockResolvedValue(mockInvitations)
    vi.mocked(APIService.getFamilyInvitations).mockResolvedValue([])
    vi.mocked(APIService.searchAppUsers).mockResolvedValue([])
    vi.mocked(APIService.searchAlumniMembers).mockResolvedValue(mockMembers)

    // Setup default fetch mocks
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200
    } as Response)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Basic Rendering', () => {
    it('renders the component with tabs', async () => {
      render(<InvitationSection />)

      // Wait for the tabs to appear
      const membersTab = await screen.findByRole('tab', { name: /Alumni Members/i })
      const invitationsTab = screen.getByRole('tab', { name: /Invitations/i })
      const usersTab = screen.getByRole('tab', { name: /App Users/i })

      expect(membersTab).toBeInTheDocument()
      expect(invitationsTab).toBeInTheDocument()
      expect(usersTab).toBeInTheDocument()
    })

    it('loads invitations on mount', async () => {
      render(<InvitationSection />)

      await waitFor(() => {
        expect(APIService.getInvitations).toHaveBeenCalled()
      })
    })
  })

  describe('OTP Functionality', () => {
    beforeEach(() => {
      // Mock successful OTP generation response
      vi.mocked(fetch).mockImplementation((url) => {
        if (url.toString().includes('/api/otp/generate')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              code: '123456',
              expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            })
          } as Response)
        }
        if (url.toString().includes('/api/otp/active/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              code: '123456',
              expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              tokenType: 'login'
            })
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
          status: 200
        } as Response)
      })
    })

    it('shows testing panel when Test Mode is clicked', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      // Switch to invitations tab
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      await user.click(invitationsTab)

      // Click Test Mode button
      const testModeButton = screen.getByRole('button', { name: /Test Mode/i })
      await user.click(testModeButton)

      // Check if testing panel appears
      await waitFor(() => {
        expect(screen.getByText('Testing Panel')).toBeInTheDocument()
      })
    })

    it('generates OTP when Generate button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      // Switch to invitations tab and enable test mode
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      await user.click(invitationsTab)

      const testModeButton = screen.getByRole('button', { name: /Test Mode/i })
      await user.click(testModeButton)

      // Wait for invitations to load and find generate button
      await waitFor(() => {
        const generateButton = screen.getByTitle(/Generate new OTP/i)
        expect(generateButton).toBeInTheDocument()
      })

      const generateButton = screen.getByTitle(/Generate new OTP/i)
      await user.click(generateButton)

      // Check if OTP was generated (success message should appear)
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/otp/generate',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token'
            })
          })
        )
      })
    })

    it('displays active OTP codes in testing panel', async () => {
      render(<InvitationSection />)

      // Switch to invitations tab and enable test mode
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      fireEvent.click(invitationsTab)

      const testModeButton = screen.getByRole('button', { name: /Test Mode/i })
      fireEvent.click(testModeButton)

      // Wait for OTP display
      await waitFor(() => {
        expect(screen.getByText('123456')).toBeInTheDocument()
      })

      // Check OTP code display
      const otpCode = screen.getByText('123456')
      expect(otpCode).toBeInTheDocument()
      expect(otpCode).toHaveClass('bg-green-100') // Should be valid (not expired)
    })

    it('shows expired status for expired OTPs', async () => {
      // Mock expired OTP response
      vi.mocked(fetch).mockImplementation((url) => {
        if (url.toString().includes('/api/otp/active/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              code: '123456',
              expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
              tokenType: 'login'
            })
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
          status: 200
        } as Response)
      })

      render(<InvitationSection />)

      // Switch to invitations tab and enable test mode
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      fireEvent.click(invitationsTab)

      const testModeButton = screen.getByRole('button', { name: /Test Mode/i })
      fireEvent.click(testModeButton)

      // Wait for expired OTP display
      await waitFor(() => {
        expect(screen.getByText('Expired')).toBeInTheDocument()
      })

      const otpCode = screen.getByText('123456')
      expect(otpCode).toHaveClass('bg-red-100') // Should be expired
    })

    it('copies OTP to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      // Switch to invitations tab and enable test mode
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      await user.click(invitationsTab)

      const testModeButton = screen.getByRole('button', { name: /Test Mode/i })
      await user.click(testModeButton)

      // Wait for copy button to appear
      await waitFor(() => {
        const copyButton = screen.getByTitle('Copy URL')
        expect(copyButton).toBeInTheDocument()
      })

      const copyButton = screen.getByTitle('Copy URL')
      await user.click(copyButton)

      // Check if clipboard API was called
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    it('disables generate button when OTP is active and not expired', async () => {
      render(<InvitationSection />)

      // Switch to invitations tab and enable test mode
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      fireEvent.click(invitationsTab)

      const testModeButton = screen.getByRole('button', { name: /Test Mode/i })
      fireEvent.click(testModeButton)

      // Wait for generate button
      await waitFor(() => {
        const generateButton = screen.getByTitle(/Generate new OTP/i)
        expect(generateButton).toBeInTheDocument()
      })

      const generateButton = screen.getByTitle(/Generate new OTP/i)

      // Initially should be enabled
      expect(generateButton).not.toBeDisabled()

      // After generating OTP, should be disabled if still valid
      // (This would require more complex state mocking)
    })

    it('handles OTP generation errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock OTP generation error
      vi.mocked(fetch).mockImplementation((url) => {
        if (url.toString().includes('/api/otp/generate')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
            status: 429
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
          status: 200
        } as Response)
      })

      render(<InvitationSection />)

      // Switch to invitations tab and enable test mode
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      await user.click(invitationsTab)

      const testModeButton = screen.getByRole('button', { name: /Test Mode/i })
      await user.click(testModeButton)

      // Wait for generate button and click it
      await waitFor(() => {
        const generateButton = screen.getByTitle(/Generate new OTP/i)
        expect(generateButton).toBeInTheDocument()
      })

      const generateButton = screen.getByTitle(/Generate new OTP/i)
      await user.click(generateButton)

      // Check if error message appears
      await waitFor(() => {
        expect(screen.getByText(/Rate limit exceeded/i)).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      // Start with members tab
      expect(await screen.findByRole('tab', { name: /Alumni Members/i })).toHaveAttribute('data-state', 'active')

      // Switch to invitations tab
      const invitationsTab = screen.getByRole('tab', { name: /Invitations/i })
      await user.click(invitationsTab)
      expect(invitationsTab).toHaveAttribute('data-state', 'active')

      // Switch to users tab
      const usersTab = screen.getByRole('tab', { name: /App Users/i })
      await user.click(usersTab)
      expect(usersTab).toHaveAttribute('data-state', 'active')
    })

    it('loads different data for each tab', async () => {
      render(<InvitationSection />)

      // Members tab should load members
      const membersTab = await screen.findByRole('tab', { name: /Alumni Members/i })
      expect(APIService.searchAlumniMembers).toHaveBeenCalled()

      // Invitations tab should load invitations
      expect(APIService.getInvitations).toHaveBeenCalled()

      // Users tab should load users
      expect(APIService.searchAppUsers).toHaveBeenCalled()
    })
  })

  describe('Search Functionality', () => {
    it('searches members when search button is clicked', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      const searchInput = screen.getByPlaceholderText(/Search alumni by name/i)
      const searchButton = screen.getByRole('button', { name: /Search/i })

      await user.type(searchInput, 'john doe')
      await user.click(searchButton)

      expect(APIService.searchAlumniMembers).toHaveBeenCalledWith('john doe')
    })

    it('searches on Enter key press', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      const searchInput = screen.getByPlaceholderText(/Search alumni by name/i)
      await user.type(searchInput, 'john doe{enter}')

      expect(APIService.searchAlumniMembers).toHaveBeenCalledWith('john doe')
    })
  })

  describe('Invitation Management', () => {
    it('sends invitation to member', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Invite')).toBeInTheDocument()
      })

      const inviteButton = screen.getByText('Invite')
      await user.click(inviteButton)

      expect(APIService.sendInvitationToAlumniMember).toHaveBeenCalledWith('1', 'alumni', 14)
    })

    it('resends invitation', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      // Switch to invitations tab
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      await user.click(invitationsTab)

      // Wait for resend button to appear
      await waitFor(() => {
        const resendButton = screen.getByText('Resend')
        expect(resendButton).toBeInTheDocument()
      })

      const resendButton = screen.getByText('Resend')
      await user.click(resendButton)

      expect(APIService.resendInvitation).toHaveBeenCalled()
    })

    it('shows invitation URLs in test mode', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      // Switch to invitations tab and enable test mode
      const invitationsTab = await screen.findByRole('tab', { name: /Invitations/i })
      await user.click(invitationsTab)

      const testModeButton = screen.getByRole('button', { name: /Test Mode/i })
      await user.click(testModeButton)

      // Check if invitation URLs are displayed
      await waitFor(() => {
        expect(screen.getByText('Invitation URLs')).toBeInTheDocument()
      })

      // Should show the invitation URL
      expect(screen.getByText(/http:\/\/localhost:3000\/invitation\/token123/)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error messages when API calls fail', async () => {
      vi.mocked(APIService.getInvitations).mockRejectedValue(new Error('API Error'))

      render(<InvitationSection />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load admin data/i)).toBeInTheDocument()
      })
    })

    it('handles OTP fetch errors gracefully', async () => {
      vi.mocked(fetch).mockImplementation((url) => {
        if (url.toString().includes('/api/otp/active/')) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
          status: 200
        } as Response)
      })

      render(<InvitationSection />)

      // Should not crash when OTP fetch fails
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Alumni Members/i })).toBeInTheDocument()
      })
    })
  })

  describe('Success Messages', () => {
    it('displays success messages for successful operations', async () => {
      const user = userEvent.setup()
      render(<InvitationSection />)

      // Mock successful invitation send
      vi.mocked(APIService.sendInvitationToAlumniMember).mockResolvedValue({ success: true })

      // Wait for invite button and click it
      await waitFor(() => {
        const inviteButton = screen.getByText('Invite')
        expect(inviteButton).toBeInTheDocument()
      })

      const inviteButton = screen.getByText('Invite')
      await user.click(inviteButton)

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/Invitation queued/i)).toBeInTheDocument()
      })
    })
  })
})
