/**
 * GET /api/auth/sync-session?then=/admin
 * Si une session Supabase existe, redirige vers then=.
 * Sinon redirige vers login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/** N'autorise que des chemins relatifs du site (évite l'open redirect). */
function safeRedirectPath(raw: string | null): string {
  if (!raw || typeof raw !== 'string') return '/admin';
  const trimmed = raw.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !/^\/[a-z]+:/i.test(trimmed)) {
    return trimmed;
  }
  return '/admin';
}

export async function GET(request: NextRequest) {
  const then = safeRedirectPath(request.nextUrl.searchParams.get('then'));

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.redirect(new URL(`/account/login?redirect=${encodeURIComponent(then)}`, request.url));
    }

    return NextResponse.redirect(new URL(then, request.url));
  } catch {
    return NextResponse.redirect(new URL('/account/login', request.url));
  }
}
