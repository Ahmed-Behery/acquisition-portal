import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { authService } from '@/services/platformService';
import { routes } from '@/utils/links';
import { useAppStore } from './useAppStore';

/** Sign-in, registration and sign-out, with the pending/error state the forms need. */
export function useAuth() {
  const router = useRouter();
  const { reload, reset } = useAppStore();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(null);

  const clearMessage = useCallback(() => setMessage(null), []);

  const submit = useCallback(
    async (request) => {
      setMessage(null);
      setPending(true);
      try {
        await request();
        await reload();
        await router.replace(routes.dashboard());
        return true;
      } catch (error) {
        setMessage({
          text: error.status ? error.message : 'Network error. Please try again.',
          ok: false,
        });
        return false;
      } finally {
        setPending(false);
      }
    },
    [reload, router]
  );

  const signIn = useCallback((credentials) => submit(() => authService.signIn(credentials)), [submit]);
  const register = useCallback((payload) => submit(() => authService.register(payload)), [submit]);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } finally {
      reset();
      router.push(routes.login());
    }
  }, [reset, router]);

  return { signIn, register, signOut, pending, message, setMessage, clearMessage };
}
