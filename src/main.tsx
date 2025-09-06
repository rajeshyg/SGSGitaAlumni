import React from 'react'
import ReactDOM from 'react-dom/client'
import '../frontend/src/index.css'
import App from '../frontend/src/App.tsx'
import { ThemeProvider } from '../frontend/src/lib/theme/provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="default">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)