import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
