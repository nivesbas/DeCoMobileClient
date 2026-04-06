export const COLORS = {
  // Brand — aligned with DeCo web frontend
  primary: '#993333',
  primaryDark: '#662222',
  primaryLight: '#B84D4D',

  // Accent
  accent: '#660000',
  accentLight: '#996666',

  // Status
  success: '#2D9D4F',
  warning: '#FFB84D',
  error: '#E63333',
  info: '#0288D1',

  // Neutrals
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#CCCCCC',
  borderLight: '#E0E0E0',

  // Text
  textPrimary: '#262626',
  textSecondary: '#5A5A5A',
  textMuted: '#999999',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#FFFFFF',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#E8E8E8',
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
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 999,
} as const;
