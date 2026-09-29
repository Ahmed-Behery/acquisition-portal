import Head from 'next/head';

const SITE = 'Contact Group · Client & Pipeline Platform';

/**
 * Per-page document metadata.
 *
 * The platform is behind a login, so pages are marked `noindex` — the metadata is
 * there for the browser tab, for shared links inside the organisation, and so the
 * document has a meaningful description rather than the app's generic one.
 */
export default function PageMeta({ title, description }) {
  const fullTitle = title ? `${title} · ${SITE}` : SITE;
  return (
    <Head>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta name="robots" content="noindex, nofollow" />
      <meta property="og:title" content={fullTitle} />
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:type" content="website" />
    </Head>
  );
}
