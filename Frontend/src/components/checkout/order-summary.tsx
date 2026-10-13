import type { Cart } from '@/types/cart';
import { money } from '@/lib/utils';
export function OrderSummary({ cart }: { cart: Cart }) {
  return (
    <section className="rounded-xl border bg-background p-6">
      <h2 className="mb-6 text-xl font-semibold">Order summary</h2>
      <dl className="space-y-4 text-sm">
        {[
          { label: 'Subtotal', value: cart.subtotal },
          { label: 'Discount', value: cart.discount },
          { label: 'Tax', value: cart.tax },
          { label: 'Shipping', value: cart.shipping },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{money(value, cart.currency)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t pt-5 text-base font-bold">
          <dt>Total</dt>
          <dd>{money(cart.total, cart.currency)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Your final total is confirmed when the order is placed.
      </p>
    </section>
  );
}
