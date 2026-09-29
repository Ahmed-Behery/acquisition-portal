// In-memory sessions (token -> userId). Lost on restart; users re-login.
// Held on globalThis so Next's dev-time module reloading doesn't sign everyone out.
import crypto from 'crypto';

const globalRef = globalThis;
globalRef.__cgSessions = globalRef.__cgSessions || new Map();

const sessions = globalRef.__cgSessions;

export const SESSION_COOKIE = 'cg_session';

export function newSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, userId);
  return token;
}

export function readSession(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}

export function randomId(prefix, bytes = 4) {
  return prefix + crypto.randomBytes(bytes).toString('hex');
}
