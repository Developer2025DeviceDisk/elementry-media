'use client';
import { Button } from '@/components/ui/button';
export function Pagination({
  page,
  hasNext,
  onChange,
  disabled = false,
}: {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
      <Button variant="outline" disabled={page <= 1 || disabled} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span aria-current="page">Page {page}</span>
      <Button variant="outline" disabled={!hasNext || disabled} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
