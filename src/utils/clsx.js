/**
 * Joins class names, dropping anything falsy.
 * Small enough that a dependency would not earn its place.
 */
export function clsx(...parts) {
  return parts.filter(Boolean).join(' ');
}
