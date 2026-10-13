'use client';
import { useGetWishlistQuery, useRemoveFromWishlistMutation } from '@/store/api/wishlistApi';
import { ProductCard } from '@/components/product/product-card';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
export function Wishlist() {
  const { data, isLoading, error, refetch } = useGetWishlistQuery();
  const [remove, removing] = useRemoveFromWishlistMutation();
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!data?.length)
    return (
      <EmptyState
        title="Nothing saved yet"
        description="Save products you love to find them again later."
      />
    );
  return (
    <>
      {removing.error && <ErrorState error={removing.error} />}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((product) => (
          <div key={product.id}>
            <ProductCard product={product} />
            <Button
              className="mt-3 w-full"
              variant="outline"
              disabled={removing.isLoading}
              onClick={() => {
                void remove(product.id)
                  .unwrap()
                  .catch(() => undefined);
              }}
            >
              Remove from wishlist
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
