// The full snapshot the app needs after authentication.
// Shared by GET /api/state and by getServerSideProps, so a server-rendered page and
// a client-side reload are always built from exactly the same payload.
import { getStore, publicUser, save } from './db';
import { smtpConfigured } from './mailer';

export function buildState(user) {
  const store = getStore();
  return {
    me: publicUser(user),
    users: store.users.map(publicUser),
    companies: store.data.companies,
    products: store.data.products,
    bundles: store.data.bundles,
    clients: store.data.clients,
    pipeline: store.data.pipeline,
    notifications: store.data.notifications,
    industries: store.data.industries || [],
    egyptCompanies: store.data.egyptCompanies || [],
    recipients: store.data.recipients || [],
    amlWatchlist: store.data.amlWatchlist || [],
    governorates: store.data.governorates || [],
    companySizes: store.data.companySizes || [],
    companySizeDefs: store.data.companySizeDefs || [],
    referrals: store.data.referrals || [],
    adminEmailLog: user.role === 'Admin' ? store.data.adminEmailLog || [] : [],
    smtpConfigured,
  };
}

/** Persists the mutable shared slices. Unknown / non-array keys are ignored. */
export function persistState(body) {
  const store = getStore();
  const writable = [
    'clients',
    'pipeline',
    'notifications',
    'industries',
    'products',
    'egyptCompanies',
    'recipients',
    'amlWatchlist',
    'referrals',
  ];
  writable.forEach((key) => {
    if (Array.isArray(body?.[key])) store.data[key] = body[key];
  });
  save();
}
