'use client';
import { useState } from 'react';
import { env } from '@/config/env';
import { useGetAdminReviewsQuery, useModerateReviewMutation } from '@/store/api/adminApi';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/common/pagination';
import { FeatureUnavailable, LoadingSpinner, ErrorState } from '@/components/common/states';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
export function AdminReviews() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetAdminReviewsQuery(
    { page, limit: 20 },
    { skip: !env.admin },
  );
  const [remove, removal] = useModerateReviewMutation();
  if (!env.admin) return <FeatureUnavailable title="Review moderation" />;
  return (
    <>
      {removal.error && <ErrorState error={removal.error} />}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        <DataTable
          caption="Reviews"
          rows={data?.data ?? []}
          columns={[
            { key: 'author', header: 'Customer', cell: (row) => row.author },
            { key: 'rating', header: 'Rating', cell: (row) => row.rating },
            { key: 'comment', header: 'Review', cell: (row) => row.comment },
            {
              key: 'action',
              header: 'Actions',
              cell: (row) => (
                <ConfirmationDialog
                  title="Remove this review?"
                  description="The review will be removed from the product page."
                  disabled={removal.isLoading}
                  onConfirm={() => {
                    void remove(row.id)
                      .unwrap()
                      .catch(() => undefined);
                  }}
                >
                  <Button variant="outline" size="sm">
                    Remove
                  </Button>
                </ConfirmationDialog>
              ),
            },
          ]}
        />
      )}
      <Pagination
        page={page}
        hasNext={(data?.data.length ?? 0) === 20}
        disabled={isFetching}
        onChange={setPage}
      />
    </>
  );
}
