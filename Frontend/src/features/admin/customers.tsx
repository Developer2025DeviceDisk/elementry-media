'use client';
import { useState } from 'react';
import { env } from '@/config/env';
import { useGetCustomersQuery } from '@/store/api/adminApi';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/common/pagination';
import { FeatureUnavailable, LoadingSpinner, ErrorState } from '@/components/common/states';
export function AdminCustomers() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetCustomersQuery(
    { page, limit: 20 },
    { skip: !env.admin },
  );
  if (!env.admin) return <FeatureUnavailable title="Customer management" />;
  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        <DataTable
          caption="Customers"
          rows={data?.data ?? []}
          columns={[
            { key: 'name', header: 'Name', cell: (row) => row.name },
            { key: 'email', header: 'Email', cell: (row) => row.email },
            { key: 'role', header: 'Role', cell: (row) => row.role },
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
