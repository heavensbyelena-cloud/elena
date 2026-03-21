import { createServerSupabaseClient } from './supabase-server';
import type { UserProfile } from '@/types';

/**
 * Récupérer l'utilisateur connecté (Server Component / API Route)
 * Retourne null si non connecté
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, is_admin, role')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    const role = (profile as { role?: string }).role === 'admin' ? 'admin' : 'user';
    return {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name ?? undefined,
      last_name: profile.last_name ?? undefined,
      is_admin: profile.is_admin ?? role === 'admin',
      role,
    };
  } catch {
    return null;
  }
}

/**
 * Vérifier si l'utilisateur courant est admin (role ou is_admin)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin' || user?.is_admin === true;
}

/**
 * Protéger une route — redirige si non connecté
 * À utiliser dans les Server Components avec redirect()
 */
export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect('/account/login');
  }
  return user;
}

/**
 * Protéger une route admin — redirige si non admin (role ou is_admin)
 */
export async function requireAdmin(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && !user.is_admin)) {
    const { redirect } = await import('next/navigation');
    redirect('/shop');
  }
  return user;
}
