import createCache from '@emotion/cache';

/**
 * Emotion cache for MUI.
 *
 * `prepend: true` inserts MUI's styles ahead of the application stylesheet, so a
 * rule in globals.css always wins a specificity tie against a component default.
 * That is what keeps the ported design authoritative.
 */
export default function createEmotionCache() {
  return createCache({ key: 'mui', prepend: true });
}
