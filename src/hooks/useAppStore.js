import { useContext, useSyncExternalStore } from 'react';
import { AppStoreContext } from '@/store/AppDataProvider';
import { selectMe } from '@/domain/selectors';

/** The store handle plus its lifecycle helpers (`reload`, `reset`, `persist`). */
export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value) throw new Error('useAppStore must be used inside <AppDataProvider>.');
  return value;
}

/**
 * Subscribes to the store and returns the current state.
 *
 * The version counter is the snapshot, so React re-renders on every change while the
 * state object itself stays stable — which is what lets the ported business logic go
 * on mutating in place.
 */
export function useAppState() {
  const { store } = useAppStore();
  useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion);
  return store.getState();
}

/** The signed-in user, or null before the state has loaded. */
export function useCurrentUser() {
  const state = useAppState();
  return selectMe(state);
}

/** The reference calendar date, safe to use during render. */
export function useToday() {
  return useAppState().today;
}
