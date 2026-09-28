import { configureStore, createSlice } from '@reduxjs/toolkit';
import { currentUser } from '../mock/data';
import type { UserRole } from '../types/entities';

// Session/UI state lives in Redux; all server data (fund vehicles, indications, orgs)
// is owned by TanStack Query — see queryClient.ts. This split is a deliberate answer to
// the brief's "state and server-state management" point, not two libraries doing the
// same job: Redux never caches anything the API returned.
const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    currentUser,
    // "Viewing as" is deliberately decoupled from `currentUser` — this prototype has no
    // real multi-org auth, so switching this lens is how the demo shows GP vs LP vs
    // Admin dashboards without building full sign-in/sign-out.
    viewAs: currentUser.role as UserRole,
  },
  reducers: {
    setViewAs(state, action: { payload: typeof state.viewAs }) {
      state.viewAs = action.payload;
    },
  },
});

export const { setViewAs } = sessionSlice.actions;

export const store = configureStore({
  reducer: {
    session: sessionSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type SessionState = RootState['session'];
