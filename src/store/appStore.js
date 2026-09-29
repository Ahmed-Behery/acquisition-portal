import { todayISO } from '@/utils/dates';

/**
 * The application store.
 *
 * The original app kept its data in module-level arrays that handlers mutated in
 * place, then wrote the whole snapshot back to the server every couple of seconds.
 * That model is preserved here — a tiny external store with a `mutate()` entry point
 * — for two reasons:
 *
 *  1. every business rule ported across keeps its exact semantics, including the
 *     deep mutations (`entry.interestedFlags.push(...)`, `line.subStatus = ...`);
 *  2. React subscribes through `useSyncExternalStore`, so it stays correct under
 *     concurrent rendering and renders identically on the server.
 *
 * Components never mutate state directly: they call actions from `src/domain`,
 * which receive this store.
 */

/** Slices that are written back to the server. Mirrors the original snapshot(). */
const PERSISTED_KEYS = [
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

const EMPTY_STATE = {
  me: null,
  users: [],
  companies: [],
  products: [],
  bundles: [],
  clients: [],
  pipeline: [],
  notifications: [],
  industries: [],
  egyptCompanies: [],
  recipients: [],
  amlWatchlist: [],
  governorates: [],
  companySizes: [],
  companySizeDefs: [],
  referrals: [],
  adminEmailLog: [],
  smtpConfigured: false,
};

/**
 * Navigation-scoped context that used to live on the old router's `STATE` object.
 * Never persisted — it only has to survive a route change.
 */
const EMPTY_SESSION = {
  reengageCtx: null,
  crossSellCtx: null,
  justCreatedPipeline: null,
  editingDraftId: null,
  draftResume: null,
};

function normalise(payload, today) {
  const state = { ...EMPTY_STATE, ...(payload || {}) };
  // Stagnant status has been retired — any legacy Stagnant merchant is now Active.
  state.clients.forEach((c) => {
    if (c.status === 'Stagnant') c.status = 'Active';
  });
  state.today = today;
  state.session = { ...EMPTY_SESSION };
  return state;
}

export function createAppStore(initialState, today) {
  let state = normalise(initialState, today || todayISO());
  let version = 0;
  const listeners = new Set();

  const emit = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };

  return {
    /** Current state. Treat as read-only outside `mutate`. */
    getState: () => state,

    /** Snapshot key for useSyncExternalStore — bumps on every change. */
    getVersion: () => version,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /**
     * Applies a change. The recipe may mutate `state` in place; anything it returns
     * is handed back to the caller.
     */
    mutate(recipe) {
      const result = recipe(state);
      emit();
      return result;
    },

    /** Replaces everything — used after a fresh /api/state load. */
    hydrate(payload) {
      const session = state.session;
      state = normalise(payload, state.today);
      state.session = session;
      emit();
    },

    /** True once real data is present, so a second hydrate can be skipped. */
    isLoaded: () => Boolean(state.me),

    /** Updates the reference "today" once the client clock is known. */
    setToday(value) {
      if (state.today === value) return;
      state.today = value;
      emit();
    },

    /** The exact payload the server expects on PUT /api/state. */
    snapshot() {
      const out = {};
      PERSISTED_KEYS.forEach((key) => {
        out[key] = state[key];
      });
      return JSON.stringify(out);
    },
  };
}

export { PERSISTED_KEYS };
