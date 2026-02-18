/**
 * Design System - Color Palette
 * Athletic/Graffiti vibe with vibrant accents
 */

export const colors = {
  // Base colors - Dark theme foundation
  background: {
    primary: '#0A0A0A',     // Deep black
    secondary: '#1A1A1A',   // Card background
    tertiary: '#2A2A2A',    // Elevated surfaces
  },

  // Brand colors - Deep basketball red
  brand: {
    primary: '#960000',     // Brand red - basketball court
    light: '#B71C1C',       // Lighter variant
    dark: '#7A0000',        // Darker variant
  },

  // Primary accent - Red tones
  accent: {
    primary: '#D32F2F',     // Bright red - primary action
    light: '#EF5350',       // Light red
    dark: '#C62828',        // Dark red for pressed states
  },

  // Secondary accent - Complementary teal
  secondary: {
    primary: '#00BCD4',     // Teal - complements red
    light: '#26C6DA',       // Light teal
    dark: '#0097A7',        // Dark teal
  },

  // Court colors - Green for outdoor courts
  court: {
    green: '#43A047',       // Court green
    greenLight: '#66BB6A',  // Light green
    greenDark: '#2E7D32',   // Dark green
  },

  // Vibrant accents (harmonized with red)
  vibrant: {
    cyan: '#00E5FF',        // Electric cyan
    gold: '#FFD700',        // Gold
    orange: '#FF6F00',      // Vibrant orange
  },

  // Semantic colors
  status: {
    active: '#2DD881',      // Someone's here / open
    inactive: '#666666',    // Closed / no one here
    warning: '#FFD600',     // Caution
    error: '#FF4757',       // Error state
    success: '#2DD881',     // Success
  },

  // Text colors with proper contrast
  text: {
    primary: '#FFFFFF',     // White - high contrast
    secondary: '#B3B3B3',   // Medium gray - 70% opacity
    tertiary: '#808080',    // Subtle gray - 50% opacity
    disabled: '#4D4D4D',    // Disabled state - 30% opacity
  },

  // Border colors
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',    // Very subtle
    default: 'rgba(255, 255, 255, 0.12)',   // Default borders
    strong: 'rgba(255, 255, 255, 0.2)',     // Strong borders
    accent: '#FF6B35',                       // Accent border
  },

  // Overlay colors
  overlay: {
    dark: 'rgba(0, 0, 0, 0.6)',
    darker: 'rgba(0, 0, 0, 0.8)',
    light: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

/**
 * Gradient definitions for visual interest
 */
export const gradients = {
  orange: 'linear-gradient(135deg, #FF6B35 0%, #FF8556 100%)',
  green: 'linear-gradient(135deg, #2DD881 0%, #4AE594 100%)',
  purple: 'linear-gradient(135deg, #B75CFF 0%, #9D4FE0 100%)',
  dark: 'linear-gradient(180deg, #1A1A1A 0%, #0A0A0A 100%)',
  glow: 'linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(45, 216, 129, 0.2) 100%)',
} as const;

/**
 * Shadow definitions for depth
 */
export const shadows = {
  sm: '0px 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0px 4px 8px rgba(0, 0, 0, 0.4)',
  lg: '0px 8px 16px rgba(0, 0, 0, 0.5)',
  xl: '0px 12px 24px rgba(0, 0, 0, 0.6)',
  glow: '0px 0px 20px rgba(255, 107, 53, 0.4)',
  glowGreen: '0px 0px 20px rgba(45, 216, 129, 0.4)',
} as const;
