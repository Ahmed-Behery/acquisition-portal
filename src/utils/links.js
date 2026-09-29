/**
 * Route helpers.
 *
 * The original app was a single URL with an internal `go(page, params)` router.
 * Those page keys are still written into persisted notification `link` fields
 * (e.g. "pipeline-detail/pl4"), so they are kept as the wire format and translated
 * to real Next.js routes here.
 */

export const routes = {
  login: () => '/login',
  dashboard: () => '/',
  ledger: () => '/merchants',
  clientDetail: (id) => `/merchants/${encodeURIComponent(id)}`,
  goodToGo: () => '/good-to-go',
  pipeline: () => '/pipeline',
  pipelineNew: () => '/pipeline/new',
  pipelineDetail: (id) => `/pipeline/${encodeURIComponent(id)}`,
  companies: () => '/companies',
  companyDetail: (id) => `/companies/${encodeURIComponent(id)}`,
  catalogue: () => '/catalogue',
  productDetail: (id) => `/catalogue/${encodeURIComponent(id)}`,
  bundles: () => '/bundles',
  bundleDetail: (id) => `/bundles/${encodeURIComponent(id)}`,
  admin: (tab) => (tab ? `/admin?tab=${encodeURIComponent(tab)}` : '/admin'),
  inbox: () => '/notifications',
  interests: () => '/interests',
  referrals: () => '/referrals',
};

const BY_PAGE_KEY = {
  dashboard: routes.dashboard,
  ledger: routes.ledger,
  'client-detail': routes.clientDetail,
  'good-to-go': routes.goodToGo,
  pipeline: routes.pipeline,
  'pipeline-new': routes.pipelineNew,
  'pipeline-detail': routes.pipelineDetail,
  companies: routes.companies,
  'company-detail': routes.companyDetail,
  catalogue: routes.catalogue,
  'product-detail': routes.productDetail,
  bundles: routes.bundles,
  'bundle-detail': routes.bundleDetail,
  codes: routes.admin,
  inbox: routes.inbox,
  interests: routes.interests,
  referrals: routes.referrals,
};

/** Translates a legacy `"page-key/id"` notification link into an app route. */
export function linkToHref(link) {
  if (!link) return null;
  const [pageKey, id] = String(link).split('/');
  const build = BY_PAGE_KEY[pageKey];
  if (!build) return null;
  return build(id);
}

/** The legacy link format, still written into notifications for compatibility. */
export function legacyLink(pageKey, id) {
  return id ? `${pageKey}/${id}` : pageKey;
}
