/**
 * Layout admin : vérification du JWT côté serveur (Node).
 * Si pas de cookie JWT, on tente sync-session (récupère session Supabase, pose JWT, redirige ici).
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, COOKIE_NAME } from '@/lib/jwt';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect('/api/auth/sync-session?then=/admin');
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    redirect('/api/auth/sync-session?then=/admin');
  }

  if (payload.role !== 'admin') {
    redirect('/shop?admin_required=1');
  }

  return <>{children}</>;
}
