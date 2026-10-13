'use client';
import { useState } from 'react';
import {
  useGetAccountPaymentMethodsQuery,
  useSaveAccountPaymentMethodMutation,
  useDeleteAccountPaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
} from '@/store/api/accountApi';
import type { SavedUpi } from '@/types/account';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/common/form-field';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';

export function AccountPaymentMethods() {
  const { data, isLoading, error, refetch } = useGetAccountPaymentMethodsQuery();
  const [save, saving] = useSaveAccountPaymentMethodMutation();
  const [remove, removing] = useDeleteAccountPaymentMethodMutation();
  const [setDefault, setting] = useSetDefaultPaymentMethodMutation();
  const [editing, setEditing] = useState<SavedUpi | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const busy = saving.isLoading || removing.isLoading || setting.isLoading;
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Payment Methods</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your saved UPI details. Saving an ID does not verify it or make a payment.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
            saving.reset();
            setMessage('');
          }}
        >
          Add UPI ID
        </Button>
      </div>
      {message && (
        <p role="status" className="text-sm text-green-700">
          {message}
        </p>
      )}
      {(saving.error || removing.error || setting.error) && (
        <ErrorState error={saving.error || removing.error || setting.error} />
      )}
      {open && (
        <form
          aria-label="UPI payment method"
          key={editing?.id ?? 'new'}
          className="max-w-lg space-y-4 rounded-2xl border p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            try {
              await save({
                id: editing?.id,
                method: { label: String(values.get('label')), upiId: String(values.get('upiId')) },
              }).unwrap();
              setOpen(false);
              setMessage('UPI details saved.');
            } catch {
              /* Mutation error above. */
            }
          }}
        >
          <h3 className="font-semibold">{editing ? 'Edit UPI details' : 'New UPI details'}</h3>
          <FormField id="upi-label" label="Payment label">
            <Input
              id="upi-label"
              name="label"
              required
              maxLength={40}
              defaultValue={editing?.label ?? ''}
              placeholder="Personal UPI"
            />
          </FormField>
          <FormField id="upi-id" label="UPI ID">
            <Input
              id="upi-id"
              name="upiId"
              required
              maxLength={151}
              defaultValue={editing?.upiId ?? ''}
              placeholder="yourname@bank"
              autoComplete="off"
            />
          </FormField>
          <div className="flex gap-3">
            <Button disabled={busy}>Save UPI details</Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {data?.data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.data.map((method) => (
            <article key={method.id} className="rounded-2xl border p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{method.label}</h3>
                {method.id === data.defaultId && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-3 break-all font-mono text-sm">{method.upiId}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditing(method);
                    setOpen(true);
                    saving.reset();
                    setMessage('');
                  }}
                >
                  Edit
                </Button>
                {method.id !== data.defaultId && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      void setDefault(method.id)
                        .unwrap()
                        .then(() => setMessage('Default payment method updated.'))
                        .catch(() => undefined);
                    }}
                  >
                    Make default
                  </Button>
                )}
                <ConfirmationDialog
                  title="Remove this UPI ID?"
                  description="This removes the saved details from your account."
                  disabled={busy}
                  onConfirm={() => {
                    void remove(method.id)
                      .unwrap()
                      .then(() => setMessage('UPI details removed.'))
                      .catch(() => undefined);
                  }}
                >
                  <Button size="sm" variant="ghost" disabled={busy}>
                    Remove
                  </Button>
                </ConfirmationDialog>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No payment methods saved"
          description="Save a UPI ID and choose your preferred method."
        />
      )}
    </div>
  );
}
