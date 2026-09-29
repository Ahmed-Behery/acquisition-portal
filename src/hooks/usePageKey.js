import { useRouter } from 'next/router';

/**
 * Maps the current route to the page key the original app used.
 *
 * Those keys still drive the topbar title and the sidebar's active state, and they
 * match the keys stored in notification links — so one table keeps routing, titles
 * and persisted data in agreement.
 */
const PAGE_KEY_BY_ROUTE = {
  '/': 'dashboard',
  '/merchants': 'ledger',
  '/merchants/[id]': 'client-detail',
  '/good-to-go': 'good-to-go',
  '/pipeline': 'pipeline',
  '/pipeline/new': 'pipeline-new',
  '/pipeline/[id]': 'pipeline-detail',
  '/companies': 'companies',
  '/companies/[id]': 'company-detail',
  '/catalogue': 'catalogue',
  '/catalogue/[id]': 'product-detail',
  '/bundles': 'bundles',
  '/bundles/[id]': 'bundle-detail',
  '/admin': 'codes',
  '/notifications': 'inbox',
  '/interests': 'interests',
  '/referrals': 'referrals',
};

export function usePageKey() {
  const { pathname } = useRouter();
  return PAGE_KEY_BY_ROUTE[pathname] || '';
}
