import { routes } from '@/utils/links';

/**
 * Sidebar structure and topbar titles.
 *
 * `badge` names a counter computed in the sidebar so the nav data stays declarative.
 */
export const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { key: 'dashboard', icon: '⌂', label: 'Dashboard', href: routes.dashboard() },
      { key: 'inbox', icon: '✉', label: 'Notifications', href: routes.inbox(), badge: 'unread' },
      { key: 'interests', icon: '🎯', label: 'Interests', href: routes.interests(), badge: 'interests' },
    ],
  },
  {
    label: 'Master Ledger',
    items: [
      { key: 'ledger', icon: '▦', label: 'All Merchants', href: routes.ledger() },
      { key: 'good-to-go', icon: '↻', label: 'Good to Go List', href: routes.goodToGo() },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { key: 'pipeline', icon: '▤', label: 'All Pipeline', href: routes.pipeline() },
      { key: 'pipeline-new', icon: '+', label: 'New Entry', href: routes.pipelineNew() },
      { key: 'referrals', icon: '↪', label: 'Department Leads', href: routes.referrals(), badge: 'referrals' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { key: 'companies', icon: '▥', label: 'Companies', href: routes.companies() },
      { key: 'catalogue', icon: '▣', label: 'Product Catalogue', href: routes.catalogue() },
      { key: 'bundles', icon: '◫', label: 'Bundles', href: routes.bundles() },
      { key: 'codes', icon: '⚙', label: 'Admin & Lists', href: routes.admin() },
    ],
  },
];

/** Topbar titles, keyed by the page key each route reports. */
export const PAGE_TITLES = {
  dashboard: 'Dashboard',
  ledger: 'Master Client Ledger',
  'client-detail': 'Client Profile',
  'good-to-go': 'Good to Go List',
  pipeline: 'Pipeline',
  'pipeline-detail': 'Pipeline Entry',
  'pipeline-new': 'New Pipeline Entry',
  companies: 'Group Companies',
  'company-detail': 'Company Profile',
  catalogue: 'Product Catalogue',
  'product-detail': 'Product Details',
  bundles: 'Bundles',
  'bundle-detail': 'Bundle Details',
  codes: 'Admin & Lists',
  inbox: 'Notifications',
  interests: 'Interests',
  referrals: 'Department Leads',
};
