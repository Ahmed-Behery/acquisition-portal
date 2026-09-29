import { api } from './apiClient';

/** Server calls the app makes. One place to change if the transport ever changes. */

export const authService = {
  signIn: (credentials) => api.post('/api/login', credentials),
  register: (payload) => api.post('/api/register', payload),
  signOut: () => api.post('/api/logout'),
  me: () => api.get('/api/me'),
};

export const stateService = {
  load: () => api.get('/api/state'),

  /** Sends the serialised snapshot straight through — it is already JSON. */
  async save(snapshotJson) {
    const res = await fetch('/api/state', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: snapshotJson,
    });
    if (!res.ok) throw new Error('Could not save state.');
    return true;
  },

  /** Best-effort write on page unload; `sendBeacon` survives the navigation. */
  saveOnUnload(snapshotJson) {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false;
    return navigator.sendBeacon(
      '/api/state',
      new Blob([snapshotJson], { type: 'application/json' })
    );
  },
};

export const directoryService = {
  searchCompanies: (query, signal) =>
    api.get(`/api/companies/search?q=${encodeURIComponent(query)}`, { signal }),
};

export const adminService = {
  createRecipient: (payload) => api.post('/api/users', payload),
  notifyAdmin: (subject, body) =>
    api.post('/api/notify-admin', { subject, body }).catch(() => ({ ok: false })),
};
