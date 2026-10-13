import Link from 'next/link';
import { Brand } from './brand';
export function StoreFooter() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        <div>
          <Brand />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Leading broadcast system integrator in India.
          </p>
          <address className="mt-4 text-sm text-muted-foreground not-italic">
            Office No. 909 & 910, Gaur City Mall,
            <br />
            Greater Noida, Uttar Pradesh, India
          </address>
        </div>
        <nav aria-label="Company" className="flex flex-col gap-2 text-sm">
          <h2 className="mb-2 font-semibold">Company</h2>
          <Link href="/#about">About</Link>
          <Link href="/#services">Services</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/#contact">Contact</Link>
        </nav>
        <nav aria-label="Explore" className="flex flex-col gap-2 text-sm">
          <h2 className="mb-2 font-semibold">Explore</h2>
          <Link href="/products">Products</Link>
          <Link href="/#services">Solutions</Link>
          <Link href="/#why">Why Choose Us</Link>
        </nav>
        <nav aria-label="Account" className="flex flex-col gap-2 text-sm">
          <h2 className="mb-2 font-semibold">Your Account</h2>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
          <Link href="/account">My account</Link>
          <Link href="/account/profile">My Profile</Link>
          <Link href="/account/orders">My Orders</Link>
        </nav>
      </div>
      <div className="container border-t py-5 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Elementry Media Technology. All rights reserved.
      </div>
    </footer>
  );
}
