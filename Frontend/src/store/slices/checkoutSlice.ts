import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Address } from '@/types/cart';
interface CheckoutState {
  step: 'address' | 'shipping' | 'payment';
  address: Address | null;
  shippingMethod: string;
}
const initialState: CheckoutState = { step: 'address', address: null, shippingMethod: 'standard' };
const slice = createSlice({
  name: 'checkoutUi',
  initialState,
  reducers: {
    setAddress(state, action: PayloadAction<Address>) {
      state.address = action.payload;
      state.step = 'shipping';
    },
    setShipping(state, action: PayloadAction<string>) {
      state.shippingMethod = action.payload;
      state.step = 'payment';
    },
    setStep(state, action: PayloadAction<CheckoutState['step']>) {
      state.step = action.payload;
    },
    resetCheckout() {
      return initialState;
    },
  },
});
export const { setAddress, setShipping, setStep, resetCheckout } = slice.actions;
export default slice.reducer;
