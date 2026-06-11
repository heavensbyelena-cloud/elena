import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeRedirectPath } from '@/lib/safe-redirect';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function loginWithError(request: NextRequest, reason: string) {
  const login = new URL('/account/login', request.url);
  login.searchParams.set('error', reason);
  return NextResponse.redirect(login);
}

/** Traite le retour Supabase après clic sur « Confirmer mon e-mail » (code PKCE ou token_hash). */
export async function handleAuthEmailConfirm(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = safeRedirectPath(searchParams.get('next'));

  if (!code && !(tokenHash && type)) {
    const oauthError = searchParams.get('error_description') ?? searchParams.get('error');
    if (oauthError) {
      console.error('[auth/confirm] OAuth error:', oauthError);
    }
    return loginWithError(request, 'confirmation');
  }

  const successUrl = new URL(next, request.url);
  successUrl.searchParams.set('confirmed', '1');
  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.redirect(successUrl);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as Record<string, unknown>)
        );
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/confirm] exchangeCodeForSession:', error.message);
      return loginWithError(request, 'confirmation');
    }
    return response;
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash!,
    type: type as EmailOtpType,
  });
  if (error) {
    console.error('[auth/confirm] verifyOtp:', error.message);
    return loginWithError(request, 'confirmation');
  }

  return response;
}
