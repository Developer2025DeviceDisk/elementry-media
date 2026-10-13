'use client';
import { useState } from 'react';
import { env } from '@/config/env';
import { useGetAdminProductsQuery, useUpdateInventoryMutation } from '@/store/api/adminApi';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/common/pagination';
import { FeatureUnavailable, LoadingSpinner, ErrorState } from '@/components/common/states';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function AdminInventory() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetAdminProductsQuery(
    { page, limit: 20 },
    { skip: !env.admin },
  );
  const [update, updating] = useUpdateInventoryMutation();
  if (!env.admin) return <FeatureUnavailable title="Inventory management" />;
  return (
    <>
      {updating.error && <ErrorState error={updating.error} />}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        <DataTable
          caption="Inventory"
          rows={data?.data ?? []}
          columns={[
            { key: 'name', header: 'Product', cell: (row) => row.name },
            { key: 'stock', header: 'Available stock', cell: (row) => row.stock },
            {
              key: 'update',
              header: 'Update stock',
              cell: (row) => (
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const stock = Number(new FormData(event.currentTarget).get('stock'));
                    if (Number.isInteger(stock) && stock >= 0)
                      void update({ id: row.id, stock })
                        .unwrap()
                        .catch(() => undefined);
                  }}
                >
                  <Input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={row.stock}
                    aria-label={`Stock for ${row.name}`}
                    className="w-24"
                  />
                  <Button size="sm" disabled={updating.isLoading}>
                    Save
                  </Button>
                </form>
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
