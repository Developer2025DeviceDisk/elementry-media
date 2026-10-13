'use client';
import { env } from '@/config/env';
import { useGetReviewsQuery } from '@/store/api/reviewApi';
import { useState } from 'react';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/common/states';
import { Pagination } from '@/components/common/pagination';
import { Rating } from './rating';
export function ReviewList({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useGetReviewsQuery(
    { productId, page },
    { skip: !env.commerce },
  );
  if (!env.commerce) return null;
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-semibold">Customer reviews</h2>
      {data?.data.length ? (
        <div className="space-y-4">
          {data.data.map((review) => (
            <article key={review.id} className="rounded-lg border p-5">
              <div className="flex justify-between">
                <h3 className="font-medium">{review.author}</h3>
                <Rating value={review.rating} />
              </div>
              <p className="mt-3 text-muted-foreground">{review.comment}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No reviews yet" description="Be the first to share your experience." />
      )}
      <Pagination page={page} hasNext={(data?.data.length ?? 0) === 10} onChange={setPage} />
    </section>
  );
}
