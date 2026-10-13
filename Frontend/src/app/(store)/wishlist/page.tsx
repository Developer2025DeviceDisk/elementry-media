import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } };
export default function WishlistPage() {
  redirect('/account/wishlist');
}
