import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAppStore } from './appStore';
import { stateService } from '@/services/platformService';
import { checkContactSLAs } from '@/domain/actions/interestActions';
import { todayISO } from '@/utils/dates';

export const AppStoreContext = createContext(null);

/** How long to wait after the last change before writing the snapshot back. */
const PERSIST_DEBOUNCE_MS = 600;
/** Safety net, matching the original app's periodic save. */
const PERSIST_INTERVAL_MS = 2500;

/**
 * Owns the application store for the whole session.
 *
 * Data arrives one of two ways:
 *  · server-rendered — `initialState` comes from getServerSideProps on a full page
 *    load, so the first paint already has real content (no loading flash, and the
 *    markup is indexable);
 *  · client-side — after signing in, or if a page was reached without a payload.
 *
 * In-app navigations deliberately do NOT re-fetch: the store is the live copy of the
 * shared state and may hold changes that have not been flushed yet.
 */
export default function AppDataProvider({ initialState, initialToday, children }) {
  const [store] = useState(() => createAppStore(initialState, initialToday || todayISO()));
  const lastSaved = useRef(store.isLoaded() ? store.snapshot() : null);
  const slaChecked = useRef(false);

  const persist = useCallback(async () => {
    if (!store.isLoaded()) return;
    const current = store.snapshot();
    if (current === lastSaved.current) return;
    const previous = lastSaved.current;
    lastSaved.current = current; // optimistic — avoids duplicate concurrent writes
    try {
      await stateService.save(current);
    } catch {
      lastSaved.current = previous; // allow a retry on the next change
    }
  }, [store]);

  /**
   * Escalates any interest flag that blew its contact SLA — once per signed-in
   * session, exactly as the original did right after loading state.
   */
  const runSlaCheck = useCallback(() => {
    if (slaChecked.current || !store.isLoaded()) return;
    slaChecked.current = true;
    checkContactSLAs(store, store.getState().today);
  }, [store]);

  /** Loads a fresh snapshot from the server and adopts it wholesale. */
  const reload = useCallback(async () => {
    const payload = await stateService.load();
    store.hydrate(payload);
    lastSaved.current = store.snapshot();
    slaChecked.current = false; // a different user may be signing in
    runSlaCheck();
    return payload;
  }, [store, runSlaCheck]);

  /** Drops every trace of the signed-in user (used on sign out). */
  const reset = useCallback(() => {
    store.hydrate(null);
    lastSaved.current = null;
    slaChecked.current = false;
  }, [store]);

  // Adopt a server-rendered payload the first time one arrives, then run the SLA
  // sweep. When the page was server-rendered the store already holds the payload,
  // so this also covers that case on mount.
  useEffect(() => {
    if (initialState && !store.isLoaded()) {
      store.hydrate(initialState);
      lastSaved.current = store.snapshot();
    }
    runSlaCheck();
  }, [initialState, store, runSlaCheck]);

  // The server seeds "today" so SSR and hydration agree; the client's own calendar
  // date takes over once mounted.
  useEffect(() => {
    store.setToday(todayISO());
  }, [store]);

  // Write-back: debounced on change, with a periodic sweep and an unload beacon so a
  // change can never be lost.
  useEffect(() => {
    let timer = null;
    const unsubscribe = store.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(persist, PERSIST_DEBOUNCE_MS);
    });
    const interval = setInterval(persist, PERSIST_INTERVAL_MS);

    // Flush whatever is still pending when the page goes away. `beforeunload` alone
    // is unreliable (it never fires on a backgrounded mobile tab, and browsers skip
    // it for bfcache navigations), so `pagehide` and the hidden `visibilitychange`
    // cover the cases it misses. `sendBeacon` survives the navigation; the snapshot
    // comparison keeps the extra listeners from sending anything twice.
    const flush = () => {
      if (!store.isLoaded()) return;
      const current = store.snapshot();
      if (current === lastSaved.current) return;
      if (stateService.saveOnUnload(current)) lastSaved.current = current;
    };
    const flushIfHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flushIfHidden);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flushIfHidden);
    };
  }, [store, persist]);

  const value = useMemo(() => ({ store, reload, reset, persist }), [store, reload, reset, persist]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}
