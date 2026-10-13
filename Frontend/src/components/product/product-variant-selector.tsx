'use client';
import type { ProductVariant } from '@/types/product';
export function ProductVariantSelector({
  variants,
  value,
  onChange,
}: {
  variants: ProductVariant[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor="variant" className="text-sm font-medium">
        Choose an option
      </label>
      <select
        id="variant"
        className="w-full"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select an option</option>
        {variants.map((variant) => (
          <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
            {variant.name}
            {variant.stock <= 0 ? ' — Out of stock' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
