'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserRound,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Truck,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { useGetCurrentUserQuery } from '@/store/api/authApi';
import { RouteGuard } from '@/lib/auth/route-guard';
import { cn } from '@/lib/utils';

export const accountLinks = [
  { href: '/account', title: 'Overview', icon: LayoutDashboard },
  { href: '/account/profile', title: 'My Profile', icon: UserRound },
  { href: '/account/orders', title: 'My Orders', icon: Package },
  { href: '/account/wishlist', title: 'Wishlist', icon: Heart },
  { href: '/account/addresses', title: 'Saved Addresses', icon: MapPin },
  { href: '/account/payment-methods', title: 'Payment Methods', icon: CreditCard },
  { href: '/account/tracking', title: 'Order Tracking', icon: Truck },
  { href: '/account/returns', title: 'Returns and Refunds', icon: RotateCcw },
  { href: '/account/settings', title: 'Account Settings', icon: Settings },
];
export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useGetCurrentUserQuery();
  return (
    <RouteGuard>
      <div className="container py-8 md:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Customer account
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">My account</h1>
            <p className="mt-2 text-muted-foreground">Welcome back, {data?.user.name}.</p>
          </div>
          <p className="max-w-full break-all rounded-full bg-muted px-4 py-2 text-sm">
            {data?.user.email}
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav
            aria-label="Customer account"
            className="flex gap-2 overflow-x-auto rounded-2xl border bg-muted/30 p-3 lg:sticky lg:top-28 lg:flex-col lg:self-start"
          >
            {accountLinks.map(({ href, title, icon: Icon }) => {
              const active =
                pathname === href ||
                (href === '/account/orders' && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-muted',
                    active && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {title}
                </Link>
              );
            })}
          </nav>
          <section className="min-w-0" aria-label="Account details">
            {children}
          </section>
        </div>
      </div>
    </RouteGuard>
  );
}
