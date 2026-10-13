'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Receipt,
  Users,
  Boxes,
  Ticket,
  Star,
  ChartNoAxesCombined,
  Menu,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar, closeSidebar } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
const links = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Layers },
  { href: '/admin/orders', label: 'Orders', icon: Receipt },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
];
export function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.sidebarOpen);
  return (
    <aside
      id="admin-sidebar"
      className={`${open ? 'block' : 'hidden'} border-b bg-background p-6 md:sticky md:top-0 md:block md:h-screen md:border-r md:border-b-0`}
    >
      <Link href="/" className="mb-8 block text-2xl font-bold">
        Elementry.MEDIA
      </Link>
      <p className="mb-5 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Store administration
      </p>
      <nav aria-label="Admin" className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            href={href}
            key={href}
            aria-current={pathname === href ? 'page' : undefined}
            onClick={() => dispatch(closeSidebar())}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${pathname === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/products" className="mt-10 block text-sm text-primary">
        ← Back to store
      </Link>
    </aside>
  );
}
export function AdminHeader() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.sidebarOpen);
  return (
    <header className="flex items-center gap-4 border-b bg-background px-6 py-5">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Toggle admin navigation"
        aria-expanded={open}
        aria-controls="admin-sidebar"
        onClick={() => dispatch(toggleSidebar())}
      >
        <Menu />
      </Button>
      <p className="text-sm font-medium">Elementry Media workspace</p>
      <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        Admin
      </span>
    </header>
  );
}
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 md:grid md:grid-cols-[240px_1fr]">
      <AdminSidebar />
      <div className="min-w-0">
        <AdminHeader />
        <main id="main-content" className="p-5 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
