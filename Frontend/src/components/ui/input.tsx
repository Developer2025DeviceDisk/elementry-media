import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-xs hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
