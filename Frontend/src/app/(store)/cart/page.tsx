import type { Metadata } from 'next';
import { CartPageContent } from '@/features/cart/cart-page';
import { RouteGuard } from '@/lib/auth/route-guard';
export const metadata: Metadata = { title: 'Shopping cart', robots: { index: false } };
export default function CartPage() {
  return (
    <div className="container py-12">
      <h1 className="mb-8 text-3xl font-bold">Your shopping cart</h1>
      <RouteGuard>
        <CartPageContent />
      </RouteGuard>
    </div>
  );
}
