import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ThemeProvider from './lib/theme/provider'
import { initializeMonitoring } from './lib/monitoring'
import { initializeSecurity } from './lib/security'

// Initialize monitoring and error tracking
initializeMonitoring()

// Initialize security services
initializeSecurity()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="default">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
