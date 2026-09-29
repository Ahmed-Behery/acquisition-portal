import { createTheme } from '@mui/material/styles';
import { colors, radii, shadows, typography as tokens } from './tokens';

/**
 * MUI theme built from the same tokens the stylesheet uses.
 *
 * Scope note: the original UI is a hand-written stylesheet, and it is the source of
 * truth for the look. MUI is used where it adds behaviour the original lacked
 * (portalled + focus-trapped modals) and as the shared token source for `sx`. Plain
 * elements keep their original classes so nothing shifts by a pixel — MUI's own
 * component styling is deliberately not layered on top of them.
 */
export function createAppTheme(fontFamily) {
  const family = fontFamily ? `${fontFamily}, ${tokens.fallbackStack}` : `'Inter', ${tokens.fallbackStack}`;

  return createTheme({
    cssVariables: false,
    palette: {
      mode: 'light',
      common: { black: colors.ink, white: colors.surface },
      primary: { main: colors.primary, dark: colors.primaryDark, light: colors.primarySoft, contrastText: '#fff' },
      success: { main: colors.green, light: colors.greenSoft, contrastText: '#fff' },
      warning: { main: colors.yellow, light: colors.yellowSoft, contrastText: '#fff' },
      error: { main: colors.red, light: colors.redSoft, contrastText: '#fff' },
      info: { main: colors.primary, light: colors.primarySoft, contrastText: '#fff' },
      text: { primary: colors.ink, secondary: colors.inkSoft, disabled: colors.inkMuted },
      divider: colors.line,
      background: { default: colors.bg, paper: colors.surface },
      // Named extras so components can read the palette instead of repeating hex codes.
      surfaceAlt: colors.surfaceAlt,
      lineStrong: colors.lineStrong,
      inkMuted: colors.inkMuted,
      accent: {
        orange: colors.orange,
        orangeSoft: colors.orangeSoft,
        purple: colors.purple,
        purpleSoft: colors.purpleSoft,
      },
    },
    shape: { borderRadius: parseInt(radii.base, 10) },
    typography: {
      fontFamily: family,
      fontSize: tokens.baseSize,
      htmlFontSize: 16,
      button: { textTransform: 'none', fontWeight: 500, fontSize: 13 },
      h1: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontSize: 18, fontWeight: 700 },
      h3: { fontSize: 15, fontWeight: 600 },
      body1: { fontSize: 14 },
      body2: { fontSize: 13 },
      caption: { fontSize: 12, color: colors.inkMuted },
    },
    shadows: ['none', shadows.base, shadows.md, ...Array(22).fill(shadows.md)],
    components: {
      MuiModal: {
        defaultProps: {
          // The `.modal-bg` element already paints the scrim, so MUI's backdrop is
          // redundant — dropping it keeps the original markup and visuals exactly.
          hideBackdrop: true,
          closeAfterTransition: false,
        },
      },
    },
  });
}

export const theme = createAppTheme();
export default theme;
