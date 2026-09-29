/**
 * Single source of truth for the design tokens.
 *
 * These are the exact values from the original stylesheet's `:root` block. They are
 * emitted as CSS custom properties by `_document.js` (so every rule in globals.css
 * keeps working unchanged) and consumed by the MUI theme, so JS and CSS can never
 * drift apart.
 */
export const colors = {
  bg: '#f4f6f9',
  surface: '#ffffff',
  surfaceAlt: '#f9fafc',
  ink: '#1a2332',
  inkSoft: '#4a5568',
  inkMuted: '#718096',
  line: '#e2e8f0',
  lineStrong: '#cbd5e0',
  primary: '#1e40af',
  primarySoft: '#dbeafe',
  primaryDark: '#1e3a8a',
  green: '#15803d',
  greenSoft: '#dcfce7',
  orange: '#c2410c',
  orangeSoft: '#ffedd5',
  red: '#b91c1c',
  redSoft: '#fee2e2',
  purple: '#6b21a8',
  purpleSoft: '#f3e8ff',
  yellow: '#a16207',
  yellowSoft: '#fef3c7',
};

export const radii = {
  base: '8px',
  control: '6px',
  input: '5px',
  modal: '10px',
  pill: '999px',
};

export const shadows = {
  base: '0 1px 3px rgba(15,20,30,.06), 0 1px 2px rgba(15,20,30,.04)',
  md: '0 4px 12px rgba(15,20,30,.08)',
};

export const typography = {
  baseSize: 14,
  fallbackStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/** CSS custom properties, keyed exactly as the original stylesheet declared them. */
export const cssVariables = {
  '--bg': colors.bg,
  '--surface': colors.surface,
  '--surface-alt': colors.surfaceAlt,
  '--ink': colors.ink,
  '--ink-soft': colors.inkSoft,
  '--ink-muted': colors.inkMuted,
  '--line': colors.line,
  '--line-strong': colors.lineStrong,
  '--primary': colors.primary,
  '--primary-soft': colors.primarySoft,
  '--primary-dark': colors.primaryDark,
  '--green': colors.green,
  '--green-soft': colors.greenSoft,
  '--orange': colors.orange,
  '--orange-soft': colors.orangeSoft,
  '--red': colors.red,
  '--red-soft': colors.redSoft,
  '--purple': colors.purple,
  '--purple-soft': colors.purpleSoft,
  '--yellow': colors.yellow,
  '--yellow-soft': colors.yellowSoft,
  '--radius': radii.base,
  '--shadow': shadows.base,
  '--shadow-md': shadows.md,
};

export function cssVariablesBlock(selector = ':root') {
  const body = Object.entries(cssVariables)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
  return `${selector}{${body}}`;
}
