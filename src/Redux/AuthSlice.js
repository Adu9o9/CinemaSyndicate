

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  session: null,
  loading: true, // Useful for showing splash or loader initially
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      state.loading = false;
    },
    clearSession: (state) => {
      state.user = null;
      state.session = null;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setSession, clearSession, setLoading } = authSlice.actions;
export default authSlice.reducer;
