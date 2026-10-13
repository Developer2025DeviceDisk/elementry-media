import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import auth from './slices/authSlice';
import cartUi from './slices/cartSlice';
import checkoutUi from './slices/checkoutSlice';
import ui from './slices/uiSlice';
import filterUi from './slices/filterSlice';
const reducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth,
  cartUi,
  checkoutUi,
  ui,
  filterUi,
});
export function makeStore() {
  return configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });
}
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
