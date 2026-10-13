'use client';
import Link from 'next/link';
import { ShoppingBag, Heart, UserRound, Menu, X, LogOut } from 'lucide-react';
import { useGetCurrentUserQuery, useLogoutMutation } from '@/store/api/authApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar, closeSidebar } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api/errors';
import { CartPreview } from '@/components/cart/cart-preview';
import { Brand } from './brand';
import { env } from '@/config/env';
import { Search } from 'lucide-react';
const links = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'About', href: '/#about' },
  { label: 'Solutions', href: '/#services' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/#contact' },
];
export function StoreHeader() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.sidebarOpen);
  const expired = useAppSelector((state) => state.auth.sessionExpired);
  const { data, error: sessionError } = useGetCurrentUserQuery();
  const [logout, { isLoading, error }] = useLogoutMutation();
  const user = !expired && !sessionError ? data?.user : undefined;
  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-20 items-center justify-between gap-3 md:gap-6">
          <Brand />
          <nav aria-label="Main" className="hidden items-center gap-5 text-sm xl:flex">
            {links.map(({ label, href }) => (
              <Link key={href} href={href} className="hover:text-primary">
                {label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && <Link href="/admin">Admin</Link>}
          </nav>
          <div className="flex items-center gap-1">
            <form
              role="search"
              action="/products"
              className="mr-3 hidden w-44 items-center rounded-sm border border-foreground px-3 lg:flex"
            >
              <input
                aria-label="Search catalog"
                type="search"
                name="q"
                maxLength={100}
                placeholder="Search..."
                className="h-11 min-w-0 w-full bg-transparent text-sm outline-none"
              />
              <button aria-label="Search catalog" className="p-1 text-foreground">
                <Search className="size-5" />
              </button>
            </form>
            {
              <Button asChild variant="ghost" size="icon">
                <Link href="/account/wishlist" aria-label="Wishlist">
                  <Heart className="size-5" />
                </Link>
              </Button>
            }
            {env.commerce && (
              <Button asChild variant="ghost" size="icon">
                <Link href="/cart" aria-label="Shopping cart">
                  <ShoppingBag className="size-5" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full bg-foreground text-background hover:bg-foreground/80"
            >
              <Link
                href={user ? '/account' : '/login'}
                aria-label={user ? 'Your account' : 'Sign in'}
              >
                <UserRound className="size-5" />
              </Link>
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                aria-label="Sign out"
                disabled={isLoading}
                onClick={() => {
                  void logout()
                    .unwrap()
                    .catch(() => undefined);
                }}
              >
                <LogOut aria-hidden="true" className="size-4 sm:hidden" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-label="Toggle navigation"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => dispatch(toggleSidebar())}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label="Mobile"
            className="container flex flex-col gap-4 pb-5 xl:hidden"
          >
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => dispatch(closeSidebar())}
                className="capitalize"
              >
                {label}
              </Link>
            ))}
            <form
              role="search"
              action="/products"
              className="flex items-center gap-2 border p-2 lg:hidden"
            >
              <input
                aria-label="Search catalog"
                name="q"
                type="search"
                maxLength={100}
                placeholder="Search products..."
                className="min-w-0 flex-1 p-2"
              />
              <Button aria-label="Search catalog" size="icon">
                <Search className="size-4" />
              </Button>
            </form>
          </nav>
        )}
        {error && (
          <p role="alert" className="container pb-2 text-sm text-destructive">
            {apiErrorMessage(error)}
          </p>
        )}
      </header>
      {user && env.commerce && <CartPreview />}
    </>
  );
}
