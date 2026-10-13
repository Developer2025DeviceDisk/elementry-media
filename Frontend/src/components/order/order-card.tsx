import Link from 'next/link';
import type { Order } from '@/types/order';
import { money } from '@/lib/utils';
export function OrderCard({ order }: { order: Order }) {
  return (
    <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-6">
      <div>
        <h2 className="font-semibold">
          <Link href={`/orders/${order.id}`}>Order {order.id.slice(0, 8)}</Link>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{money(order.total, order.currency)}</p>
        <p className="mt-2 text-xs text-primary">{order.status}</p>
      </div>
    </article>
  );
}
