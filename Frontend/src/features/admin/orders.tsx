'use client';
import { useState } from 'react';
import { env } from '@/config/env';
import type { OrderStatus } from '@/types/order';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/adminApi';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/common/pagination';
import { FeatureUnavailable, LoadingSpinner, ErrorState } from '@/components/common/states';
import { money } from '@/lib/utils';
const statuses: OrderStatus[] = ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'];
export function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading, isFetching, error, refetch } = useGetAdminOrdersQuery(
    { page, limit: 20, status: status || undefined },
    { skip: !env.admin },
  );
  const [update, updating] = useUpdateOrderStatusMutation();
  if (!env.admin) return <FeatureUnavailable title="Order management" />;
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="order-filter">Status</label>
        <select
          id="order-filter"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All orders</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>
      {updating.error && <ErrorState error={updating.error} />}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        <DataTable
          caption="Orders"
          rows={data?.data ?? []}
          columns={[
            { key: 'id', header: 'Order', cell: (row) => row.id.slice(0, 8) },
            { key: 'total', header: 'Total', cell: (row) => money(row.total, row.currency) },
            {
              key: 'status',
              header: 'Status',
              cell: (row) => (
                <select
                  aria-label={`Status for order ${row.id.slice(0, 8)}`}
                  value={row.status}
                  disabled={updating.isLoading}
                  onChange={(event) => {
                    const status = event.target.value as OrderStatus;
                    void update({ id: row.id, status })
                      .unwrap()
                      .catch(() => undefined);
                  }}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
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
