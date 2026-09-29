// Session helpers shared by API routes and getServerSideProps.
// Next parses cookies for us (req.cookies), so no cookie-parser dependency is needed.
import { getStore } from './db';
import { SESSION_COOKIE, readSession } from './sessions';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** The signed-in user for a request, or null. */
export function currentUser(req) {
  const userId = readSession(req.cookies && req.cookies[SESSION_COOKIE]);
  if (!userId) return null;
  return getStore().users.find((u) => u.id === userId) || null;
}

export function setSessionCookie(res, token) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${ONE_YEAR}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

/**
 * Wraps an API handler so it only runs for authenticated users.
 * The resolved user is attached as `req.user`, matching the Express original.
 */
export function withAuth(handler) {
  return async (req, res) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    req.user = user;
    return handler(req, res);
  };
}

/** Restricts an API handler to a single role. */
export function withRole(role, handler) {
  return withAuth((req, res) => {
    if (req.user.role !== role) return res.status(403).json({ error: `${role} only.` });
    return handler(req, res);
  });
}

/** Rejects any verb the route does not implement. */
export function methods(map) {
  return (req, res) => {
    const handler = map[req.method];
    if (!handler) {
      res.setHeader('Allow', Object.keys(map).join(', '));
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handler(req, res);
  };
}
