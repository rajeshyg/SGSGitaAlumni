import { ThemeConfiguration } from './types';

// CSS Variable mapping for theme injection
export const cssVariableMap = {
  // Background colors
  '--bg-primary': 'colors.bgPrimary',
  '--bg-secondary': 'colors.bgSecondary',
  '--bg-tertiary': 'colors.bgTertiary',
  '--bg-header': 'colors.bgHeader',
  '--bg-header-group': 'colors.bgHeaderGroup',

  // Text colors
  '--text-primary': 'colors.textPrimary',
  '--text-secondary': 'colors.textSecondary',
  '--text-header': 'colors.textHeader',

  // Border colors
  '--border-color': 'colors.borderColor',
  '--border-header': 'colors.borderHeader',

  // Accent colors
  '--accent-color': 'colors.accentColor',
  '--hover-bg': 'colors.hoverBg',

  // Shadow colors
  '--shadow': 'colors.shadow',
  '--frozen-shadow': 'colors.frozenShadow',

  // Table-specific variables (from proven react-web-platform implementation)
  '--table-container': 'colors.bgPrimary',
  '--table-container-elevated': 'colors.bgSecondary',
  '--table-header': 'colors.bgHeader',
  '--table-header-elevated': 'colors.bgHeaderGroup',
  '--table-group-header': 'colors.bgHeaderGroup',
  '--table-group-header-line': 'colors.borderHeader',
  '--table-row': 'colors.bgSecondary',
  '--table-row-hover': 'colors.hoverBg',
  '--table-border': 'colors.borderColor',
  '--table-shadow': 'colors.shadow',
  '--table-shadow-elevated': 'colors.shadow',
  '--table-freeze-shadow': 'colors.frozenShadow',

  // Badge colors
  '--badge-grade-a': 'colors.badgeGradeA',
  '--badge-grade-a-foreground': 'colors.badgeGradeAForeground',
  '--badge-grade-a-border': 'colors.badgeGradeABorder',

  '--badge-grade-b': 'colors.badgeGradeB',
  '--badge-grade-b-foreground': 'colors.badgeGradeBForeground',
  '--badge-grade-b-border': 'colors.badgeGradeBBorder',

  '--badge-grade-c': 'colors.badgeGradeC',
  '--badge-grade-c-foreground': 'colors.badgeGradeCForeground',
  '--badge-grade-c-border': 'colors.badgeGradeCBorder',

  '--badge-grade-d': 'colors.badgeGradeD',
  '--badge-grade-d-foreground': 'colors.badgeGradeDForeground',
  '--badge-grade-d-border': 'colors.badgeGradeDBorder',

  '--badge-grade-f': 'colors.badgeGradeF',
  '--badge-grade-f-foreground': 'colors.badgeGradeFForeground',
  '--badge-grade-f-border': 'colors.badgeGradeFBorder',

  '--badge-neutral': 'colors.badgeNeutral',
  '--badge-neutral-foreground': 'colors.badgeNeutralForeground',
  '--badge-neutral-border': 'colors.badgeNeutralBorder',

  // Typography
  '--font-family-primary': 'typography.fontFamily.primary',
  '--font-family-secondary': 'typography.fontFamily.secondary',
  '--font-family-mono': 'typography.fontFamily.mono',

  '--font-size-xs': 'typography.fontSize.xs',
  '--font-size-sm': 'typography.fontSize.sm',
  '--font-size-base': 'typography.fontSize.base',
  '--font-size-lg': 'typography.fontSize.lg',
  '--font-size-xl': 'typography.fontSize.xl',
  '--font-size-2xl': 'typography.fontSize.2xl',
  '--font-size-3xl': 'typography.fontSize.3xl',

  '--font-weight-normal': 'typography.fontWeight.normal',
  '--font-weight-medium': 'typography.fontWeight.medium',
  '--font-weight-semibold': 'typography.fontWeight.semibold',
  '--font-weight-bold': 'typography.fontWeight.bold',

  '--line-height-tight': 'typography.lineHeight.tight',
  '--line-height-normal': 'typography.lineHeight.normal',
  '--line-height-relaxed': 'typography.lineHeight.relaxed',

  // Spacing
  '--spacing-xs': 'spacing.xs',
  '--spacing-sm': 'spacing.sm',
  '--spacing-md': 'spacing.md',
  '--spacing-lg': 'spacing.lg',
  '--spacing-xl': 'spacing.xl',
  '--spacing-2xl': 'spacing.2xl',
  '--spacing-3xl': 'spacing.3xl',

  // Border radius
  '--radius-none': 'borderRadius.none',
  '--radius-sm': 'borderRadius.sm',
  '--radius-md': 'borderRadius.md',
  '--radius-lg': 'borderRadius.lg',
  '--radius-xl': 'borderRadius.xl',
  '--radius-full': 'borderRadius.full',

  // Shadows
  '--shadow-sm': 'shadows.sm',
  '--shadow-md': 'shadows.md',
  '--shadow-lg': 'shadows.lg',
  '--shadow-xl': 'shadows.xl',
} as const;

// shadcn/ui CSS variable mappings for theme integration
export const shadcnVariableMap = {
  // Background colors
  '--background': 'colors.bgPrimary',
  '--foreground': 'colors.textPrimary',
  '--card': 'colors.bgSecondary',
  '--card-foreground': 'colors.textPrimary',
  '--popover': 'colors.bgSecondary',
  '--popover-foreground': 'colors.textPrimary',
  '--primary': 'colors.accentColor',
  '--primary-foreground': 'colors.bgPrimary',
  '--secondary': 'colors.bgTertiary',
  '--secondary-foreground': 'colors.textPrimary',
  '--muted': 'colors.bgTertiary',
  '--muted-foreground': 'colors.textSecondary',
  '--accent': 'colors.bgTertiary',
  '--accent-foreground': 'colors.textPrimary',
  '--border': 'colors.borderColor',
  '--input': 'colors.borderColor',
  '--ring': 'colors.accentColor',
  // Keep destructive colors static for now (red variants)
  '--destructive': '#dc2626',
  '--destructive-foreground': '#ffffff',
} as const;

// Helper function to get nested object value by path
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper function to convert hex color to HSL format for shadcn/ui
export function hexToHsl(hex: string): string {
  // Remove # if present and validate
  hex = hex.replace('#', '');

  if (hex.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}. Expected 6 characters.`);
  }

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

// Generate CSS variables from theme configuration
export function generateCSSVariables(theme: ThemeConfiguration): Record<string, string> {
  const cssVariables: Record<string, string> = {};

  Object.entries(cssVariableMap).forEach(([cssVar, themePath]) => {
    const value = getNestedValue(theme, themePath);
    if (value !== undefined) {
      cssVariables[cssVar] = value;
    }
  });

  return cssVariables;
}

// Generate shadcn/ui CSS variables from theme configuration
export function generateShadcnVariables(theme: ThemeConfiguration): Record<string, string> {
  const cssVariables: Record<string, string> = {};

  Object.entries(shadcnVariableMap).forEach(([cssVar, themePath]) => {
    const value = getNestedValue(theme, themePath);
    if (value !== undefined) {
      // Convert hex colors to HSL format for shadcn/ui
      if (typeof value === 'string' && value.startsWith('#') && value.length >= 7) {
        try {
          cssVariables[cssVar] = hexToHsl(value);
        } catch {
          // Fallback to original value if HSL conversion fails
          cssVariables[cssVar] = value;
        }
      } else {
        cssVariables[cssVar] = value;
      }
    }
  });

  return cssVariables;
}

// Inject CSS variables into document root
export function injectCSSVariables(theme: ThemeConfiguration): void {
  const cssVariables = generateCSSVariables(theme);
  const shadcnVariables = generateShadcnVariables(theme);
  const root = document.documentElement;

  // Inject custom theme variables
  Object.entries(cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Inject shadcn/ui variables
  Object.entries(shadcnVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

// Remove all theme CSS variables
export function removeCSSVariables(): void {
  const root = document.documentElement;

  // Remove custom theme variables
  Object.keys(cssVariableMap).forEach((property) => {
    root.style.removeProperty(property);
  });

  // Remove shadcn/ui variables
  Object.keys(shadcnVariableMap).forEach((property) => {
    root.style.removeProperty(property);
  });
}