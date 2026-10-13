import { Wishlist } from '@/features/wishlist/wishlist';
export default function AccountWishlistPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Wishlist</h2>
      <Wishlist />
    </div>
  );
}
