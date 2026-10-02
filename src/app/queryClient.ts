import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { isApiError } from '../mock/errors';
import { signedOut, store } from './store';

// One place decides what a 401 means: the session is gone, so drop it. RequireAuth sees
// the empty session and sends the user to /login with the reason — no screen has to
// handle expiry itself.
function onError(error: unknown) {
  if (isApiError(error) && (error.code === 'SESSION_EXPIRED' || error.code === 'UNAUTHENTICATED') && store.getState().session.token) {
    store.dispatch(signedOut('expired'));
    queryClient.clear();
  }
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying a 401/403/404/409/422 can't succeed; only retry what might be transient.
      retry: (failureCount, error) => !isApiError(error) && failureCount < 1,
    },
  },
});
