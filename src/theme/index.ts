/**
 * Design System - Main Export
 */

export * from './colors';
export * from './spacing';

import { colors } from './colors';
import { spacing, radius, fontSize, fontWeight, lineHeight } from './spacing';

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
} as const;

export type Theme = typeof theme;
