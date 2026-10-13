'use client';
import { useState } from 'react';
import { env } from '@/config/env';
import { useDebounce } from '@/hooks/use-debounce';
import { useGetAdminProductsQuery, useDeleteProductMutation } from '@/store/api/adminApi';
import type { Product } from '@/types/product';
import { DataTable } from '@/components/admin/data-table';
import { Pagination } from '@/components/common/pagination';
import { FeatureUnavailable, LoadingSpinner, ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { money } from '@/lib/utils';
import { AdminProductForm } from './product-form';
export function AdminProducts() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const search = useDebounce(q);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const { data, isLoading, isFetching, error, refetch } = useGetAdminProductsQuery(
    { page, limit: 20, q: search },
    { skip: !env.admin },
  );
  const [remove, removing] = useDeleteProductMutation();
  if (!env.admin) return <FeatureUnavailable title="Product management" />;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="w-full max-w-sm">
          <label htmlFor="admin-search" className="sr-only">
            Search products
          </label>
          <Input
            id="admin-search"
            type="search"
            placeholder="Search products"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button onClick={() => setEditing('new')}>Create product</Button>
      </div>
      {editing && (
        <AdminProductForm
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      )}
      {removing.error && <ErrorState error={removing.error} />}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        <DataTable
          rows={data?.data ?? []}
          caption="Products"
          columns={[
            {
              key: 'name',
              header: 'Product',
              cell: (row) => <span className="font-medium">{row.name}</span>,
            },
            { key: 'sku', header: 'SKU', cell: (row) => row.sku },
            { key: 'price', header: 'Price', cell: (row) => money(row.price, row.currency) },
            { key: 'stock', header: 'Stock', cell: (row) => row.stock },
            {
              key: 'actions',
              header: 'Actions',
              cell: (row) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
                    Edit
                  </Button>
                  <ConfirmationDialog
                    title="Delete product?"
                    description={`Remove ${row.name} from the catalog?`}
                    disabled={removing.isLoading}
                    onConfirm={() => {
                      void remove(row.id)
                        .unwrap()
                        .catch(() => undefined);
                    }}
                  >
                    <Button variant="ghost" size="sm">
                      Delete
                    </Button>
                  </ConfirmationDialog>
                </div>
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
