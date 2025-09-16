// Theme System Type Definitions
// Based on professional data table styling and DarkTheme.html reference

export interface ColorPalette {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHeader: string;
  bgHeaderGroup: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textHeader: string;

  // Border colors
  borderColor: string;
  borderHeader: string;

  // Accent colors
  accentColor: string;
  hoverBg: string;

  // Shadow colors
  shadow: string;
  frozenShadow: string;

  // Badge colors for different grades/statuses
  badgeGradeA: string;
  badgeGradeAForeground: string;
  badgeGradeABorder: string;

  badgeGradeB: string;
  badgeGradeBForeground: string;
  badgeGradeBBorder: string;

  badgeGradeC: string;
  badgeGradeCForeground: string;
  badgeGradeCBorder: string;

  badgeGradeD: string;
  badgeGradeDForeground: string;
  badgeGradeDBorder: string;

  badgeGradeF: string;
  badgeGradeFForeground: string;
  badgeGradeFBorder: string;

  badgeNeutral: string;
  badgeNeutralForeground: string;
  badgeNeutralBorder: string;
}

export interface TypographySystem {
  fontFamily: {
    primary: string;
    secondary: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface SpacingSystem {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface BorderRadiusSystem {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ShadowSystem {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ComponentOverrides {
  button?: {
    borderRadius?: string;
    padding?: string;
    fontSize?: string;
  };
  card?: {
    borderRadius?: string;
    padding?: string;
    shadow?: string;
  };
  input?: {
    borderRadius?: string;
    padding?: string;
    borderColor?: string;
  };
  table?: {
    borderRadius?: string;
    headerBg?: string;
    rowHoverBg?: string;
    borderColor?: string;
    groupHeaderBg?: string;
  };
}

export interface ThemeConfiguration {
  name: string;
  displayName: string;
  description: string;
  colors: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingSystem;
  borderRadius: BorderRadiusSystem;
  shadows: ShadowSystem;
  componentOverrides?: ComponentOverrides;
}

export type ThemeName = 'default' | 'dark' | 'gita' | 'professional';

export interface ThemeContextType {
  currentTheme: ThemeName;
  theme: ThemeConfiguration;
  setTheme: (_theme: ThemeName) => void;
  availableThemes: ThemeName[];
}