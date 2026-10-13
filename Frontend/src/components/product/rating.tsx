import { Star } from 'lucide-react';
export function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Rated ${value} out of 5`}>
      <Star aria-hidden="true" className="size-4 fill-amber-500 text-amber-500" />
      {value.toFixed(1)}
    </span>
  );
}
