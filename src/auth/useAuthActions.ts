import { useQueryClient } from '@tanstack/react-query';
import { logout } from '../mock/auth';
import { signedIn, signedOut } from '../app/store';
import { useAppDispatch } from '../hooks/useTypedRedux';

/** Start or end a session. Clearing the query cache on both edges means no screen can ever show the previous user's data. */
export function useAuthActions() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return {
    startSession(token: string) {
      queryClient.clear();
      dispatch(signedIn(token));
    },
    async endSession() {
      await logout();
      dispatch(signedOut('signedOut'));
      queryClient.clear();
    },
  };
}

/** The demo build offers one-click personas; a production build sets VITE_DEMO_MODE=false. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

/** Only follow in-app redirect targets — never an absolute URL or protocol-relative `//host`. */
export const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
