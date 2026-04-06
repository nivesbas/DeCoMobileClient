export const COLORS = {
  // Brand
  primary: '#1B4D7A',
  primaryDark: '#0F3255',
  primaryLight: '#2A6DAB',

  // Accent
  accent: '#E8A838',
  accentDark: '#C48A20',

  // Status
  success: '#2E7D32',
  warning: '#ED6C02',
  error: '#D32F2F',
  info: '#0288D1',

  // Neutrals
  background: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E0E4EB',
  borderLight: '#F0F2F5',

  // Text
  textPrimary: '#1A1D26',
  textSecondary: '#5A6070',
  textMuted: '#8E95A5',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#1A1D26',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#E8EBF0',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  title: 34,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
