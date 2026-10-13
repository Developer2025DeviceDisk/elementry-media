import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from '@/types/product';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function money(value: string, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(value));
}
export function productSlug(product: Product) {
  return (
    product.slug ??
    `${product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}--${product.id}`
  );
}
export function safeRedirect(value: string | null, fallback = '/account') {
  return value && value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n]/.test(value)
    ? value
    : fallback;
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
