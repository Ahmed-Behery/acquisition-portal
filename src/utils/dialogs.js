/**
 * Native confirmation dialogs.
 *
 * The original platform used `window.alert` / `confirm` / `prompt` throughout, and
 * every workflow depends on their synchronous result. They are kept as-is so the
 * user experience is unchanged, but they are routed through this module so the
 * domain layer never touches `window` directly (which also keeps it SSR-safe and
 * straightforward to stub in tests).
 */
const canPrompt = () => typeof window !== 'undefined';

export const dialogs = {
  alert(message) {
    if (canPrompt()) window.alert(message);
  },
  confirm(message) {
    return canPrompt() ? window.confirm(message) : false;
  },
  /** Returns null when the user cancels — callers rely on that distinction. */
  prompt(message, defaultValue = '') {
    return canPrompt() ? window.prompt(message, defaultValue) : null;
  },
};
