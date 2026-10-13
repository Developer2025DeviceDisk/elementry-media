'use client';
import { Heart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useGetCurrentUserQuery } from '@/store/api/authApi';
import { useAddToWishlistMutation } from '@/store/api/wishlistApi';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api/errors';
export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading: loadingSession } = useGetCurrentUserQuery();
  const [add, { isLoading, isSuccess, error }] = useAddToWishlistMutation();
  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        disabled={loadingSession || isLoading || isSuccess}
        onClick={() => {
          if (!data?.user) {
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
          void add(productId)
            .unwrap()
            .catch(() => undefined);
        }}
      >
        <Heart className="size-4" />
        {isSuccess ? 'Saved to wishlist' : 'Save to wishlist'}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {apiErrorMessage(error)}
        </p>
      )}
    </div>
  );
}
