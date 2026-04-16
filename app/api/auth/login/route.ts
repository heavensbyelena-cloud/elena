/**
 * POST /api/auth/login
 * Vérifie email/mdp via Supabase, pose les cookies sb-* via setAll.
 * Rate limiting appliqué sur /api/auth.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-server';
import { checkAuthRateLimit } from '@/lib/rate-limit';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  if (!checkAuthRateLimit(request)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez plus tard.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format d’email invalide' },
        { status: 400 }
      );
    }

    const response = NextResponse.json(
      { user: { email }, message: 'Connexion réussie' },
      { status: 200 }
    );

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Record<string, unknown>);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      const admin = createAdminClient();
      const { data: profile } = await admin.from('profiles').select('*').eq('id', data.user.id).single();
      const p = profile as { role?: string; is_admin?: boolean } | null;
      console.log('[login] Profil:', { profileRole: p?.role, is_admin: p?.is_admin });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
