'use client';
import dynamic from 'next/dynamic';
import { env } from '@/config/env';
import { useGetAnalyticsQuery } from '@/store/api/adminApi';
import {
  FeatureUnavailable,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from '@/components/common/states';
const Chart = dynamic(() => import('@/components/admin/chart'), {
  loading: () => <LoadingSpinner />,
});
export function AdminAnalytics() {
  const { data, isLoading, error, refetch } = useGetAnalyticsQuery(undefined, { skip: !env.admin });
  if (!env.admin) return <FeatureUnavailable title="Store analytics" />;
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  return data?.length ? (
    <Chart data={data} />
  ) : (
    <EmptyState
      title="No analytics yet"
      description="Revenue trends will appear after your first orders."
    />
  );
}
