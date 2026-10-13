'use client';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { env } from '@/config/env';
import { useAddToCartMutation } from '@/store/api/cartApi';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api/errors';
import { useAppDispatch } from '@/store/hooks';
import { openCart } from '@/store/slices/cartSlice';
export function AddToCartButton({
  productId,
  stock,
  variantId,
  disabled,
}: {
  productId: string;
  stock: number;
  variantId?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [add, { isLoading, isSuccess, error }] = useAddToCartMutation();
  async function handleAdd() {
    try {
      await add({ productId, quantity: 1, variantId }).unwrap();
      dispatch(openCart());
    } catch (failure) {
      if (failure && typeof failure === 'object' && 'status' in failure && failure.status === 401)
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }
  return (
    <div>
      <Button
        className="w-full"
        disabled={!env.commerce || stock <= 0 || isLoading || disabled}
        onClick={() => void handleAdd()}
      >
        <ShoppingBag className="size-4" />
        {isLoading ? 'Adding…' : !env.commerce ? 'Purchasing coming soon' : 'Add to cart'}
      </Button>
      {isSuccess && (
        <p role="status" className="mt-2 text-sm text-primary">
          Added to your cart.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {apiErrorMessage(error)}
        </p>
      )}
    </div>
  );
}
