'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { env } from '@/config/env';
import { categorySchema } from '@/lib/validations/product';
import { useGetAdminCategoriesQuery, useCreateCategoryMutation } from '@/store/api/adminApi';
import { DataTable } from '@/components/admin/data-table';
import { FeatureUnavailable, LoadingSpinner, ErrorState } from '@/components/common/states';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function AdminCategories() {
  const { data, isLoading, error, refetch } = useGetAdminCategoriesQuery(undefined, {
    skip: !env.admin,
  });
  const [create, creation] = useCreateCategoryMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string; slug: string }>({ resolver: zodResolver(categorySchema) });
  if (!env.admin) return <FeatureUnavailable title="Category management" />;
  return (
    <>
      <form
        className="mb-8 grid gap-4 rounded-xl border bg-background p-6 sm:grid-cols-3"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          try {
            await create(values).unwrap();
            reset();
          } catch {
            /* Handled below. */
          }
        })}
      >
        {(['name', 'slug'] as const).map((field) => (
          <FormField
            key={field}
            id={field}
            label={field === 'name' ? 'Category name' : 'URL slug'}
            error={errors[field]?.message}
          >
            <Input
              id={field}
              aria-invalid={!!errors[field]}
              aria-describedby={errors[field] ? `${field}-error` : undefined}
              {...register(field)}
            />
          </FormField>
        ))}
        <Button className="self-end" disabled={creation.isLoading}>
          Create category
        </Button>
      </form>
      {creation.error && <ErrorState error={creation.error} />}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        <DataTable
          caption="Categories"
          rows={data ?? []}
          columns={[
            { key: 'name', header: 'Category', cell: (row) => row.name },
            { key: 'slug', header: 'Slug', cell: (row) => row.slug },
          ]}
        />
      )}
    </>
  );
}
