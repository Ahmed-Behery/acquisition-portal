/** Display formatting helpers. Locale is pinned so server and client agree. */

export function initials(name) {
  return String(name || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function fmtMoney(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return 'EGP ' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return 'EGP ' + (n / 1_000).toFixed(0) + 'K';
  return 'EGP ' + n;
}

export function fmtMoneyFull(n) {
  return 'EGP ' + (n || 0).toLocaleString('en-US');
}

/** First name only — used in dashboard greetings. */
export function firstName(name) {
  return String(name || '').split(' ')[0];
}

/** Trims a notification body down to an inbox preview line. */
export function previewText(body, length = 80) {
  return String(body || '')
    .substring(0, length)
    .replace(/\n/g, ' ');
}
