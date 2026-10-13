import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
export const metadata: Metadata = { title: 'Your account', robots: { index: false } };
export default function ProfilePage() {
  redirect('/account/profile');
}
