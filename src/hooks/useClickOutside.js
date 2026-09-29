import { useEffect } from 'react';

/**
 * Calls `onOutside` when a click lands outside every referenced element.
 *
 * The original attached a fresh `document` listener on every repaint and never
 * removed them, so listeners accumulated for the life of the page. This binds one
 * listener and cleans it up with the component.
 */
export function useClickOutside(refs, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      const inside = refs.some((ref) => ref.current && ref.current.contains(event.target));
      if (!inside) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
    // `refs` is a stable array of refs created by the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onOutside]);
}
