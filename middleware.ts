/**
 * Middleware — Protection des routes selon le type d'accès.
 * - Public : /shop, /home, /product, /cart, /checkout, /orders, /legal
 * - Admin seulement : /admin
 * - Utilisateur connecté (user ou admin) : /account
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/jwt';

/** Routes publiques : accessibles sans connexion */
const PUBLIC_PREFIXES = ['/shop', '/home', '/product', '/cart', '/checkout', '/orders', '/legal'];

/** Routes admin : réservées aux admins */
const ADMIN_PREFIX = '/admin';

/** Routes compte : nécessitent une session (user ou admin) */
const ACCOUNT_PREFIX = '/account';

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + '/');
}

function isAccountPath(pathname: string): boolean {
  return pathname === ACCOUNT_PREFIX || pathname.startsWith(ACCOUNT_PREFIX + '/');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME);
  const token = sessionCookie?.value ?? null;

  let payload: Awaited<ReturnType<typeof verifySessionToken>> = null;
  if (token) {
    try {
      payload = await verifySessionToken(token);
    } catch {
      // JWT invalide ou expiré
    }
  }

  if (isAdminPath(pathname)) {
    if (!token || !payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (isAccountPath(pathname)) {
    if (!token || !payload) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/shop/:path*',
    '/home/:path*',
    '/admin/:path*',
    '/account/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/product/:path*',
    '/orders/:path*',
    '/legal/:path*',
  ],
};
