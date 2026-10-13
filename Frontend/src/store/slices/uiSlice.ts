import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: false },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
  },
});
export const { toggleSidebar, closeSidebar } = slice.actions;
export default slice.reducer;
