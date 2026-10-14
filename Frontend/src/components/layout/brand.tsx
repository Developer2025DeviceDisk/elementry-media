import Link from 'next/link';
export function Brand({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Elementry Media home"
      className={`whitespace-nowrap text-base font-bold tracking-tight sm:text-xl ${className}`}
    >
      Elementry<span className="text-primary">.</span>MEDIA
    </Link>
  );
}
