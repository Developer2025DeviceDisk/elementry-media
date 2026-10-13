'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetAccountSettingsQuery,
  useSaveAccountSettingsMutation,
  useChangeAccountPasswordMutation,
  useRevokeAccountSessionsMutation,
} from '@/store/api/accountApi';
import { LoadingSpinner, ErrorState } from '@/components/common/states';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/common/form-field';

export function AccountSettings() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState('');
  const { data, isLoading, error, refetch } = useGetAccountSettingsQuery();
  const [save, saving] = useSaveAccountSettingsMutation();
  const [change, changing] = useChangeAccountPasswordMutation();
  const [revoke, revoking] = useRevokeAccountSessionsMutation();
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!data) return null;
  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-semibold">Account Settings</h2>
      <form
        aria-label="Account preferences"
        className="space-y-5 rounded-2xl border p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage('');
          const values = new FormData(event.currentTarget);
          try {
            await save({
              orderUpdates: values.has('orderUpdates'),
              marketingEmails: values.has('marketingEmails'),
            }).unwrap();
            setMessage('Preferences saved.');
          } catch {
            /* Mutation error below. */
          }
        }}
      >
        <h3 className="font-semibold">Communication preferences</h3>
        <p className="text-sm text-muted-foreground">
          Choose the updates you would like to receive.
        </p>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="orderUpdates"
            defaultChecked={data.orderUpdates}
            className="size-4 accent-primary"
          />
          Order updates
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="marketingEmails"
            defaultChecked={data.marketingEmails}
            className="size-4 accent-primary"
          />
          Offers and product news
        </label>
        <Button disabled={saving.isLoading}>Save preferences</Button>
        {message && (
          <p role="status" className="text-sm text-green-700">
            {message}
          </p>
        )}
        {saving.error && <ErrorState error={saving.error} />}
      </form>
      <form
        aria-label="Account security"
        className="space-y-5 rounded-2xl border p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setValidation('');
          const values = new FormData(event.currentTarget);
          const currentPassword = String(values.get('currentPassword'));
          const newPassword = String(values.get('newPassword'));
          const submitter = (event.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
          if (
            submitter?.value !== 'revoke' &&
            (newPassword.length < 12 || newPassword.length > 128)
          ) {
            setValidation('Use 12–128 characters for the new password.');
            return;
          }
          try {
            if (submitter?.value === 'revoke') await revoke({ currentPassword }).unwrap();
            else await change({ currentPassword, newPassword }).unwrap();
            router.replace('/login');
          } catch {
            /* Mutation error below. */
          }
        }}
      >
        <h3 className="font-semibold">Password and sessions</h3>
        <p className="text-sm text-muted-foreground">
          Changing your password or signing out all devices ends every active session, including
          this one.
        </p>
        <FormField id="current-password" label="Current password">
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            minLength={12}
            maxLength={128}
          />
        </FormField>
        <FormField id="new-password" label="New password">
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            maxLength={128}
          />
        </FormField>
        <div className="flex flex-wrap gap-3">
          <Button name="action" value="change" disabled={changing.isLoading || revoking.isLoading}>
            Change password
          </Button>
          <Button
            name="action"
            value="revoke"
            variant="outline"
            disabled={changing.isLoading || revoking.isLoading}
          >
            Sign out all devices
          </Button>
        </div>
        {validation && (
          <p role="alert" className="text-sm text-destructive">
            {validation}
          </p>
        )}
        {(changing.error || revoking.error) && (
          <ErrorState error={changing.error || revoking.error} />
        )}
      </form>
    </div>
  );
}
