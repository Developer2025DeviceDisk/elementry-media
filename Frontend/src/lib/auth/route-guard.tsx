'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGetCurrentUserQuery } from '@/store/api/authApi';
import { useAppSelector } from '@/store/hooks';
import { ErrorState, LoadingSpinner } from '@/components/common/states';
export function RouteGuard({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const expired = useAppSelector((state) => state.auth.sessionExpired);
  const { data, error, isLoading, refetch } = useGetCurrentUserQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const unauthorized = expired || (error && 'status' in error && error.status === 401);
  useEffect(() => {
    if (unauthorized) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [unauthorized, router, pathname]);
  if (isLoading || unauthorized) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!data) return <LoadingSpinner />;
  if (admin && data.user.role !== 'ADMIN') return <ErrorState error={{ status: 403 }} />;
  return children;
}
