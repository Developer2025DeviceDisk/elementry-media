'use client';
import Link from 'next/link';
import { useGetCartQuery } from '@/store/api/cartApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeCart } from '@/store/slices/cartSlice';
import { env } from '@/config/env';
import { money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingSpinner } from '@/components/common/states';
export function CartPreview() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.cartUi.drawerOpen);
  const { data, isLoading, error, refetch } = useGetCartQuery(undefined, {
    skip: !open || !env.commerce,
  });
  if (!open || !env.commerce) return null;
  return (
    <aside
      aria-label="Cart preview"
      className="fixed top-28 right-4 z-40 w-[calc(100%_-_2rem)] max-w-sm rounded-xl border bg-background p-6 shadow-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Your cart</h2>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Close cart preview"
          onClick={() => dispatch(closeCart())}
        >
          Close
        </Button>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        data && (
          <>
            <p className="text-sm text-muted-foreground" role="status">
              {data.items.reduce((count, item) => count + item.quantity, 0)} items ·{' '}
              {money(data.total, data.currency)}
            </p>
            <Button asChild className="mt-5 w-full">
              <Link href="/cart" onClick={() => dispatch(closeCart())}>
                View your cart
              </Link>
            </Button>
          </>
        )
      )}
    </aside>
  );
}
