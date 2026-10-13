'use client';
import Link from 'next/link';
import type { CartItem as CartItemType } from '@/types/cart';
import { useUpdateCartItemMutation, useRemoveFromCartMutation } from '@/store/api/cartApi';
import { money, productSlug } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
export function CartItem({ item }: { item: CartItemType }) {
  const [update, updating] = useUpdateCartItemMutation();
  const [remove, removing] = useRemoveFromCartMutation();
  const pending = updating.isLoading || removing.isLoading;
  return (
    <article className="flex flex-wrap items-center justify-between gap-4 border-b py-6">
      <div>
        <h2 className="font-semibold">
          <Link href={`/products/${productSlug(item.product)}`}>{item.product.name}</Link>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {money(item.product.price, item.product.currency)} each
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label={`Decrease ${item.product.name} quantity`}
          disabled={pending || item.quantity <= 1}
          onClick={() => {
            void update({ id: item.id, quantity: item.quantity - 1 })
              .unwrap()
              .catch(() => undefined);
          }}
        >
          −
        </Button>
        <span aria-live="polite">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Increase ${item.product.name} quantity`}
          disabled={pending || item.quantity >= item.product.stock}
          onClick={() => {
            void update({ id: item.id, quantity: item.quantity + 1 })
              .unwrap()
              .catch(() => undefined);
          }}
        >
          +
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            void remove(item.id)
              .unwrap()
              .catch(() => undefined);
          }}
        >
          Remove
        </Button>
      </div>
      {(updating.error || removing.error) && (
        <p className="w-full text-sm text-destructive" role="alert">
          {apiErrorMessage(updating.error || removing.error)}
        </p>
      )}
    </article>
  );
}
