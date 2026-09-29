import { useCallback, useState } from 'react';

/**
 * List filters that survive navigating away and back, as they did in the original
 * (where they lived in module-level objects for the lifetime of the page).
 *
 * The cache is only read and written in the browser: on the server the module is
 * shared between requests, so seeding from it could leak one user's filters into
 * another's page — and a full page load always starts with an empty cache anyway,
 * which keeps server and client markup identical.
 */
const cache = new Map();

export function useSessionFilters(key, initial) {
  const [filters, setFilters] = useState(() =>
    typeof window === 'undefined' ? initial : cache.get(key) || initial
  );

  const update = useCallback(
    (patch) =>
      setFilters((previous) => {
        const next = { ...previous, ...patch };
        cache.set(key, next);
        return next;
      }),
    [key]
  );

  return [filters, update];
}
