'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  useGetCustomerOrdersQuery,
  useGetCustomerOrderQuery,
  useCancelCustomerOrderMutation,
  useRequestCustomerReturnMutation,
} from '@/store/api/accountApi';
import type { CustomerOrder } from '@/types/account';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { Pagination } from '@/components/common/pagination';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { money } from '@/lib/utils';

export const statusLabel = (value: string) => value.toLowerCase().replaceAll('_', ' ');
export function CustomerOrderCard({ order }: { order: CustomerOrder }) {
  return (
    <article className="rounded-2xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/account/orders/${order.id}`} className="font-semibold hover:text-primary">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString()} ·{' '}
            {order.items.reduce((count, item) => count + item.quantity, 0)} items
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
          {statusLabel(order.status)}
        </span>
        <p className="font-semibold">{money(order.total, order.currency)}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {order.items.map((item) => item.name).join(', ') || 'Order details recorded'}
          {order.tracking && (
            <span className="ml-2 capitalize">· {statusLabel(order.tracking.status)}</span>
          )}
        </p>
        <Link href={`/account/orders/${order.id}`} className="text-sm font-medium text-primary">
          View order
        </Link>
      </div>
    </article>
  );
}
export function AccountOrders({ tracking = false }: { tracking?: boolean }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetCustomerOrdersQuery(
    { page, limit: 10 },
    { pollingInterval: tracking ? 30000 : 0, skipPollingIfUnfocused: true },
  );
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{tracking ? 'Order Tracking' : 'My Orders'}</h2>
      {data?.data.length ? (
        <div className="space-y-4">
          {data.data.map((order) => (
            <div key={order.id}>
              <CustomerOrderCard order={order} />
              {tracking && <TrackingTimeline order={order} />}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={tracking ? 'No orders to track' : 'No orders yet'}
          description="Your order records will appear here after a purchase."
        />
      )}
      <Pagination
        page={page}
        hasNext={page * 10 < (data?.total ?? 0)}
        disabled={isFetching}
        onChange={setPage}
      />
    </div>
  );
}
export function TrackingTimeline({ order }: { order: CustomerOrder }) {
  return (
    <section aria-label="Shipment tracking" className="mt-4 rounded-2xl border p-5">
      <h3 className="font-semibold">Shipment updates</h3>
      {order.tracking ? (
        <>
          <p className="mt-3 text-sm capitalize">
            Current status: {statusLabel(order.tracking.status)}
          </p>
          {order.tracking.carrier && (
            <p className="mt-2 break-all text-sm text-muted-foreground">
              {order.tracking.carrier} · Tracking number:{' '}
              {order.tracking.trackingNumber ?? 'Not assigned'}
            </p>
          )}
          <ol className="mt-5 space-y-4 border-l-2 border-primary/20 pl-5">
            {order.tracking.events.map((event) => (
              <li key={event.id}>
                <p className="text-sm font-medium capitalize">{statusLabel(event.status)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>
                <time
                  className="mt-1 block text-xs text-muted-foreground"
                  dateTime={event.occurredAt}
                >
                  {new Date(event.occurredAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {order.status === 'CANCELLED'
            ? 'This order was cancelled.'
            : 'No shipment details have been recorded yet.'}
        </p>
      )}
    </section>
  );
}
export function AccountOrderDetail({ id }: { id: string }) {
  const { data, isLoading, error, refetch } = useGetCustomerOrderQuery(id, {
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
  });
  const [cancel, cancelling] = useCancelCustomerOrderMutation();
  const [requestReturn, returning] = useRequestCustomerReturnMutation();
  const [reason, setReason] = useState('');
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Order details</h2>
        <Link href="/account/orders" className="text-sm text-primary">
          Back to orders
        </Link>
      </div>
      <CustomerOrderCard order={data} />
      <section className="rounded-2xl border p-5">
        <h3 className="mb-4 font-semibold">Purchased items</h3>
        <div className="divide-y">
          {data.items.map((item) => (
            <div className="flex flex-wrap justify-between gap-3 py-4" key={item.id}>
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.sku} · Quantity: {item.quantity}
                </p>
              </div>
              <p className="text-sm">{money(item.unitPrice, data.currency)} each</p>
            </div>
          ))}
        </div>
        <p className="mt-5 border-t pt-4 font-semibold">
          Order total: {money(data.total, data.currency)}
        </p>
      </section>
      <TrackingTimeline order={data} />
      {data.returnRequest && (
        <section className="rounded-2xl border p-5">
          <h3 className="font-semibold">Return status</h3>
          <p className="mt-2 capitalize">{statusLabel(data.returnRequest.status)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{data.returnRequest.reason}</p>
          <Link href="/account/returns" className="mt-3 inline-block text-sm text-primary">
            View return and refund details
          </Link>
        </section>
      )}
      {data.canCancel && (
        <ConfirmationDialog
          title="Cancel this order?"
          description="This cancellation cannot be undone."
          disabled={cancelling.isLoading}
          onConfirm={() => {
            void cancel(id)
              .unwrap()
              .catch(() => undefined);
          }}
        >
          <Button variant="outline" disabled={cancelling.isLoading}>
            Cancel order
          </Button>
        </ConfirmationDialog>
      )}
      {data.canReturn && (
        <form
          aria-label="Return request"
          className="max-w-xl space-y-4 rounded-2xl border p-5"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await requestReturn({ orderId: id, reason }).unwrap();
            } catch {
              /* Mutation error below. */
            }
          }}
        >
          <h3 className="font-semibold">Request a return</h3>
          <label htmlFor="account-return-reason" className="block text-sm font-medium">
            Reason for return
          </label>
          <Input
            id="account-return-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            minLength={5}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            Your request will be reviewed before a return or refund is approved.
          </p>
          <Button disabled={returning.isLoading}>Submit return request</Button>
        </form>
      )}
      {(cancelling.error || returning.error) && (
        <ErrorState error={cancelling.error || returning.error} />
      )}
    </div>
  );
}
