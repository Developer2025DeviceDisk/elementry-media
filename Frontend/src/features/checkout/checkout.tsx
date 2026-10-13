'use client';
import { useRef, useState } from 'react';
import { env } from '@/config/env';
import { useGetCartQuery } from '@/store/api/cartApi';
import { useCreateOrderMutation } from '@/store/api/orderApi';
import { useCreatePaymentMutation } from '@/store/api/paymentApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAddress, setShipping, setStep } from '@/store/slices/checkoutSlice';
import { checkoutSchema } from '@/lib/validations/checkout';
import { validatedPaymentUrl } from '@/lib/constants/payment';
import { apiErrorMessage } from '@/lib/api/errors';
import {
  FeatureUnavailable,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from '@/components/common/states';
import { AddressForm } from '@/components/checkout/address-form';
import { OrderSummary } from '@/components/checkout/order-summary';
import { Button } from '@/components/ui/button';
export function Checkout() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.checkoutUi);
  const {
    data: cart,
    isLoading,
    error,
    refetch,
  } = useGetCartQuery(undefined, { skip: !env.commerce });
  const [createOrder, orderResult] = useCreateOrderMutation();
  const [createPayment, paymentResult] = useCreatePaymentMutation();
  const idempotencyKey = useRef<string | null>(null);
  const pendingOrderId = useRef<string | null>(null);
  const lock = useRef(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  if (!env.commerce) return <FeatureUnavailable title="Checkout" />;
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!cart || (!cart.items.length && !createdOrderId))
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add a product before starting checkout."
      />
    );
  async function pay() {
    if (lock.current) return;
    lock.current = true;
    setFailure(null);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const payload = checkoutSchema.parse({
        address: draft.address,
        shippingMethod: draft.shippingMethod,
        idempotencyKey: idempotencyKey.current,
      });
      if (!pendingOrderId.current) {
        const order = await createOrder(payload).unwrap();
        pendingOrderId.current = order.id;
        setCreatedOrderId(order.id);
      }
      const payment = await createPayment({ orderId: pendingOrderId.current }).unwrap();
      // Success is shown only after backend verification on the callback page.
      window.location.assign(validatedPaymentUrl(payment.checkoutUrl));
    } catch (failure) {
      setFailure(apiErrorMessage(failure));
      lock.current = false;
    }
  }
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <ol aria-label="Checkout progress" className="mb-8 flex flex-wrap gap-3 text-sm">
          {(['address', 'shipping', 'payment'] as const).map((step, index) => (
            <li
              key={step}
              aria-current={draft.step === step ? 'step' : undefined}
              className={
                draft.step === step ? 'font-semibold text-primary' : 'text-muted-foreground'
              }
            >
              {index + 1}. {step[0].toUpperCase() + step.slice(1)}
            </li>
          ))}
        </ol>
        {draft.step === 'address' && (
          <AddressForm
            initialAddress={draft.address}
            onSubmit={(address) => {
              idempotencyKey.current = null;
              dispatch(setAddress(address));
            }}
          />
        )}
        {draft.step === 'shipping' && (
          <section>
            <h2 className="mb-5 text-xl font-semibold">Shipping method</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                dispatch(setShipping(String(form.get('shipping'))));
              }}
              className="space-y-5"
            >
              <label className="flex gap-3 rounded-lg border p-4">
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  defaultChecked={draft.shippingMethod === 'standard'}
                />
                Standard shipping
              </label>
              <label className="flex gap-3 rounded-lg border p-4">
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  defaultChecked={draft.shippingMethod === 'express'}
                />
                Express shipping
              </label>
              <p className="text-sm text-muted-foreground">
                Shipping availability and final cost are confirmed when placing your order.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => dispatch(setStep('address'))}
                >
                  Back
                </Button>
                <Button>Continue to payment</Button>
              </div>
            </form>
          </section>
        )}
        {draft.step === 'payment' && (
          <section>
            <h2 className="mb-5 text-xl font-semibold">Review & pay</h2>
            <p className="mb-6 text-muted-foreground">
              {draft.address?.name}
              <br />
              {draft.address?.line1}, {draft.address?.city}
              <br />
              {draft.address?.postalCode} · {draft.shippingMethod} shipping
            </p>
            <p className="mb-6 text-sm">
              You’ll continue to our secure payment provider to complete your purchase.
            </p>
            {failure && (
              <p role="alert" className="mb-4 text-destructive">
                {failure}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={!!createdOrderId}
                onClick={() => dispatch(setStep('shipping'))}
              >
                Back
              </Button>
              <Button
                disabled={orderResult.isLoading || paymentResult.isLoading}
                onClick={() => void pay()}
              >
                {orderResult.isLoading || paymentResult.isLoading
                  ? 'Preparing payment…'
                  : 'Continue to secure payment'}
              </Button>
            </div>
          </section>
        )}
      </div>
      <aside>
        <OrderSummary cart={cart} />
      </aside>
    </div>
  );
}
