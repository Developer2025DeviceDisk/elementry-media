'use client';
import { ErrorState } from '@/components/common/states';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="container py-16">
      <ErrorState error={{ status: 500 }} retry={reset} />
    </main>
  );
}
