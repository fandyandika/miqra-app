export const colors = {
  // Design tokens for Miqra
  primary: '#10b981', // Fresh Green
  primarySoft: '#8DE4C7', // Soft Green
  neutral: '#9E9E9E', // Gray
  barBg: '#FFFFFF', // Tab bar background
  barShadow: 'rgba(0,0,0,0.08)', // Tab bar shadow

  // Legacy colors (keeping for compatibility)
  secondary: '#FF8A65',
  accent: '#FFB627',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  sand: '#FFF8F0',
  text: { primary: '#1A1A1A', secondary: '#666666' },
  textSecondary: '#666666',
  charcoal: '#1A1A1A',
  border: '#E5E5E5',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  tertiary: '#6B7280',
  forest: '#1B5E4F',
  mutedText: '#999999',

  // Additional colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',

  // Dark mode colors
  dark: {
    barBg: '#0E0F10',
    text: '#EDEDED',
    neutral: '#A0A3A6',
  },
} as const;
