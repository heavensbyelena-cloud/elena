/**
 * GET /api/auth/sync-session?then=/admin
 * Si une session Supabase existe, redirige vers then=.
 * Sinon redirige vers login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { safeRedirectPath } from '@/lib/safe-redirect';

export async function GET(request: NextRequest) {
  const then = safeRedirectPath(request.nextUrl.searchParams.get('then'), '/admin');

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
