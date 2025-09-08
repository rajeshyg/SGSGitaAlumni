// Accessibility Standards Constants
// Unified accessibility standards across all platforms and components

export const TOUCH_TARGETS = {
  MOBILE: {
    MINIMUM: 44, // WCAG AA compliant minimum
    RECOMMENDED: 48,
    LARGE: 56,
    SPACING: 8 // Minimum spacing between touch targets
  },
  TABLET: {
    MINIMUM: 32, // Smaller due to precision but still accessible
    RECOMMENDED: 44,
    LARGE: 48,
    SPACING: 6
  },
  DESKTOP: {
    MINIMUM: 24, // Mouse precision allows smaller targets
    RECOMMENDED: 32,
    LARGE: 44,
    SPACING: 4
  }
} as const

// WCAG 2.1 AA Color Contrast Requirements
export const COLOR_CONTRAST = {
  NORMAL_TEXT: {
    AA: 4.5, // Minimum contrast ratio for normal text
    AAA: 7.0 // Enhanced contrast ratio
  },
  LARGE_TEXT: {
    AA: 3.0, // Minimum contrast ratio for large text (18pt+ or 14pt+ bold)
    AAA: 4.5
  },
  UI_COMPONENTS: {
    AA: 3.0, // Minimum contrast for UI components like borders
    AAA: 4.5
  }
} as const

// Focus management standards
export const FOCUS_MANAGEMENT = {
  VISIBLE_INDICATOR: {
    OUTLINE_WIDTH: '2px',
    OUTLINE_STYLE: 'solid',
    OUTLINE_OFFSET: '2px',
    BORDER_RADIUS: '4px'
  },
  TAB_ORDER: {
    LOGICAL: true, // Tab order should follow logical reading order
    NO_TABINDEX_NEGATIVE: true, // Avoid tabindex="-1" for focusable elements
    SKIP_LINKS: true // Provide skip links for keyboard navigation
  }
} as const

// Screen reader standards
export const SCREEN_READER = {
  LIVE_REGIONS: {
    POLITENESS: ['off', 'polite', 'assertive'] as const,
    ATOMIC: [true, false] as const
  },
  ARIA_LABELS: {
    REQUIRED_ROLES: ['button', 'link', 'checkbox', 'radio', 'tab', 'tabpanel'],
    PREFERRED_ATTRIBUTES: ['aria-label', 'aria-labelledby', 'aria-describedby']
  },
  ANNOUNCEMENTS: {
    FORM_VALIDATION: true, // Announce form validation errors
    STATUS_UPDATES: true, // Announce status changes
    LOADING_STATES: true // Announce loading states
  }
} as const

// Motion and animation standards
export const MOTION_PREFERENCES = {
  REDUCED_MOTION: {
    QUERY: '(prefers-reduced-motion: reduce)',
    RESPECT_USER_PREFERENCE: true,
    FALLBACK_DURATION: 0.01 // Near-instant for reduced motion
  },
  ANIMATION_DURATION: {
    FAST: 150, // 150ms
    NORMAL: 300, // 300ms
    SLOW: 500 // 500ms
  }
} as const

// Platform detection for adaptive accessibility
export const PLATFORM_ACCESSIBILITY = {
  MOBILE: {
    TOUCH_TARGETS: TOUCH_TARGETS.MOBILE,
    GESTURE_SUPPORT: true,
    VOICE_CONTROL: true,
    HAPTIC_FEEDBACK: true
  },
  TABLET: {
    TOUCH_TARGETS: TOUCH_TARGETS.TABLET,
    GESTURE_SUPPORT: true,
    VOICE_CONTROL: true,
    HAPTIC_FEEDBACK: false
  },
  DESKTOP: {
    TOUCH_TARGETS: TOUCH_TARGETS.DESKTOP,
    GESTURE_SUPPORT: false,
    VOICE_CONTROL: false,
    HAPTIC_FEEDBACK: false,
    KEYBOARD_SHORTCUTS: true
  }
} as const

// Helper functions for accessibility validation
export const AccessibilityUtils = {
  isValidTouchTarget: (size: number, platform: keyof typeof TOUCH_TARGETS): boolean => {
    return size >= TOUCH_TARGETS[platform].MINIMUM
  },

  calculateContrastRatio: (foreground: string, background: string): number => {
    // Implementation of WCAG contrast ratio calculation
    // This would include color parsing and luminance calculation
    // For now, return a placeholder
    return 4.5 // Placeholder - implement actual calculation
  },

  isContrastValid: (
    foreground: string,
    background: string,
    textSize: 'normal' | 'large' = 'normal',
    level: 'AA' | 'AAA' = 'AA'
  ): boolean => {
    const contrast = AccessibilityUtils.calculateContrastRatio(foreground, background)
    const requirement = COLOR_CONTRAST[textSize === 'normal' ? 'NORMAL_TEXT' : 'LARGE_TEXT'][level]
    return contrast >= requirement
  },

  generateAriaLabel: (element: HTMLElement, context?: string): string => {
    // Generate appropriate aria-label based on element content and context
    const textContent = element.textContent?.trim() || ''
    const ariaLabel = element.getAttribute('aria-label') || textContent

    if (context) {
      return `${ariaLabel}, ${context}`
    }

    return ariaLabel
  },

  isKeyboardNavigable: (element: HTMLElement): boolean => {
    const tagName = element.tagName.toLowerCase()
    const hasTabIndex = element.hasAttribute('tabindex')
    const tabIndex = parseInt(element.getAttribute('tabindex') || '0')

    // Interactive elements are keyboard navigable by default
    const interactiveElements = ['button', 'input', 'select', 'textarea', 'a']
    if (interactiveElements.includes(tagName) && !element.hasAttribute('disabled')) {
      return true
    }

    // Elements with tabindex="0" or positive values are keyboard navigable
    if (hasTabIndex && tabIndex >= 0) {
      return true
    }

    // Elements with contenteditable are keyboard navigable
    if (element.hasAttribute('contenteditable')) {
      return true
    }

    return false
  }
} as const

// High contrast theme standards
export const HIGH_CONTRAST_THEME = {
  COLORS: {
    BACKGROUND: '#000000',
    SURFACE: '#000000',
    TEXT: {
      PRIMARY: '#FFFFFF',
      SECONDARY: '#FFFFFF',
      DISABLED: '#CCCCCC'
    },
    BORDER: '#FFFFFF',
    FOCUS: '#FFFF00',
    ERROR: '#FF0000',
    SUCCESS: '#00FF00',
    WARNING: '#FFFF00'
  }
} as const