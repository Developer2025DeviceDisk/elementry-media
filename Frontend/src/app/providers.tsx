'use client';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import { makeStore } from '@/store';
export default function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  useEffect(() => setupListeners(store.dispatch), [store]);
  return <Provider store={store}>{children}</Provider>;
}
