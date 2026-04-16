import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from './supabase-server';
import type { UserProfile } from '@/types';

type ProfileRow = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_admin?: boolean | null;
  role?: string | null;
};

function rowToUserProfile(p: ProfileRow): UserProfile {
  const role = p.role === 'admin' ? 'admin' : 'user';
  return {
    id: p.id,
    email: p.email,
    first_name: p.first_name ?? undefined,
    last_name: p.last_name ?? undefined,
    is_admin: p.is_admin ?? role === 'admin',
    role,
  };
}

/**
 * Charge la ligne profiles pour un id (session déjà validée).
 * Si RLS bloque le client anon, lecture de secours via service_role uniquement pour cet id.
 */
async function loadProfileForUserId(userId: string): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data: viaAnon, error: anonError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (viaAnon) return rowToUserProfile(viaAnon as ProfileRow);

  try {
    const admin = createAdminClient();
    const { data: viaService } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!viaService) return null;
    return rowToUserProfile(viaService as ProfileRow);
  } catch {
    return null;
  }
}

/**
 * Session Supabase + profil.
 * `hasSession` = JWT valide (Déconnexion).
 * `user` = profil complet si la ligne existe (anon puis secours service pour cet id si RLS bloque).
 */
export async function getAuthAndProfile(): Promise<{
  hasSession: boolean;
  user: UserProfile | null;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return { hasSession: false, user: null };

    const profileUser = await loadProfileForUserId(user.id);
    return { hasSession: true, user: profileUser };
  } catch {
    return { hasSession: false, user: null };
  }
}

/**
 * Récupérer l'utilisateur connecté (Server Component / API Route)
 * Retourne null si non connecté ou profil absent
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const { user } = await getAuthAndProfile();
  return user;
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
    return null as never;
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
    return null as never;
  }
  return user;
}

/**
 * Vérifie que la requête API est faite par un admin (Supabase session + profile.role/admin).
 * À utiliser dans les Route Handlers.
 */
export async function requireAdminApi(): Promise<{ user: UserProfile } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (user.role !== 'admin' && !user.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  return { user };
}
