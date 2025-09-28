import { ThemeConfiguration, ThemeName } from './types';

// Common constants to avoid duplicate strings
const FONT_SIZE_XS = '0.75rem';
const FONT_SIZE_SM = '0.875rem';
const FONT_SIZE_BASE = '1rem';
const FONT_SIZE_LG = '1.125rem';
const FONT_SIZE_XL = '1.25rem';
const FONT_SIZE_2XL = '1.5rem';
const FONT_SIZE_3XL = '1.875rem';

// Font family constants to avoid duplicate strings
const FONT_FAMILY_SYSTEM = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif';
const FONT_FAMILY_INTER = 'Inter, sans-serif';
const FONT_FAMILY_MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';
const FONT_FAMILY_TIMES = '"Times New Roman", serif';
const FONT_FAMILY_GEORGIA = 'Georgia, serif';

/* eslint-disable custom/no-hardcoded-mock-data */
export const defaultTheme: ThemeConfiguration = {
  name: 'default',
  displayName: 'Default',
  description: 'Professional light theme with clean, modern styling',
  colors: {
    // Background colors - based on screenshot
    bgPrimary: '#ffffff',
    bgSecondary: '#f9fafb',
    bgTertiary: '#f3f4f6',
    bgHeader: '#ffffff',
    bgHeaderGroup: '#f9fafb',

    // Text colors - based on screenshot
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textHeader: '#111827',

    // Border colors - based on screenshot
    borderColor: '#e5e7eb',
    borderHeader: '#d1d5db',

    // Accent colors - based on screenshot
    accentColor: '#f59e0b',
    hoverBg: 'rgba(245, 158, 11, 0.05)',

    // Shadow colors - based on screenshot
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    frozenShadow: '2px 0 4px rgba(0,0,0,0.05)',

    // Badge colors - based on screenshot grade indicators
    badgeGradeA: '#d1fae5',
    badgeGradeAForeground: '#065f46',
    badgeGradeABorder: '#a7f3d0',

    badgeGradeB: '#e0f2fe',
    badgeGradeBForeground: '#0369a1',
    badgeGradeBBorder: '#bae6fd',

    badgeGradeC: '#fef3c7',
    badgeGradeCForeground: '#b45309',
    badgeGradeCBorder: '#fde68a',

    badgeGradeD: '#fed7aa',
    badgeGradeDForeground: '#c2410c',
    badgeGradeDBorder: '#fdba74',

    badgeGradeF: '#fee2e2',
    badgeGradeFForeground: '#dc2626',
    badgeGradeFBorder: '#fecaca',

    badgeNeutral: '#f3f4f6',
    badgeNeutralForeground: '#374151',
    badgeNeutralBorder: '#e5e7eb',
  },
  typography: {
    fontFamily: {
      primary: FONT_FAMILY_SYSTEM,
      secondary: FONT_FAMILY_INTER,
      mono: FONT_FAMILY_MONO,
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  componentOverrides: {
    table: {
      borderRadius: '0.75rem',
      headerBg: '#ffffff',
      rowHoverBg: 'rgba(245, 158, 11, 0.05)',
      borderColor: '#e5e7eb',
      groupHeaderBg: '#f9fafb',
    },
  },
};

export const darkTheme: ThemeConfiguration = {
  name: 'dark',
  displayName: 'Dark',
  description: 'Professional dark theme with high contrast and modern styling',
  colors: {
    // Background colors - based on DarkTheme.html
    bgPrimary: '#0a0e1a',
    bgSecondary: '#111827',
    bgTertiary: '#1f2937',
    bgHeader: '#1f2937',
    bgHeaderGroup: '#111827',

    // Text colors - based on DarkTheme.html
    textPrimary: '#e4e8ee',
    textSecondary: '#9ca3af',
    textHeader: '#f9fafb',

    // Border colors - based on DarkTheme.html
    borderColor: '#374151',
    borderHeader: '#4b5563',

    // Accent colors - based on DarkTheme.html
    accentColor: '#fbbf24',
    hoverBg: 'rgba(251, 191, 36, 0.05)',

    // Shadow colors - based on DarkTheme.html
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
    frozenShadow: '2px 0 4px rgba(0,0,0,0.2)',

    // Badge colors - adapted for dark theme
    badgeGradeA: '#065f46',
    badgeGradeAForeground: '#d1fae5',
    badgeGradeABorder: '#047857',

    badgeGradeB: '#0369a1',
    badgeGradeBForeground: '#e0f2fe',
    badgeGradeBBorder: '#0284c7',

    badgeGradeC: '#b45309',
    badgeGradeCForeground: '#fef3c7',
    badgeGradeCBorder: '#d97706',

    badgeGradeD: '#c2410c',
    badgeGradeDForeground: '#fed7aa',
    badgeGradeDBorder: '#ea580c',

    badgeGradeF: '#dc2626',
    badgeGradeFForeground: '#fee2e2',
    badgeGradeFBorder: '#ef4444',

    badgeNeutral: '#374151',
    badgeNeutralForeground: '#f3f4f6',
    badgeNeutralBorder: '#4b5563',
  },
  typography: {
    fontFamily: {
      primary: FONT_FAMILY_SYSTEM,
      secondary: FONT_FAMILY_INTER,
      mono: FONT_FAMILY_MONO,
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  },
  componentOverrides: {
    table: {
      borderRadius: '0.75rem',
      headerBg: '#1f2937',
      rowHoverBg: 'rgba(251, 191, 36, 0.05)',
      borderColor: '#374151',
      groupHeaderBg: '#111827',
    },
  },
};

export const gitaTheme: ThemeConfiguration = {
  name: 'gita',
  displayName: 'Gita',
  description: 'Spiritual theme inspired by Bhagavad Gita with calming colors',
  colors: {
    // Background colors - spiritual and calming
    bgPrimary: '#fef7ed',
    bgSecondary: '#fff7ed',
    bgTertiary: '#fef3c7',
    bgHeader: '#fef7ed',
    bgHeaderGroup: '#fff7ed',

    // Text colors - warm and readable
    textPrimary: '#9a3412',
    textSecondary: '#c2410c',
    textHeader: '#9a3412',

    // Border colors - warm tones
    borderColor: '#fed7aa',
    borderHeader: '#fdba74',

    // Accent colors - spiritual gold/orange
    accentColor: '#ea580c',
    hoverBg: 'rgba(234, 88, 12, 0.05)',

    // Shadow colors - soft and warm
    shadow: '0 1px 3px 0 rgba(154, 52, 18, 0.1)',
    frozenShadow: '2px 0 4px rgba(154, 52, 18, 0.05)',

    // Badge colors - adapted for spiritual theme
    badgeGradeA: '#d1fae5',
    badgeGradeAForeground: '#065f46',
    badgeGradeABorder: '#a7f3d0',

    badgeGradeB: '#e0f2fe',
    badgeGradeBForeground: '#0369a1',
    badgeGradeBBorder: '#bae6fd',

    badgeGradeC: '#fef3c7',
    badgeGradeCForeground: '#b45309',
    badgeGradeCBorder: '#fde68a',

    badgeGradeD: '#fed7aa',
    badgeGradeDForeground: '#c2410c',
    badgeGradeDBorder: '#fdba74',

    badgeGradeF: '#fee2e2',
    badgeGradeFForeground: '#dc2626',
    badgeGradeFBorder: '#fecaca',

    badgeNeutral: '#f3f4f6',
    badgeNeutralForeground: '#374151',
    badgeNeutralBorder: '#e5e7eb',
  },
  typography: {
    fontFamily: {
      primary: FONT_FAMILY_TIMES,
      secondary: FONT_FAMILY_GEORGIA,
      mono: FONT_FAMILY_MONO,
    },
    fontSize: {
      xs: FONT_SIZE_XS,
      sm: FONT_SIZE_SM,
      base: FONT_SIZE_BASE,
      lg: FONT_SIZE_LG,
      xl: FONT_SIZE_XL,
      '2xl': FONT_SIZE_2XL,
      '3xl': FONT_SIZE_3XL,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(154, 52, 18, 0.05)',
    md: '0 4px 6px -1px rgba(154, 52, 18, 0.1), 0 2px 4px -1px rgba(154, 52, 18, 0.06)',
    lg: '0 10px 15px -3px rgba(154, 52, 18, 0.1), 0 4px 6px -2px rgba(154, 52, 18, 0.05)',
    xl: '0 20px 25px -5px rgba(154, 52, 18, 0.1), 0 10px 10px -5px rgba(154, 52, 18, 0.04)',
  },
  componentOverrides: {
    table: {
      borderRadius: '0.75rem',
      headerBg: '#fef7ed',
      rowHoverBg: 'rgba(234, 88, 12, 0.05)',
      borderColor: '#fed7aa',
      groupHeaderBg: '#fff7ed',
    },
  },
};

export const professionalTheme: ThemeConfiguration = {
  name: 'professional',
  displayName: 'Professional',
  description: 'Corporate theme with blue and gray tones for business environments',
  colors: {
    // Background colors - professional and clean
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    bgHeader: '#ffffff',
    bgHeaderGroup: '#f8fafc',

    // Text colors - professional
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textHeader: '#0f172a',

    // Border colors - subtle
    borderColor: '#e2e8f0',
    borderHeader: '#cbd5e1',

    // Accent colors - professional blue
    accentColor: '#2563eb',
    hoverBg: 'rgba(37, 99, 235, 0.05)',

    // Shadow colors - clean and minimal
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    frozenShadow: '2px 0 4px rgba(0,0,0,0.05)',

    // Badge colors - professional variants
    badgeGradeA: '#d1fae5',
    badgeGradeAForeground: '#065f46',
    badgeGradeABorder: '#a7f3d0',

    badgeGradeB: '#dbeafe',
    badgeGradeBForeground: '#1e40af',
    badgeGradeBBorder: '#bfdbfe',

    badgeGradeC: '#fef3c7',
    badgeGradeCForeground: '#b45309',
    badgeGradeCBorder: '#fde68a',

    badgeGradeD: '#fed7aa',
    badgeGradeDForeground: '#c2410c',
    badgeGradeDBorder: '#fdba74',

    badgeGradeF: '#fee2e2',
    badgeGradeFForeground: '#dc2626',
    badgeGradeFBorder: '#fecaca',

    badgeNeutral: '#f1f5f9',
    badgeNeutralForeground: '#334155',
    badgeNeutralBorder: '#cbd5e1',
  },
  typography: {
    fontFamily: {
      primary: FONT_FAMILY_SYSTEM,
      secondary: FONT_FAMILY_INTER,
      mono: FONT_FAMILY_MONO,
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  componentOverrides: {
    table: {
      borderRadius: '0.75rem',
      headerBg: '#ffffff',
      rowHoverBg: 'rgba(37, 99, 235, 0.05)',
      borderColor: '#e2e8f0',
      groupHeaderBg: '#f8fafc',
    },
  },
};

export const themes: Record<ThemeName, ThemeConfiguration> = {
  default: defaultTheme,
  dark: darkTheme,
  gita: gitaTheme,
  professional: professionalTheme,
};

export const availableThemes: ThemeName[] = ['default', 'dark', 'gita', 'professional'];