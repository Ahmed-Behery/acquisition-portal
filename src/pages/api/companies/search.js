import { getStore } from '@/server/db';
import { withAuth, methods } from '@/server/auth';

const RECONCILE_TIMEOUT_MS = 6000;

// Egypt company lookup for the prospect-name dropdown.
// Tries the live OpenCorporates reconciliation API (Egypt jurisdiction); falls
// back to the seeded Egypt company list. Always returns a clean array of names.
export default methods({
  GET: withAuth(async (req, res) => {
    const q = (req.query.q || '').toString().trim();
    const seedList = getStore().data.egyptCompanies || [];

    if (!q) {
      return res.json({
        source: 'seed',
        results: seedList.slice(0, 15).map((c) => ({ name: c.name, crn: c.crn || '', jurisdiction: 'eg' })),
      });
    }

    // 1) Live OpenCorporates reconciliation (Egypt). Token optional via env.
    try {
      const token = process.env.OPENCORPORATES_API_TOKEN;
      const url =
        'https://opencorporates.com/reconcile/eg?query=' +
        encodeURIComponent(q) +
        (token ? '&api_token=' + encodeURIComponent(token) : '');
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), RECONCILE_TIMEOUT_MS);
      const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      clearTimeout(timer);
      if (r.ok) {
        const data = await r.json();
        const results = (data.result || []).slice(0, 10).map((x) => ({
          name: x.name,
          crn: (x.id || '').toString().replace(/^.*\//, ''),
          jurisdiction: 'eg',
          verified: true,
        }));
        if (results.length) return res.json({ source: 'opencorporates', results });
      }
    } catch {
      /* unreachable host, bad response, or timeout — fall through to the seed list */
    }

    // 2) Fallback: filter the seeded Egypt list.
    const ql = q.toLowerCase();
    const results = seedList
      .filter((c) => c.name.toLowerCase().includes(ql))
      .slice(0, 12)
      .map((c) => ({ name: c.name, crn: c.crn || '', jurisdiction: 'eg' }));
    res.json({ source: 'seed', results });
  }),
});
