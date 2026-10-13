import { AccountOrderDetail } from '@/features/account/orders';
export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountOrderDetail id={id} />;
}
