import type { Metadata } from 'next';
import { RouteGuard } from '@/lib/auth/route-guard';
import { Checkout } from '@/features/checkout/checkout';
export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };
export default function CheckoutPage() {
  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      <RouteGuard>
        <Checkout />
      </RouteGuard>
    </div>
  );
}
