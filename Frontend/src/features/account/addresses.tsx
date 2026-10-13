'use client';
import { useState } from 'react';
import {
  useGetAccountAddressesQuery,
  useSaveAccountAddressMutation,
  useDeleteAccountAddressMutation,
  useSetDefaultAddressMutation,
} from '@/store/api/accountApi';
import type { AddressInput, SavedAddress } from '@/types/account';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/common/states';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/common/form-field';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';

const fields: {
  name: keyof AddressInput;
  label: string;
  max: number;
  complete?: string;
  optional?: boolean;
}[] = [
  { name: 'label', label: 'Address label', max: 30 },
  { name: 'name', label: 'Recipient name', max: 100, complete: 'name' },
  { name: 'phone', label: 'Phone number', max: 20, complete: 'tel' },
  { name: 'line1', label: 'Address line 1', max: 200, complete: 'address-line1' },
  { name: 'line2', label: 'Address line 2', max: 200, complete: 'address-line2', optional: true },
  { name: 'city', label: 'City', max: 100, complete: 'address-level2' },
  { name: 'state', label: 'State / region', max: 100, complete: 'address-level1' },
  { name: 'postalCode', label: 'Postal code', max: 12, complete: 'postal-code' },
  { name: 'country', label: 'Country code', max: 2, complete: 'country' },
];
export function AccountAddresses() {
  const { data, isLoading, error, refetch } = useGetAccountAddressesQuery();
  const [save, saving] = useSaveAccountAddressMutation();
  const [remove, removing] = useDeleteAccountAddressMutation();
  const [setDefault, setting] = useSetDefaultAddressMutation();
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const busy = saving.isLoading || removing.isLoading || setting.isLoading;
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Saved Addresses</h2>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
            setMessage('');
            saving.reset();
          }}
        >
          Add address
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
          aria-label="Saved address"
          key={editing?.id ?? 'new'}
          className="rounded-2xl border bg-muted/20 p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const address = Object.fromEntries(
              fields.map((field) => [field.name, String(values.get(field.name) ?? '')]),
            ) as unknown as AddressInput;
            try {
              await save({ id: editing?.id, address }).unwrap();
              setOpen(false);
              setEditing(null);
              setMessage('Address saved.');
            } catch {
              /* Mutation error above. */
            }
          }}
        >
          <h3 className="mb-5 font-semibold">{editing ? 'Edit address' : 'New address'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <FormField key={field.name} id={`address-${field.name}`} label={field.label}>
                <Input
                  id={`address-${field.name}`}
                  name={field.name}
                  autoComplete={field.complete}
                  required={!field.optional}
                  maxLength={field.max}
                  defaultValue={editing?.[field.name] ?? (field.name === 'country' ? 'IN' : '')}
                  type={field.name === 'phone' ? 'tel' : 'text'}
                />
              </FormField>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button disabled={busy}>Save address</Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {data?.data.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.data.map((address) => (
            <article className="rounded-2xl border p-6" key={address.id}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold">{address.label}</h3>
                {address.id === data.defaultId && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    Default
                  </span>
                )}
              </div>
              <address className="space-y-1 text-sm not-italic">
                <p className="font-medium">{address.name}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
                <p>{address.phone}</p>
              </address>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditing(address);
                    setOpen(true);
                    setMessage('');
                    saving.reset();
                  }}
                >
                  Edit
                </Button>
                {address.id !== data.defaultId && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      void setDefault(address.id)
                        .unwrap()
                        .then(() => setMessage('Default address updated.'))
                        .catch(() => undefined);
                    }}
                  >
                    Make default
                  </Button>
                )}
                <ConfirmationDialog
                  title="Remove this address?"
                  description="You can add it again later. Existing order records will be preserved."
                  disabled={busy}
                  onConfirm={() => {
                    void remove(address.id)
                      .unwrap()
                      .then(() => setMessage('Address removed.'))
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
          title="No saved addresses"
          description="Add an address to keep your delivery details in one place."
        />
      )}
    </div>
  );
}
