import { ThemeConfiguration } from './types';

// Common constants to avoid duplicate strings
const COLORS_PREFIX = 'colors.';
const TYPOGRAPHY_PREFIX = 'typography.';
const SPACING_PREFIX = 'spacing.';
const BORDERRADIUS_PREFIX = 'borderRadius.';
const SHADOWS_PREFIX = 'shadows.';

// CSS Variable mapping for theme injection
export const cssVariableMap = {
  // Background colors
  '--bg-primary': `${COLORS_PREFIX}bgPrimary`,
  '--bg-secondary': `${COLORS_PREFIX}bgSecondary`,
  '--bg-tertiary': `${COLORS_PREFIX}bgTertiary`,
  '--bg-header': `${COLORS_PREFIX}bgHeader`,
  '--bg-header-group': `${COLORS_PREFIX}bgHeaderGroup`,

  // Text colors
  '--text-primary': `${COLORS_PREFIX}textPrimary`,
  '--text-secondary': `${COLORS_PREFIX}textSecondary`,
  '--text-header': `${COLORS_PREFIX}textHeader`,

  // Border colors
  '--border-color': `${COLORS_PREFIX}borderColor`,
  '--border-header': `${COLORS_PREFIX}borderHeader`,

  // Accent colors
  '--accent-color': `${COLORS_PREFIX}accentColor`,
  '--hover-bg': `${COLORS_PREFIX}hoverBg`,

  // Shadow colors
  '--shadow': `${COLORS_PREFIX}shadow`,
  '--frozen-shadow': `${COLORS_PREFIX}frozenShadow`,

  // Table-specific variables (from proven react-web-platform implementation)
  '--table-container': `${COLORS_PREFIX}bgPrimary`,
  '--table-container-elevated': `${COLORS_PREFIX}bgSecondary`,
  '--table-header': `${COLORS_PREFIX}bgHeader`,
  '--table-header-elevated': `${COLORS_PREFIX}bgHeaderGroup`,
  '--table-group-header': `${COLORS_PREFIX}bgHeaderGroup`,
  '--table-group-header-line': `${COLORS_PREFIX}borderHeader`,
  '--table-row': `${COLORS_PREFIX}bgSecondary`,
  '--table-row-hover': `${COLORS_PREFIX}hoverBg`,
  '--table-border': `${COLORS_PREFIX}borderColor`,
  '--table-shadow': `${COLORS_PREFIX}shadow`,
  '--table-shadow-elevated': `${COLORS_PREFIX}shadow`,
  '--table-freeze-shadow': `${COLORS_PREFIX}frozenShadow`,

  // Badge colors
  '--badge-grade-a': `${COLORS_PREFIX}badgeGradeA`,
  '--badge-grade-a-foreground': `${COLORS_PREFIX}badgeGradeAForeground`,
  '--badge-grade-a-border': `${COLORS_PREFIX}badgeGradeABorder`,

  '--badge-grade-b': `${COLORS_PREFIX}badgeGradeB`,
  '--badge-grade-b-foreground': `${COLORS_PREFIX}badgeGradeBForeground`,
  '--badge-grade-b-border': `${COLORS_PREFIX}badgeGradeBBorder`,

  '--badge-grade-c': `${COLORS_PREFIX}badgeGradeC`,
  '--badge-grade-c-foreground': `${COLORS_PREFIX}badgeGradeCForeground`,
  '--badge-grade-c-border': `${COLORS_PREFIX}badgeGradeCBorder`,

  '--badge-grade-d': `${COLORS_PREFIX}badgeGradeD`,
  '--badge-grade-d-foreground': `${COLORS_PREFIX}badgeGradeDForeground`,
  '--badge-grade-d-border': `${COLORS_PREFIX}badgeGradeDBorder`,

  '--badge-grade-f': `${COLORS_PREFIX}badgeGradeF`,
  '--badge-grade-f-foreground': `${COLORS_PREFIX}badgeGradeFForeground`,
  '--badge-grade-f-border': `${COLORS_PREFIX}badgeGradeFBorder`,

  '--badge-neutral': `${COLORS_PREFIX}badgeNeutral`,
  '--badge-neutral-foreground': `${COLORS_PREFIX}badgeNeutralForeground`,
  '--badge-neutral-border': `${COLORS_PREFIX}badgeNeutralBorder`,

  // Typography
  '--font-family-primary': `${TYPOGRAPHY_PREFIX}fontFamily.primary`,
  '--font-family-secondary': `${TYPOGRAPHY_PREFIX}fontFamily.secondary`,
  '--font-family-mono': `${TYPOGRAPHY_PREFIX}fontFamily.mono`,

  '--font-size-xs': `${TYPOGRAPHY_PREFIX}fontSize.xs`,
  '--font-size-sm': `${TYPOGRAPHY_PREFIX}fontSize.sm`,
  '--font-size-base': `${TYPOGRAPHY_PREFIX}fontSize.base`,
  '--font-size-lg': `${TYPOGRAPHY_PREFIX}fontSize.lg`,
  '--font-size-xl': `${TYPOGRAPHY_PREFIX}fontSize.xl`,
  '--font-size-2xl': `${TYPOGRAPHY_PREFIX}fontSize.2xl`,
  '--font-size-3xl': `${TYPOGRAPHY_PREFIX}fontSize.3xl`,

  '--font-weight-normal': `${TYPOGRAPHY_PREFIX}fontWeight.normal`,
  '--font-weight-medium': `${TYPOGRAPHY_PREFIX}fontWeight.medium`,
  '--font-weight-semibold': `${TYPOGRAPHY_PREFIX}fontWeight.semibold`,
  '--font-weight-bold': `${TYPOGRAPHY_PREFIX}fontWeight.bold`,

  '--line-height-tight': `${TYPOGRAPHY_PREFIX}lineHeight.tight`,
  '--line-height-normal': `${TYPOGRAPHY_PREFIX}lineHeight.normal`,
  '--line-height-relaxed': `${TYPOGRAPHY_PREFIX}lineHeight.relaxed`,

  // Spacing
  '--spacing-xs': `${SPACING_PREFIX}xs`,
  '--spacing-sm': `${SPACING_PREFIX}sm`,
  '--spacing-md': `${SPACING_PREFIX}md`,
  '--spacing-lg': `${SPACING_PREFIX}lg`,
  '--spacing-xl': `${SPACING_PREFIX}xl`,
  '--spacing-2xl': `${SPACING_PREFIX}2xl`,
  '--spacing-3xl': `${SPACING_PREFIX}3xl`,

  // Border radius
  '--radius-none': `${BORDERRADIUS_PREFIX}none`,
  '--radius-sm': `${BORDERRADIUS_PREFIX}sm`,
  '--radius-md': `${BORDERRADIUS_PREFIX}md`,
  '--radius-lg': `${BORDERRADIUS_PREFIX}lg`,
  '--radius-xl': `${BORDERRADIUS_PREFIX}xl`,
  '--radius-full': `${BORDERRADIUS_PREFIX}full`,

  // Shadows
  '--shadow-sm': `${SHADOWS_PREFIX}sm`,
  '--shadow-md': `${SHADOWS_PREFIX}md`,
  '--shadow-lg': `${SHADOWS_PREFIX}lg`,
  '--shadow-xl': `${SHADOWS_PREFIX}xl`,
} as const;

// shadcn/ui CSS variable mappings for theme integration
export const shadcnVariableMap = {
  // Background colors
  '--background': `${COLORS_PREFIX}bgPrimary`,
  '--foreground': `${COLORS_PREFIX}textPrimary`,
  '--card': `${COLORS_PREFIX}bgSecondary`,
  '--card-foreground': `${COLORS_PREFIX}textPrimary`,
  '--popover': `${COLORS_PREFIX}bgSecondary`,
  '--popover-foreground': `${COLORS_PREFIX}textPrimary`,
  '--primary': `${COLORS_PREFIX}accentColor`,
  '--primary-foreground': `${COLORS_PREFIX}bgPrimary`,
  '--secondary': `${COLORS_PREFIX}bgTertiary`,
  '--secondary-foreground': `${COLORS_PREFIX}textPrimary`,
  '--muted': `${COLORS_PREFIX}bgTertiary`,
  '--muted-foreground': `${COLORS_PREFIX}textSecondary`,
  '--accent': `${COLORS_PREFIX}bgTertiary`,
  '--accent-foreground': `${COLORS_PREFIX}textPrimary`,
  '--border': `${COLORS_PREFIX}borderColor`,
  '--input': `${COLORS_PREFIX}borderColor`,
  '--ring': `${COLORS_PREFIX}accentColor`,
  // Keep destructive colors static for now (red variants)
  '--destructive': '#dc2626',
  '--destructive-foreground': '#ffffff',
} as const;

// Helper function to get nested object value by path
export function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
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
    if (value !== undefined && typeof value === 'string') {
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
    if (value !== undefined && typeof value === 'string') {
      // Convert hex colors to HSL format for shadcn/ui
      if (value.startsWith('#') && value.length >= 7) {
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