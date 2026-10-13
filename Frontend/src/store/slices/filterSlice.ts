import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
// URL parameters own applied filters. This slice holds only the mobile panel's UI state.
const slice = createSlice({
  name: 'filterUi',
  initialState: { panelOpen: false },
  reducers: {
    setFilterPanelOpen(state, action: PayloadAction<boolean>) {
      state.panelOpen = action.payload;
    },
  },
});
export const { setFilterPanelOpen } = slice.actions;
export default slice.reducer;
