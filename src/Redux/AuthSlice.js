

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  name:null,
  session: null,
  loading: true, // Useful for showing splash or loader initially
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload.user;
      state.user = action.payload.user?.user ?? null;
      state.loading = false;
      state.name = action.payload.name
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
