'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema } from '@/lib/validations/address';
import type { Address } from '@/types/cart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/common/form-field';
export function AddressForm({
  initialAddress,
  onSubmit,
}: {
  initialAddress: Address | null;
  onSubmit: (address: Address) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialAddress ?? { country: 'IN' },
  });
  const fields = [
    { name: 'name', label: 'Recipient name', autoComplete: 'name' },
    { name: 'phone', label: 'Phone number', autoComplete: 'tel' },
    { name: 'line1', label: 'Address line 1', autoComplete: 'address-line1' },
    { name: 'line2', label: 'Address line 2 (optional)', autoComplete: 'address-line2' },
    { name: 'city', label: 'City', autoComplete: 'address-level2' },
    { name: 'region', label: 'State / region', autoComplete: 'address-level1' },
    { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
    { name: 'country', label: 'Country code', autoComplete: 'country' },
  ] as const;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2" noValidate>
      {fields.map((field) => (
        <FormField
          id={field.name}
          key={field.name}
          label={field.label}
          error={errors[field.name]?.message}
        >
          <Input
            id={field.name}
            autoComplete={field.autoComplete}
            aria-invalid={!!errors[field.name]}
            aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
            {...register(field.name)}
          />
        </FormField>
      ))}
      <Button className="sm:col-span-2">Continue to shipping</Button>
    </form>
  );
}
