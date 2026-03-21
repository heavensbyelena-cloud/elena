import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { COOKIE_NAME } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  } catch {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }
}
