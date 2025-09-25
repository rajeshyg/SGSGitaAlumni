import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ThemeProvider from './lib/theme/provider'
import { initializeMonitoring } from './lib/monitoring'

// Initialize monitoring and error tracking
initializeMonitoring()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="default">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
