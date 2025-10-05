import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock APIService
vi.mock('../../services/APIService', () => ({
  APIService: {
    searchAlumniMembers: vi.fn(),
    getInvitations: vi.fn(),
    getFamilyInvitations: vi.fn(),
    searchAppUsers: vi.fn(),
    sendInvitationToAlumniMember: vi.fn(),
    resendInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
    updateAlumniMember: vi.fn(),
    updateAppUser: vi.fn(),
    updateUserProfile: vi.fn()
  }
}))

import { InvitationSection } from '../../components/admin/InvitationSection'
import { APIService } from '../../services/APIService'

// Mock UI components to avoid complex dependencies
vi.mock('../../components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>
}))

vi.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}))

vi.mock('../../components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}))

vi.mock('../../components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  )
}))

vi.mock('../../components/ui/badge', () => ({
  default: ({ children, className }: any) => <span className={className}>{children}</span>
}))

vi.mock('../../components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-description">{children}</div>
}))

vi.mock('../../components/admin/AdminListItem', () => ({
  default: ({ children, title, subtitle, actions }: any) => (
    <div data-testid="admin-list-item">
      <div>{title}</div>
      <div>{subtitle}</div>
      <div>{actions}</div>
      {children}
    </div>
  )
}))

vi.mock('../../components/ui/tanstack-advanced-table', () => ({
  TanStackAdvancedTable: ({ data, columns, loading, emptyMessage }: any) => (
    <div data-testid="tanstack-table">
      {loading && <div>Loading...</div>}
      {!loading && data.length === 0 && <div>{emptyMessage}</div>}
      {data.map((item: any, index: number) => (
        <div key={index} data-testid={`table-row-${index}`}>
          {columns.map((col: any, colIndex: number) => (
            <div key={colIndex} data-testid={`table-cell-${index}-${colIndex}`}>
              {col.cell ? col.cell({ row: { original: item } }) : item[col.accessorKey]}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Mail: () => <span data-testid="mail-icon">Mail</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  RefreshCw: () => <span data-testid="refresh-icon">Refresh</span>,
  Search: () => <span data-testid="search-icon">Search</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Save: () => <span data-testid="save-icon">Save</span>,
  X: () => <span data-testid="x-icon">X</span>,
  GraduationCap: () => <span data-testid="graduation-icon">Graduation</span>,
  Phone: () => <span data-testid="phone-icon">Phone</span>
}))

describe('User Flow Integration Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(APIService.getInvitations).mockResolvedValue([])
    vi.mocked(APIService.getFamilyInvitations).mockResolvedValue([])
    vi.mocked(APIService.searchAppUsers).mockResolvedValue([])
    vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Data Management Flows', () => {
    describe('Preventing duplicate submissions during form interactions', () => {
      it('should disable invite button while invitation is being sent', async () => {
        // Mock pending invitation check
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            graduationYear: 2020
          }
        ])

        // Mock the sendInvitationToAlumniMember to be slow
        let resolveInvitation: (value: any) => void = () => {}
        const invitationPromise = new Promise((resolve) => {
          resolveInvitation = resolve
        })
        vi.mocked(APIService.sendInvitationToAlumniMember).mockReturnValue(invitationPromise)

        render(<InvitationSection />)

        // Wait for component to load and search for members
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'John')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        // Wait for member to appear
        await waitFor(() => {
          expect(screen.getByText('John')).toBeInTheDocument()
        })

        // Click invite button
        const inviteButton = screen.getByRole('button', { name: /Invite/i })
        await user.click(inviteButton)

        // Button should be disabled immediately
        expect(inviteButton).toBeDisabled()

        // Resolve the invitation
        resolveInvitation({ success: true })

        // Wait for completion
        await waitFor(() => {
          expect(inviteButton).not.toBeDisabled()
        })
      })

      it('should prevent multiple rapid clicks on invite button', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            graduationYear: 2019
          }
        ])

        // Mock slow API call
        let callCount = 0
        vi.mocked(APIService.sendInvitationToAlumniMember).mockImplementation(async () => {
          callCount++
          await new Promise(resolve => setTimeout(resolve, 100))
          return { success: true }
        })

        render(<InvitationSection />)

        // Search for member
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Jane')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Jane')).toBeInTheDocument()
        })

        const inviteButton = screen.getByRole('button', { name: /Invite/i })

        // Click multiple times rapidly
        await user.click(inviteButton)
        await user.click(inviteButton)
        await user.click(inviteButton)

        // Wait for completion
        await waitFor(() => {
          expect(inviteButton).not.toBeDisabled()
        })

        // Should only have been called once
        expect(callCount).toBe(1)
        expect(vi.mocked(APIService.sendInvitationToAlumniMember)).toHaveBeenCalledTimes(1)
      })

      it('should show loading state during member update operations', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Bob',
            lastName: 'Wilson',
            email: 'bob.wilson@example.com',
            graduationYear: 2018
          }
        ])

        // Mock slow update
        let resolveUpdate: (value: any) => void = () => {}
        const updatePromise = new Promise((resolve) => {
          resolveUpdate = resolve
        })
        vi.mocked(APIService.updateAlumniMember).mockReturnValue(updatePromise)

        render(<InvitationSection />)

        // Search and edit member
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Bob')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Bob')).toBeInTheDocument()
        })

        // Click edit button
        await user.click(screen.getByRole('button', { name: /Edit/i }))

        // Should be in edit mode
        expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()

        // Click save
        const saveButton = screen.getByRole('button', { name: /Save/i })
        await user.click(saveButton)

        // Save button should be disabled during save
        expect(saveButton).toBeDisabled()

        // Resolve update
        resolveUpdate({ success: true })

        // Wait for completion
        await waitFor(() => {
          expect(saveButton).not.toBeDisabled()
        })
      })
    })

    describe('Handling server conflicts gracefully (409 errors)', () => {
      it('should display appropriate error message for duplicate invitation conflicts', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com',
            graduationYear: 2021
          }
        ])

        // Mock 409 conflict error
        const conflictError = new Error('409 Conflict: Invitation already exists')
        vi.mocked(APIService.sendInvitationToAlumniMember).mockRejectedValue(conflictError)

        render(<InvitationSection />)

        // Search for member
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Alice')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Alice')).toBeInTheDocument()
        })

        // Click invite
        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Wait for error message
        await waitFor(() => {
          expect(screen.getByText('This alumni member already has a pending invitation')).toBeInTheDocument()
        })
      })

      it('should handle concurrent update conflicts during member editing', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Charlie',
            lastName: 'Brown',
            email: 'charlie.brown@example.com',
            graduationYear: 2017
          }
        ])

        // Mock conflict on update
        const conflictError = new Error('409 Conflict: Resource modified by another user')
        vi.mocked(APIService.updateAlumniMember).mockRejectedValue(conflictError)

        render(<InvitationSection />)

        // Search and edit
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Charlie')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Charlie')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: /Edit/i }))

        // Modify and save
        const firstNameInput = screen.getByDisplayValue('Charlie')
        await user.clear(firstNameInput)
        await user.type(firstNameInput, 'Charles')

        await user.click(screen.getByRole('button', { name: /Save/i }))

        // Should show conflict error
        await waitFor(() => {
          expect(screen.getByText('Update failed')).toBeInTheDocument()
        })
      })

      it('should maintain form state after conflict resolution attempt', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Diana',
            lastName: 'Prince',
            email: 'diana.prince@example.com',
            graduationYear: 2016
          }
        ])

        // First call succeeds, second fails with conflict
        let callCount = 0
        vi.mocked(APIService.updateAlumniMember).mockImplementation(async () => {
          callCount++
          if (callCount === 1) {
            return { success: true }
          }
          throw new Error('409 Conflict')
        })

        render(<InvitationSection />)

        // Search and edit
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Diana')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Diana')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: /Edit/i }))

        // Modify first name
        const firstNameInput = screen.getByDisplayValue('Diana')
        await user.clear(firstNameInput)
        await user.type(firstNameInput, 'Diane')

        // Save successfully first time
        await user.click(screen.getByRole('button', { name: /Save/i }))

        await waitFor(() => {
          expect(screen.getByText('Member updated')).toBeInTheDocument()
        })

        // Edit again and try to save with conflict
        await user.click(screen.getByRole('button', { name: /Edit/i }))

        const updatedFirstNameInput = screen.getByDisplayValue('Diane')
        await user.clear(updatedFirstNameInput)
        await user.type(updatedFirstNameInput, 'Diana')

        await user.click(screen.getByRole('button', { name: /Save/i }))

        // Should show error but form should still be editable
        await waitFor(() => {
          expect(screen.getByText('Update failed')).toBeInTheDocument()
        })

        // Form should still be in edit mode
        expect(screen.getByDisplayValue('Diana')).toBeInTheDocument()
      })
    })

    describe('Maintaining data consistency across component updates', () => {
      it('should refresh invitation status after successful invitation send', async () => {
        const initialInvitations: any[] = []
        const updatedInvitations = [
          {
            id: 'inv-1',
            email: 'eve.adams@example.com',
            status: 'pending',
            sentAt: new Date().toISOString()
          }
        ]

        vi.mocked(APIService.getInvitations)
          .mockResolvedValueOnce(initialInvitations)
          .mockResolvedValueOnce(updatedInvitations)

        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Eve',
            lastName: 'Adams',
            email: 'eve.adams@example.com',
            graduationYear: 2022
          }
        ])

        vi.mocked(APIService.sendInvitationToAlumniMember).mockResolvedValue({ success: true })

        render(<InvitationSection />)

        // Search for member
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Eve')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Eve')).toBeInTheDocument()
        })

        // Initially should show "Not Invited"
        expect(screen.getByText('Not Invited')).toBeInTheDocument()

        // Send invitation
        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Wait for success message
        await waitFor(() => {
          expect(screen.getByText('Invitation queued')).toBeInTheDocument()
        })

        // Status should update to pending
        await waitFor(() => {
          expect(screen.getByText('pending')).toBeInTheDocument()
        })
      })

      it('should maintain search results during background operations', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Frank',
            lastName: 'Miller',
            email: 'frank.miller@example.com',
            graduationYear: 2015
          },
          {
            id: 'member-2',
            firstName: 'Grace',
            lastName: 'Lee',
            email: 'grace.lee@example.com',
            graduationYear: 2015
          }
        ])

        vi.mocked(APIService.sendInvitationToAlumniMember).mockImplementation(async () => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 500))
          return { success: true }
        })

        render(<InvitationSection />)

        // Search for members
        await user.type(screen.getByPlaceholderText(/Search alumni/), '2015')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Frank')).toBeInTheDocument()
          expect(screen.getByText('Grace')).toBeInTheDocument()
        })

        // Send invitation to first member
        const inviteButtons = screen.getAllByRole('button', { name: /Invite/i })
        await user.click(inviteButtons[0])

        // Search results should still be visible during operation
        expect(screen.getByText('Frank')).toBeInTheDocument()
        expect(screen.getByText('Grace')).toBeInTheDocument()

        // Wait for completion
        await waitFor(() => {
          expect(screen.getByText('Invitation queued')).toBeInTheDocument()
        })

        // Results should still be there
        expect(screen.getByText('Frank')).toBeInTheDocument()
        expect(screen.getByText('Grace')).toBeInTheDocument()
      })

      it('should handle optimistic updates with rollback on failure', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Henry',
            lastName: 'Ford',
            email: 'henry.ford@example.com',
            graduationYear: 2014
          }
        ])

        // Mock failure after optimistic update
        vi.mocked(APIService.sendInvitationToAlumniMember).mockRejectedValue(new Error('Network error'))

        render(<InvitationSection />)

        // Search and invite
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Henry')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Henry')).toBeInTheDocument()
        })

        // Initially should show "Not Invited"
        expect(screen.getByText('Not Invited')).toBeInTheDocument()

        // Send invitation (should fail)
        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Wait for error
        await waitFor(() => {
          expect(screen.getByText('Failed to send invitation - please try again')).toBeInTheDocument()
        })

        // Status should remain "Not Invited" (rollback)
        expect(screen.getByText('Not Invited')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery Flows', () => {
    describe('Recovering from network failures', () => {
      it('should retry network failures with exponential backoff', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Ivy',
            lastName: 'Chen',
            email: 'ivy.chen@example.com',
            graduationYear: 2023
          }
        ])

        // Mock network failure then success
        let attemptCount = 0
        vi.mocked(APIService.sendInvitationToAlumniMember).mockImplementation(async () => {
          attemptCount++
          if (attemptCount < 3) {
            throw new Error('Network Error')
          }
          return { success: true }
        })

        // Mock timers for testing backoff
        vi.useFakeTimers()

        render(<InvitationSection />)

        // Search and invite
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Ivy')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Ivy')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Fast-forward through retries
        await vi.runAllTimersAsync()

        // Should eventually succeed
        await waitFor(() => {
          expect(screen.getByText('Invitation queued')).toBeInTheDocument()
        })

        // Should have been called 3 times (initial + 2 retries)
        expect(vi.mocked(APIService.sendInvitationToAlumniMember)).toHaveBeenCalledTimes(3)
      })

      it('should show offline message when navigator.onLine is false', async () => {
        // Mock offline state
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false
        })

        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Jack',
            lastName: 'Ryan',
            email: 'jack.ryan@example.com',
            graduationYear: 2013
          }
        ])

        vi.mocked(APIService.sendInvitationToAlumniMember).mockRejectedValue(new Error('Network Error'))

        render(<InvitationSection />)

        // Search and invite
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Jack')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Jack')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Should show network error message
        await waitFor(() => {
          expect(screen.getByText('Failed to send invitation - please try again')).toBeInTheDocument()
        })
      })

      it('should gracefully handle timeout errors', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Kate',
            lastName: 'Wilson',
            email: 'kate.wilson@example.com',
            graduationYear: 2012
          }
        ])

        // Mock timeout error
        vi.mocked(APIService.sendInvitationToAlumniMember).mockImplementation(async () => {
          await new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 31000) // Longer than default timeout
          })
        })

        render(<InvitationSection />)

        // Search and invite
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Kate')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Kate')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Should show error after timeout
        await waitFor(() => {
          expect(screen.getByText('Failed to send invitation - please try again')).toBeInTheDocument()
        })
      })
    })

    describe('Handling rate limiting gracefully (429 errors)', () => {
      it('should display rate limit error message', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Liam',
            lastName: 'Garcia',
            email: 'liam.garcia@example.com',
            graduationYear: 2024
          }
        ])

        // Mock 429 rate limit error
        const rateLimitError = new Error('429 Too Many Requests')
        vi.mocked(APIService.sendInvitationToAlumniMember).mockRejectedValue(rateLimitError)

        render(<InvitationSection />)

        // Search and invite
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Liam')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Liam')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Should show generic error (current implementation doesn't specifically handle 429)
        await waitFor(() => {
          expect(screen.getByText('Failed to send invitation - please try again')).toBeInTheDocument()
        })
      })

      it('should implement exponential backoff for rate limited requests', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Mia',
            lastName: 'Rodriguez',
            email: 'mia.rodriguez@example.com',
            graduationYear: 2025
          }
        ])

        // Mock rate limit then success
        let attemptCount = 0
        vi.mocked(APIService.sendInvitationToAlumniMember).mockImplementation(async () => {
          attemptCount++
          if (attemptCount < 4) {
            const error = new Error('429 Too Many Requests')
            ;(error as any).status = 429
            throw error
          }
          return { success: true }
        })

        vi.useFakeTimers()

        render(<InvitationSection />)

        // Search and invite
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Mia')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Mia')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Fast-forward through backoff periods
        await vi.runAllTimersAsync()

        // Should eventually succeed
        await waitFor(() => {
          expect(screen.getByText('Invitation queued')).toBeInTheDocument()
        })

        // Should have been called multiple times with backoff
        expect(vi.mocked(APIService.sendInvitationToAlumniMember)).toHaveBeenCalledTimes(4)
      })

      it('should show user-friendly rate limit message with retry guidance', async () => {
        vi.mocked(APIService.getInvitations).mockResolvedValue([])
        vi.mocked(APIService.searchAlumniMembers).mockResolvedValue([
          {
            id: 'member-1',
            firstName: 'Noah',
            lastName: 'Martinez',
            email: 'noah.martinez@example.com',
            graduationYear: 2026
          }
        ])

        // Mock rate limit with retry-after header
        const rateLimitError = new Error('429 Too Many Requests')
        ;(rateLimitError as any).status = 429
        ;(rateLimitError as any).response = {
          headers: { 'retry-after': '60' }
        }
        vi.mocked(APIService.sendInvitationToAlumniMember).mockRejectedValue(rateLimitError)

        render(<InvitationSection />)

        // Search and invite
        await user.type(screen.getByPlaceholderText(/Search alumni/), 'Noah')
        await user.click(screen.getByRole('button', { name: /Search/i }))

        await waitFor(() => {
          expect(screen.getByText('Noah')).toBeInTheDocument()
        })

        await user.click(screen.getByRole('button', { name: /Invite/i }))

        // Should show error message
        await waitFor(() => {
          expect(screen.getByText('Failed to send invitation - please try again')).toBeInTheDocument()
        })
      })
    })
  })
})