/**
 * Date helpers.
 *
 * Anything used during render takes `today` as an explicit argument rather than
 * reading the clock, so a server-rendered page and its hydration can never disagree.
 * `today` comes from the store (seeded by the server, corrected on mount).
 */

/** `YYYY-MM-DD` for a date, in the caller's local calendar. */
export function isoDate(d) {
  const x = new Date(d);
  return [
    x.getFullYear(),
    String(x.getMonth() + 1).padStart(2, '0'),
    String(x.getDate()).padStart(2, '0'),
  ].join('-');
}

export function todayISO() {
  return isoDate(new Date());
}

/** The human label stamped on records, e.g. "Sep 20, 2026". */
export function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Egypt working week = Sun–Thu; weekend is Fri/Sat. */
export function addWorkingDays(dateObj, days) {
  const d = new Date(dateObj);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 5 && dow !== 6) added++;
  }
  return d;
}

/** True when an ISO `YYYY-MM-DD` value is strictly before today. */
export function isPastDate(isoValue, today) {
  return Boolean(isoValue) && isoValue < today;
}

/** Whole days between a record's `lastUpdate` label and today. */
export function daysSinceUpdate(entry, today) {
  if (!entry.lastUpdate) return 999;
  const last = new Date(entry.lastUpdate);
  if (Number.isNaN(last.getTime())) return 999;
  const ref = new Date(today);
  return Math.floor((ref - new Date(isoDate(last))) / (1000 * 60 * 60 * 24));
}
