'use client';
import { useState } from 'react';
import { useGetAccountProfileQuery, useSaveAccountProfileMutation } from '@/store/api/accountApi';
import { LoadingSpinner, ErrorState } from '@/components/common/states';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/common/form-field';

export function AccountProfile() {
  const { data, isLoading, error, refetch } = useGetAccountProfileQuery();
  const [save, saving] = useSaveAccountProfileMutation();
  const [saved, setSaved] = useState(false);
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!data) return null;
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">My Profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">Keep your personal details up to date.</p>
      </div>
      <form
        aria-label="Profile details"
        className="space-y-5 rounded-2xl border p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaved(false);
          const fields = new FormData(event.currentTarget);
          try {
            await save({
              name: String(fields.get('name')),
              phone: String(fields.get('phone')),
            }).unwrap();
            setSaved(true);
          } catch {
            /* Mutation error below. */
          }
        }}
      >
        <FormField id="profile-name" label="Full name">
          <Input
            id="profile-name"
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            defaultValue={data.name}
          />
        </FormField>
        <FormField id="profile-email" label="Email address">
          <Input id="profile-email" type="email" value={data.email} readOnly />
        </FormField>
        <p className="text-xs text-muted-foreground">
          Your sign-in email is protected and cannot be changed here.
        </p>
        <FormField id="profile-phone" label="Phone number">
          <Input
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            defaultValue={data.phone ?? ''}
          />
        </FormField>
        <p className="text-sm text-muted-foreground">
          Member since {new Date(data.createdAt).toLocaleDateString()}
        </p>
        <Button disabled={saving.isLoading}>{saving.isLoading ? 'Saving…' : 'Save profile'}</Button>
        {saved && (
          <p role="status" className="text-sm text-green-700">
            Profile saved.
          </p>
        )}
        {saving.error && <ErrorState error={saving.error} />}
      </form>
    </div>
  );
}
