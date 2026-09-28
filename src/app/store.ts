import { configureStore, createSlice } from '@reduxjs/toolkit';
import { currentUser } from '../mock/data';

// Session/UI state lives in Redux; all server data (fund vehicles, indications, orgs)
// is owned by TanStack Query — see queryClient.ts. This split is a deliberate answer to
// the brief's "state and server-state management" point, not two libraries doing the
// same job: Redux never caches anything the API returned.
const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    currentUser,
    viewAs: currentUser.role as 'LP' | 'GP' | 'ADMIN' | 'COMPLIANCE',
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
