'use client';
import { env } from '@/config/env';
import { useGetDashboardQuery } from '@/store/api/adminApi';
import { FeatureUnavailable, LoadingSpinner, ErrorState } from '@/components/common/states';
import { StatsCard } from '@/components/admin/stats-card';
import { money } from '@/lib/utils';
export function Dashboard() {
  const { data, isLoading, error, refetch } = useGetDashboardQuery(undefined, { skip: !env.admin });
  if (!env.admin) return <FeatureUnavailable title="Admin dashboard" />;
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  return data ? (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard title="Revenue" value={money(data.revenue, data.currency)} />
      <StatsCard title="Orders" value={data.orders} />
      <StatsCard title="Customers" value={data.customers} />
      <StatsCard title="Low stock products" value={data.lowStock} />
    </div>
  ) : null;
}
