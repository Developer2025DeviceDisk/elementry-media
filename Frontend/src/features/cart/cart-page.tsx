'use client';
import Link from 'next/link';
import { env } from '@/config/env';
import { useGetCartQuery, useClearCartMutation } from '@/store/api/cartApi';
import { CartItem } from '@/components/cart/cart-item';
import { OrderSummary } from '@/components/checkout/order-summary';
import {
  FeatureUnavailable,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
export function CartPageContent() {
  const { data, isLoading, error, refetch } = useGetCartQuery(undefined, { skip: !env.commerce });
  const [clear, clearing] = useClearCartMutation();
  if (!env.commerce) return <FeatureUnavailable title="Shopping cart" />;
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!data?.items.length)
    return (
      <EmptyState
        title="Your cart is empty"
        description="Explore the collection and find your next essential."
      />
    );
  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {data.items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
          <ConfirmationDialog
            title="Clear your cart?"
            description="All items will be removed from your cart."
            onConfirm={() => {
              void clear()
                .unwrap()
                .catch(() => undefined);
            }}
            disabled={clearing.isLoading}
          >
            <Button variant="ghost" className="mt-5">
              Clear cart
            </Button>
          </ConfirmationDialog>
          {clearing.error && <ErrorState error={clearing.error} />}
        </div>
        <aside>
          <OrderSummary cart={data} />
          <Button asChild className="mt-5 w-full">
            <Link href="/checkout">Continue to checkout</Link>
          </Button>
        </aside>
      </div>
    </>
  );
}
