import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
// Session transport metadata only. User data belongs to the getCurrentUser cache.
const initialState: { csrfToken: string | null; sessionExpired: boolean } = {
  csrfToken: null,
  sessionExpired: false,
};
const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCsrfToken(state, action: PayloadAction<string>) {
      state.csrfToken = action.payload;
      state.sessionExpired = false;
    },
    sessionExpired(state) {
      state.csrfToken = null;
      state.sessionExpired = true;
    },
    clearSession() {
      return initialState;
    },
  },
});
export const { setCsrfToken, sessionExpired, clearSession } = slice.actions;
export default slice.reducer;
