'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { env } from '@/config/env';
import { couponSchema } from '@/lib/validations/coupon';
import { useGetCouponsQuery, useCreateCouponMutation } from '@/store/api/adminApi';
import { DataTable } from '@/components/admin/data-table';
import { FeatureUnavailable, LoadingSpinner, ErrorState } from '@/components/common/states';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function AdminCoupons() {
  const { data, isLoading, error, refetch } = useGetCouponsQuery(undefined, { skip: !env.admin });
  const [create, creation] = useCreateCouponMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ code: string; percentOff: number; expiresAt: string }>({
    resolver: zodResolver(couponSchema),
  });
  if (!env.admin) return <FeatureUnavailable title="Coupon management" />;
  return (
    <>
      <form
        className="mb-8 grid gap-5 rounded-xl border bg-background p-6 sm:grid-cols-2"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          try {
            await create({
              ...values,
              expiresAt: new Date(values.expiresAt).toISOString(),
            }).unwrap();
            reset();
          } catch {
            /* Handled below. */
          }
        })}
      >
        {(['code', 'percentOff', 'expiresAt'] as const).map((field) => (
          <FormField
            id={field}
            key={field}
            label={
              field === 'code'
                ? 'Coupon code'
                : field === 'percentOff'
                  ? 'Discount (%)'
                  : 'Expires at'
            }
            error={errors[field]?.message}
          >
            <Input
              id={field}
              type={
                field === 'percentOff'
                  ? 'number'
                  : field === 'expiresAt'
                    ? 'datetime-local'
                    : 'text'
              }
              aria-invalid={!!errors[field]}
              aria-describedby={errors[field] ? `${field}-error` : undefined}
              {...register(field, field === 'percentOff' ? { valueAsNumber: true } : {})}
            />
          </FormField>
        ))}
        <Button className="self-end" disabled={creation.isLoading}>
          Create coupon
        </Button>
      </form>
      {creation.error && <ErrorState error={creation.error} />}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : (
        <DataTable
          caption="Coupons"
          rows={data ?? []}
          columns={[
            { key: 'code', header: 'Code', cell: (row) => row.code },
            { key: 'discount', header: 'Discount', cell: (row) => `${row.percentOff}%` },
            { key: 'expiry', header: 'Expires', cell: (row) => row.expiresAt },
          ]}
        />
      )}
    </>
  );
}
