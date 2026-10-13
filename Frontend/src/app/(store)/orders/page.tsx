import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
export const metadata: Metadata = { title: 'Your orders', robots: { index: false } };
export default function OrdersPage() {
  redirect('/account/orders');
}
