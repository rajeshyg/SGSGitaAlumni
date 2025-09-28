import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ThemeProvider from './lib/theme/provider'
import AuthProvider from './contexts/AuthContext'
import { ProtectedRoute, PublicRoute, AdminRoute, ModeratorRoute } from './components/auth/ProtectedRoute'

// Lazy load main page components for better performance
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })))
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })))

// Lazy load authentication pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const InvitationAcceptancePage = lazy(() => import('./pages/InvitationAcceptancePage'))
const OTPVerificationPage = lazy(() => import('./pages/OTPVerificationPage'))
const FamilyProfileSelectionPage = lazy(() => import('./pages/FamilyProfileSelectionPage'))

// Lazy load placeholder components with loading states
const UploadPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Upload Data</h1>
      <p className="text-muted-foreground">Data upload functionality coming soon...</p>
    </div>
  )
}))

const AlumniDirectoryPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Alumni Directory</h1>
      <p className="text-muted-foreground">Alumni directory coming soon...</p>
    </div>
  )
}))

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

const ChatPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <p className="text-muted-foreground">Chat functionality coming soon...</p>
    </div>
  )
}))

const UsersPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <p className="text-muted-foreground">User management coming soon...</p>
    </div>
  )
}))

const ProfileSelectionPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Selection</h1>
      <p className="text-muted-foreground">Profile selection coming soon...</p>
    </div>
  )
}))

const ForgotPasswordPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <p className="text-muted-foreground">Password reset functionality coming soon...</p>
    </div>
  )
}))

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
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Public routes (redirect authenticated users) */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              <Route path="/forgot-password" element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              } />
              <Route path="/invitation/:token" element={
                <PublicRoute>
                  <InvitationAcceptancePage />
                </PublicRoute>
              } />
              <Route path="/verify-otp/:email?" element={
                <PublicRoute>
                  <OTPVerificationPage />
                </PublicRoute>
              } />
              <Route path="/family-invitation/:token" element={
                <PublicRoute>
                  <FamilyProfileSelectionPage />
                </PublicRoute>
              } />

              {/* Protected main routes */}
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/home" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              } />
              <Route path="/Admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              } />

              {/* Data management routes - Admin/Moderator only */}
              <Route path="/upload" element={
                <ModeratorRoute>
                  <UploadPage />
                </ModeratorRoute>
              } />
              <Route path="/data-files" element={
                <ModeratorRoute>
                  <DataFilesPage />
                </ModeratorRoute>
              } />
              <Route path="/export" element={
                <ModeratorRoute>
                  <ExportPage />
                </ModeratorRoute>
              } />
              <Route path="/users" element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              } />

              {/* Member accessible routes */}
              <Route path="/alumni-directory" element={
                <ProtectedRoute>
                  <AlumniDirectoryPage />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/responses" element={
                <ProtectedRoute>
                  <ResponsesPage />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              <Route path="/profile-selection" element={
                <ProtectedRoute>
                  <ProfileSelectionPage />
                </ProtectedRoute>
              } />

              {/* Catch all - redirect to login for unauthenticated, admin for authenticated */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
