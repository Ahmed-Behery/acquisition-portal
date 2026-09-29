import { withAuth, methods } from '@/server/auth';
import { buildState, persistState } from '@/server/state';

// POST is an alias used by navigator.sendBeacon on page unload.
const saveState = withAuth((req, res) => {
  persistState(req.body || {});
  res.json({ ok: true });
});

export default methods({
  GET: withAuth((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(buildState(req.user));
  }),
  PUT: saveState,
  POST: saveState,
});

export const config = {
  api: {
    // The whole shared snapshot is written in one request; the Express app used the
    // same 4mb ceiling.
    bodyParser: { sizeLimit: '4mb' },
  },
};
