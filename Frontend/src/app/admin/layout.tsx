import type { Metadata } from 'next';
import { RouteGuard } from '@/lib/auth/route-guard';
import { AdminShell } from '@/components/admin/admin-shell';
export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard admin>
      <AdminShell>{children}</AdminShell>
    </RouteGuard>
  );
}
