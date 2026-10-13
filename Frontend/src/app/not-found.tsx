import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <main id="main-content" className="container py-24 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
      <p className="my-6 text-muted-foreground">
        The page may have moved or is no longer available.
      </p>
      <Button asChild>
        <Link href="/products">Browse products</Link>
      </Button>
    </main>
  );
}
