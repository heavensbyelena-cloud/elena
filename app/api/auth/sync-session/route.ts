/**
 * GET /api/auth/sync-session?then=/admin
 * Si une session Supabase existe, pose le cookie JWT (avec le bon role) puis redirige vers then=.
 * Sinon redirige vers login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import { createSessionToken, COOKIE_NAME } from '@/lib/jwt';
import type { UserRole } from '@/types';

/** N'autorise que des chemins relatifs du site (évite l'open redirect). */
function safeRedirectPath(raw: string | null): string {
  if (!raw || typeof raw !== 'string') return '/admin';
  const trimmed = raw.trim();
  // Doit commencer par / et ne pas être une URL (pas de "//" ni de protocole)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !/^\/[a-z]+:/i.test(trimmed)) {
    return trimmed;
  }
  return '/admin';
}

export async function GET(request: NextRequest) {
  const then = safeRedirectPath(request.nextUrl.searchParams.get('then'));

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL(`/account/login?redirect=${encodeURIComponent(then)}`, request.url));
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
    const response = NextResponse.redirect(new URL(then, request.url));
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL('/account/login', request.url));
  }
}
