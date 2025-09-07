import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/theme/provider'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'

// Placeholder components for routes (to be implemented)
const UploadPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Upload Data</h1>
    <p className="text-muted-foreground">Data upload functionality coming soon...</p>
  </div>
)

const AlumniDirectoryPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Alumni Directory</h1>
    <p className="text-muted-foreground">Alumni directory coming soon...</p>
  </div>
)

const ReportsPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Reports</h1>
    <p className="text-muted-foreground">Reports functionality coming soon...</p>
  </div>
)

const DataFilesPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Data Files</h1>
    <p className="text-muted-foreground">Data files management coming soon...</p>
  </div>
)

const ExportPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Export Data</h1>
    <p className="text-muted-foreground">Export functionality coming soon...</p>
  </div>
)

const SettingsPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <p className="text-muted-foreground">Settings functionality coming soon...</p>
  </div>
)

const ResponsesPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Notifications</h1>
    <p className="text-muted-foreground">Notifications coming soon...</p>
  </div>
)

const ChatPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Messages</h1>
    <p className="text-muted-foreground">Chat functionality coming soon...</p>
  </div>
)

const UsersPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">User Management</h1>
    <p className="text-muted-foreground">User management coming soon...</p>
  </div>
)

const ProfileSelectionPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Profile Selection</h1>
    <p className="text-muted-foreground">Profile selection coming soon...</p>
  </div>
)

const LoginPage = () => (
  <div className="min-h-screen bg-background p-8">
    <h1 className="text-2xl font-bold mb-4">Login</h1>
    <p className="text-muted-foreground">Login functionality coming soon...</p>
  </div>
)

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Main routes */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/Admin" element={<AdminPage />} />
          
          {/* Data management routes */}
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/alumni-directory" element={<AlumniDirectoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/data-files" element={<DataFilesPage />} />
          <Route path="/export" element={<ExportPage />} />
          
          {/* User & system routes */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/responses" element={<ResponsesPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/users" element={<UsersPage />} />
          
          {/* Auth routes */}
          <Route path="/profile-selection" element={<ProfileSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Catch all - redirect to admin */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
