import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ThemeProvider from './lib/theme/provider'
import AuthProvider from './contexts/AuthContext'
import { ProtectedRoute, PublicRoute, AdminRoute, ModeratorRoute } from './components/auth/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DraggableDebugPanel } from './components/debug/DraggableDebugPanel'

// Lazy load main page components for better performance
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })))
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })))

// Lazy load authentication pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const InvitationAcceptancePage = lazy(() => import('./pages/InvitationAcceptancePage'))
const OTPVerificationPage = lazy(() => import('./pages/OTPVerificationPage'))
const FamilyProfileSelectionPage = lazy(() => import('./pages/FamilyProfileSelectionPage'))
const FamilySettingsPage = lazy(() => import('./pages/FamilySettingsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'))
const FamilyManagePage = lazy(() => import('./pages/FamilyManagePage'))

// Lazy load placeholder components with loading states
const UploadPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Upload Data</h1>
      <p className="text-muted-foreground">Data upload functionality coming soon...</p>
    </div>
  )
}))

const AlumniDirectoryPage = lazy(() => import('./pages/AlumniDirectoryPage'))
const PreferencesPage = lazy(() => import('./pages/PreferencesPage'))
const PostingsPage = lazy(() => import('./pages/PostingsPage'))
const MyPostingsPage = lazy(() => import('./pages/MyPostingsPage'))
const PostingDetailPage = lazy(() => import('./pages/PostingDetailPage'))
const CreatePostingPage = lazy(() => import('./pages/CreatePostingPage'))
const EditPostingPage = lazy(() => import('./pages/EditPostingPage'))
const ModerationQueuePage = lazy(() => import('./pages/moderator/ModerationQueuePage').then(module => ({ default: module.ModerationQueuePage })))

const ReportsPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <p className="text-muted-foreground">Reports functionality coming soon...</p>
    </div>
  )
}))

const DataFilesPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Data Files</h1>
      <p className="text-muted-foreground">Data files management coming soon...</p>
    </div>
  )
}))

const ExportPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Export Data</h1>
      <p className="text-muted-foreground">Export functionality coming soon...</p>
    </div>
  )
}))

const SettingsPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-muted-foreground">Settings functionality coming soon...</p>
    </div>
  )
}))

const ResponsesPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <p className="text-muted-foreground">Notifications coming soon...</p>
    </div>
  )
}))

const ChatPage = lazy(() => import('./pages/ChatPage'))

const UsersPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <p className="text-muted-foreground">User management coming soon...</p>
    </div>
  )
}))

const ProfileSelectionPage = lazy(() => import('./pages/ProfileSelectionPage'))

const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

// Loading component for Suspense fallback
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading page...</p>
    </div>
  </div>
)

function App() {
  return (
    <ErrorBoundary level="app">
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <DraggableDebugPanel />
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Public routes (redirect authenticated users) */}
                <Route path="/login" element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  </ErrorBoundary>
                } />
                <Route path="/forgot-password" element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  </ErrorBoundary>
                } />
                <Route path="/reset-password/:token" element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <ResetPasswordPage />
                    </PublicRoute>
                  </ErrorBoundary>
                } />
                <Route path="/invitation/:token" element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <InvitationAcceptancePage />
                    </PublicRoute>
                  </ErrorBoundary>
                } />
                <Route path="/invitation/accept/:token" element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <FamilyProfileSelectionPage />
                    </PublicRoute>
                  </ErrorBoundary>
                } />
                {/* OTP Verification - NOT wrapped in PublicRoute because it handles post-auth navigation */}
                <Route path="/verify-otp/:email?" element={
                  <ErrorBoundary level="page">
                    <OTPVerificationPage />
                  </ErrorBoundary>
                } />
                <Route path="/family-invitation/:token" element={
                  <ErrorBoundary level="page">
                    <PublicRoute>
                      <FamilyProfileSelectionPage />
                    </PublicRoute>
                  </ErrorBoundary>
                } />

                {/* Protected main routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/home" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/dashboard" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />

                {/* Profile routes */}
                <Route path="/profile" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <ProfileEditPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/profile/edit" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <ProfileEditPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />

                {/* Family routes */}
                <Route path="/family/manage" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <FamilyManagePage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/settings/family" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <FamilySettingsPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />

                {/* Admin routes */}
                <Route path="/admin" element={
                  <ErrorBoundary level="page">
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  </ErrorBoundary>
                } />
                <Route path="/Admin" element={
                  <ErrorBoundary level="page">
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  </ErrorBoundary>
                } />

                {/* Data management routes - Admin/Moderator only */}
                <Route path="/upload" element={
                  <ErrorBoundary level="page">
                    <ModeratorRoute>
                      <UploadPage />
                    </ModeratorRoute>
                  </ErrorBoundary>
                } />
                <Route path="/data-files" element={
                  <ErrorBoundary level="page">
                    <ModeratorRoute>
                      <DataFilesPage />
                    </ModeratorRoute>
                  </ErrorBoundary>
                } />
                <Route path="/export" element={
                  <ErrorBoundary level="page">
                    <ModeratorRoute>
                      <ExportPage />
                    </ModeratorRoute>
                  </ErrorBoundary>
                } />
                <Route path="/moderator/queue" element={
                  <ErrorBoundary level="page">
                    <ModeratorRoute>
                      <ModerationQueuePage />
                    </ModeratorRoute>
                  </ErrorBoundary>
                } />
                <Route path="/users" element={
                  <ErrorBoundary level="page">
                    <AdminRoute>
                      <UsersPage />
                    </AdminRoute>
                  </ErrorBoundary>
                } />

                {/* Member accessible routes */}
                <Route path="/alumni-directory" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <AlumniDirectoryPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/preferences" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <PreferencesPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/postings" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <PostingsPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/postings/my" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <MyPostingsPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/postings/new" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <CreatePostingPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/postings/:id/edit" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <EditPostingPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/postings/:id" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <PostingDetailPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/reports" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/settings" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/responses" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <ResponsesPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/chat" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/profile-selection" element={
                  <ErrorBoundary level="page">
                    <ProtectedRoute>
                      <ProfileSelectionPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />

                {/* Catch all - redirect to login for unauthenticated, admin for authenticated */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
