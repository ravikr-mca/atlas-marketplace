import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { setAccessToken } from '../mock/auth';

// Redux holds only *session* state: the access token and why a session ended. Everything
// the API returns — including who "me" is — is owned by TanStack Query (see queryClient.ts
// and src/auth/useSession.ts). Redux never caches server data.
//
// PROTOTYPE SHORTCUT: the token lives in sessionStorage so a refresh keeps you signed in.
// JS-readable storage is exactly what production must NOT do — there the session is an
// httpOnly, Secure, SameSite cookie (Laravel Sanctum SPA auth) the page cannot read.
const TOKEN_KEY = 'atlas-session-token';
const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const writeToken = (token: string | null) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* blocked storage: the session simply won't survive a refresh */
  }
};

export type SessionEndReason = 'expired' | 'signedOut';

const sessionSlice = createSlice({
  name: 'session',
  initialState: { token: readToken(), endedReason: null as SessionEndReason | null },
  reducers: {
    signedIn(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.endedReason = null;
    },
    signedOut(state, action: PayloadAction<SessionEndReason>) {
      state.token = null;
      state.endedReason = action.payload;
    },
  },
});

export const { signedIn, signedOut } = sessionSlice.actions;

export const store = configureStore({ reducer: { session: sessionSlice.reducer } });

// Keep the API client's token and the persisted copy in step with the store.
setAccessToken(store.getState().session.token);
let lastToken = store.getState().session.token;
store.subscribe(() => {
  const { token } = store.getState().session;
  if (token === lastToken) return;
  lastToken = token;
  setAccessToken(token);
  writeToken(token);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
