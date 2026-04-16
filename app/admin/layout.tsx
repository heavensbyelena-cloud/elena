/**
 * Layout admin : vérification Supabase Auth (session sb-*).
 * Si non connecté ou pas admin, redirige.
 */
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
