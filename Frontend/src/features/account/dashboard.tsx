'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useGetAccountDashboardQuery } from '@/store/api/accountApi';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { accountLinks } from './account-shell';
import { CustomerOrderCard } from './orders';

export function AccountDashboard() {
  const { data, isLoading, error, refetch } = useGetAccountDashboardQuery();
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!data) return null;
  const stats = [
    { title: 'Orders', value: data.counts.orders, href: '/account/orders' },
    { title: 'Saved products', value: data.counts.wishlist, href: '/account/wishlist' },
    { title: 'Saved addresses', value: data.counts.addresses, href: '/account/addresses' },
    { title: 'Open returns', value: data.counts.openReturns, href: '/account/returns' },
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="rounded-2xl border p-5 transition-colors hover:border-primary"
          >
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="mb-4 text-xl font-semibold">Your account, at a glance</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {accountLinks.slice(1).map(({ href, title, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 rounded-xl border p-4 hover:bg-muted/40"
            >
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <span className="flex-1 font-medium">{title}</span>
              <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-medium text-primary">
            View all orders
          </Link>
        </div>
        {data.recentOrders.length ? (
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <CustomerOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No orders yet"
            description="Your purchases will appear here. Browse the catalog to find your next product."
          />
        )}
      </section>
    </div>
  );
}
