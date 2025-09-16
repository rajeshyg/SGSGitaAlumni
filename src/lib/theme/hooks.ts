import { useContext } from 'react'
import { ThemeProviderContext, CustomThemeProviderContext } from './provider'

export const useTheme = () => {
  const context = useContext(CustomThemeProviderContext)

  if (!context)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

export const useSystemTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (!context)
    throw new Error('useSystemTheme must be used within a ThemeProvider')

  return context
}