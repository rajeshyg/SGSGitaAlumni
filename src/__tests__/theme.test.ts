import { describe, it, expect } from 'vitest'
import { themes, availableThemes } from '../lib/theme/configs'
import type { ThemeName } from '../lib/theme/types'

describe('Theme System', () => {
  describe('Theme Configuration', () => {
    it('should have all required themes', () => {
      expect(availableThemes).toContain('default')
      expect(availableThemes).toContain('dark')
      expect(availableThemes).toContain('gita')
      expect(availableThemes).toContain('professional')
      expect(availableThemes).toHaveLength(4)
    })

    it('should have valid theme configurations', () => {
      availableThemes.forEach((themeName: ThemeName) => {
        const theme = themes[themeName]
        expect(theme).toBeDefined()
        expect(theme.name).toBe(themeName)
        expect(theme.colors).toBeDefined()
        expect(theme.typography).toBeDefined()
        expect(theme.spacing).toBeDefined()
        expect(theme.borderRadius).toBeDefined()
        expect(theme.shadows).toBeDefined()
      })
    })

    it('should have required color properties', () => {
      availableThemes.forEach((themeName: ThemeName) => {
        const theme = themes[themeName]
        const colors = theme.colors

        // Essential color properties
        expect(colors.bgPrimary).toBeDefined()
        expect(colors.textPrimary).toBeDefined()
        expect(colors.accentColor).toBeDefined()
        expect(colors.borderColor).toBeDefined()
      })
    })

    it('should have component overrides', () => {
      availableThemes.forEach((themeName: ThemeName) => {
        const theme = themes[themeName]
        expect(theme.componentOverrides).toBeDefined()
        expect(theme.componentOverrides?.button).toBeDefined()
        expect(theme.componentOverrides?.table).toBeDefined()
        expect(theme.componentOverrides?.card).toBeDefined()
      })
    })
  })

  describe('Professional Theme', () => {
    const professionalTheme = themes.professional

    it('should have professional theme configuration', () => {
      expect(professionalTheme).toBeDefined()
      expect(professionalTheme.name).toBe('professional')
      expect(professionalTheme.displayName).toBe('Professional')
    })

    it('should have professional color scheme', () => {
      const colors = professionalTheme.colors
      expect(colors.bgPrimary).toBe('#ffffff')
      expect(colors.accentColor).toBe('#2563eb') // Professional blue
      expect(colors.textPrimary).toBe('#0f172a')
    })

    it('should have professional component overrides', () => {
      const overrides = professionalTheme.componentOverrides
      expect(overrides?.button?.borderRadius).toBe('0.375rem')
      expect(overrides?.card?.borderRadius).toBe('0.5rem')
      expect(overrides?.table?.borderRadius).toBe('0.5rem')
    })
  })

  describe('Theme Compatibility', () => {
    it('should maintain consistent structure across themes', () => {
      const referenceTheme = themes.default

      availableThemes.forEach((themeName: ThemeName) => {
        const theme = themes[themeName]

        // Check that all themes have the same structure
        expect(Object.keys(theme.colors)).toHaveLength(Object.keys(referenceTheme.colors).length)
        expect(Object.keys(theme.typography)).toHaveLength(Object.keys(referenceTheme.typography).length)
        expect(Object.keys(theme.spacing)).toHaveLength(Object.keys(referenceTheme.spacing).length)
      })
    })

    it('should have valid color values', () => {
      availableThemes.forEach((themeName: ThemeName) => {
        const theme = themes[themeName]
        const colors = theme.colors

        // Check that colors are defined and are strings
        Object.values(colors).forEach((color: string) => {
          expect(typeof color).toBe('string')
          expect(color.length).toBeGreaterThan(0)
        })
      })
    })
  })
})