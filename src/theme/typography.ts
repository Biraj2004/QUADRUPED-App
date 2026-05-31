import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const type = StyleSheet.create({

  // Hero display — angle readouts, large stats
  display: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },

  // Screen-level headings
  heading: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },

  // Card titles, section titles
  subheading: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    letterSpacing: 0.1,
    lineHeight: 22,
  },

  // Metadata labels — THE ONLY TOKEN that may use ALL CAPS
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    lineHeight: 16,
  },

  // Button text — sentence case, no tracking
  button: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: 0.1,
    lineHeight: 20,
  },

  // Live numeric values
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },

  // Monospace — connection strings, addresses
  mono: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Hint / caption text
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDisabled,
    lineHeight: 18,
    letterSpacing: 0.1,
  },

});
