import { LoaderCircle, PackageOpen, CircleAlert } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
export function LoadingSpinner() {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-12">
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      <span>Loading…</span>
    </div>
  );
}
export function ProductSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading products</span>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-3 h-5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <PackageOpen aria-hidden="true" className="mx-auto mb-4 size-9 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border p-8 text-center">
      <CircleAlert aria-hidden="true" className="mx-auto mb-4 size-8 text-destructive" />
      <p>{apiErrorMessage(error)}</p>
      {retry && (
        <Button className="mt-4" variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function FeatureUnavailable({ title }: { title: string }) {
  return (
    <EmptyState
      title={`${title} is coming soon`}
      description="This feature is not available yet. You can still browse our products."
    />
  );
}
