'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useGetCustomerReturnsQuery } from '@/store/api/accountApi';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { Pagination } from '@/components/common/pagination';
import { money } from '@/lib/utils';
import { statusLabel } from './orders';

export function AccountReturns() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetCustomerReturnsQuery(
    { page, limit: 10 },
    { pollingInterval: 30000, skipPollingIfUnfocused: true },
  );
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Returns and Refunds</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Request a return from the order details page. Follow its review and refund status here.
        </p>
        <Link href="/account/orders" className="mt-3 inline-block text-sm font-medium text-primary">
          Find an order
        </Link>
      </div>
      {data?.data.length ? (
        <div className="space-y-4">
          {data.data.map((record) => (
            <article key={record.id} className="rounded-2xl border p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/account/orders/${record.orderId}`}
                  className="font-semibold text-primary"
                >
                  Order #{record.orderId.slice(0, 8).toUpperCase()}
                </Link>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                  {statusLabel(record.status)}
                </span>
              </div>
              <p className="mt-4 text-sm">{record.reason}</p>
              {record.reviewNote && (
                <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">{record.reviewNote}</p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Requested {new Date(record.createdAt).toLocaleDateString()} · Updated{' '}
                {new Date(record.updatedAt).toLocaleDateString()}
              </p>
              {record.refundAmount !== null && (
                <p className="mt-3 text-sm font-medium">
                  {record.status === 'REFUNDED' ? 'Refund recorded' : 'Refund pending'}:{' '}
                  {money(record.refundAmount, record.currency)}
                </p>
              )}
              {record.refundReference && (
                <p className="mt-2 break-all text-xs text-muted-foreground">
                  Refund reference: {record.refundReference}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No return requests"
          description="Any returns you request will be listed here, together with their refund records."
        />
      )}
      <Pagination
        page={page}
        hasNext={page * 10 < (data?.total ?? 0)}
        disabled={isFetching}
        onChange={setPage}
      />
    </div>
  );
}
