/**
 * Typeface configuration.
 *
 * Inter is loaded from Google Fonts with the same preconnect + `display=swap`
 * stylesheet the original used, rendered by `_document.js`.
 *
 * Note on `next/font/google`: it self-hosts the font files and removes the
 * third-party round trip, which is the better default. It fetches them at BUILD
 * time, so it fails on networks that terminate TLS with a private CA (the error is
 * `SELF_SIGNED_CERT_IN_CHAIN`), which is the case here. If you build somewhere with
 * direct egress — or you drop the .woff2 files into the repo and switch to
 * `next/font/local` — move to that and delete the tags below; nothing else in the
 * app needs to change, because everything reads `FONT_FAMILY`.
 */
export const FONT_FAMILY = "'Inter'";

export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';

export const FONT_PRECONNECT = [
  { href: 'https://fonts.googleapis.com' },
  { href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
];
