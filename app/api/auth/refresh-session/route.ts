/**
 * POST /api/auth/refresh-session
 * Re-génère le JWT à partir de la session Supabase et du profil actuel (role/is_admin).
 * Utile après avoir mis à jour is_admin ou role dans Supabase sans se déconnecter.
 */
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import { createSessionToken, COOKIE_NAME } from '@/lib/jwt';
import type { UserRole } from '@/types';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const p = profile as { role?: string; is_admin?: boolean } | null;
    const role: UserRole =
      p?.role === 'admin' || p?.is_admin === true ? 'admin' : 'user';

    const token = await createSessionToken({
      sub: user.id,
      email: user.email ?? '',
      role,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ role, message: 'Session actualisée' });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
