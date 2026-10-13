import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({
  name: 'cartUi',
  initialState: { drawerOpen: false },
  reducers: {
    openCart(state) {
      state.drawerOpen = true;
    },
    closeCart(state) {
      state.drawerOpen = false;
    },
  },
});
export const { openCart, closeCart } = slice.actions;
export default slice.reducer;
