import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAppStore } from './useAppStore';
import * as pipelineActions from '@/domain/actions/pipelineActions';
import * as hopActions from '@/domain/actions/hopActions';
import * as interestActions from '@/domain/actions/interestActions';
import * as clientActions from '@/domain/actions/clientActions';
import * as referralActions from '@/domain/actions/referralActions';
import * as adminActions from '@/domain/actions/adminActions';

const MODULES = {
  pipeline: pipelineActions,
  hop: hopActions,
  interest: interestActions,
  client: clientActions,
  referral: referralActions,
  admin: adminActions,
};

/**
 * Binds every domain action to the store and to the router.
 *
 * Actions return `{ navigate }` when the original code called `go(...)`; this hook
 * performs that navigation so components stay free of routing details.
 *
 *   const actions = useActions();
 *   actions.pipeline.applyStageChange(entryId, 'Negotiation C1');
 */
export function useActions() {
  const { store } = useAppStore();
  const router = useRouter();

  return useMemo(() => {
    const bindModule = (moduleExports) =>
      Object.fromEntries(
        Object.entries(moduleExports).map(([name, fn]) => [
          name,
          (...args) => {
            const result = fn(store, ...args);
            if (result && result.navigate) router.push(result.navigate);
            return result;
          },
        ])
      );

    return Object.fromEntries(Object.entries(MODULES).map(([key, mod]) => [key, bindModule(mod)]));
  }, [store, router]);
}
