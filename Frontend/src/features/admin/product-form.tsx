'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validations/product';
import type { Product, ProductInput } from '@/types/product';
import { useCreateProductMutation, useUpdateProductMutation } from '@/store/api/adminApi';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api/errors';
export function AdminProductForm({ product, onDone }: { product?: Product; onDone: () => void }) {
  const [create, creation] = useCreateProductMutation();
  const [update, updating] = useUpdateProductMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          description: product.description ?? '',
          price: product.price,
          currency: product.currency,
          stock: product.stock,
          active: product.active,
        }
      : { name: '', sku: '', description: '', price: '', currency: 'INR', stock: 0, active: true },
  });
  return (
    <form
      className="mb-8 grid gap-5 rounded-xl border bg-background p-6 sm:grid-cols-2"
      onSubmit={handleSubmit(async (values) => {
        try {
          if (product) await update({ id: product.id, data: values }).unwrap();
          else await create(values).unwrap();
          onDone();
        } catch {
          /* Form displays sanitized error. */
        }
      })}
      noValidate
    >
      <h2 className="text-xl font-semibold sm:col-span-2">
        {product ? 'Edit product' : 'Create product'}
      </h2>
      {(['name', 'sku', 'price', 'currency', 'stock'] as const).map((field) => (
        <FormField
          id={field}
          key={field}
          label={field === 'sku' ? 'SKU' : field[0].toUpperCase() + field.slice(1)}
          error={errors[field]?.message}
        >
          <Input
            id={field}
            type={field === 'stock' ? 'number' : 'text'}
            aria-invalid={!!errors[field]}
            aria-describedby={errors[field] ? `${field}-error` : undefined}
            {...register(field, field === 'stock' ? { valueAsNumber: true } : {})}
          />
        </FormField>
      ))}
      <FormField id="description" label="Description" error={errors.description?.message}>
        <textarea id="description" className="w-full" {...register('description')} />
      </FormField>
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register('active')} />
        Active product
      </label>
      <div className="flex gap-3 sm:col-span-2">
        <Button disabled={creation.isLoading || updating.isLoading}>Save product</Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {(creation.error || updating.error) && (
        <p role="alert" className="text-destructive sm:col-span-2">
          {apiErrorMessage(creation.error || updating.error)}
        </p>
      )}
    </form>
  );
}
