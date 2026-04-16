import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PREFIXES = ['/shop', '/home', '/product', '/cart', '/checkout', '/orders', '/legal'];
const ADMIN_PREFIX = '/admin';
const ACCOUNT_PREFIX = '/account';
/** Connexion / inscription : accessibles sans être connecté (sinon boucle de redirections). */
const ACCOUNT_PUBLIC_PATHS = new Set<string>([`${ACCOUNT_PREFIX}/login`, `${ACCOUNT_PREFIX}/register`]);

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}
function isAdminPath(pathname: string) {
  return pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + '/');
}
function isAccountPath(pathname: string) {
  return pathname === ACCOUNT_PREFIX || pathname.startsWith(ACCOUNT_PREFIX + '/');
}
function isPublicAccountPath(pathname: string) {
  return ACCOUNT_PUBLIC_PATHS.has(pathname);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Record<string, unknown>)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (isPublicPath(pathname)) return response;

  if (isAdminPath(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
    return response;
  }

  if (isAccountPath(pathname)) {
    if (isPublicAccountPath(pathname)) {
      return response;
    }
    if (!user) {
      return NextResponse.redirect(
        new URL('/account/login?redirect=' + encodeURIComponent(pathname), request.url)
      );
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/shop/:path*',
    '/home/:path*',
    '/admin',
    '/admin/:path*',
    '/account/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/product/:path*',
    '/orders/:path*',
    '/legal/:path*',
  ],
};
