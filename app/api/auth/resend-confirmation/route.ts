/**
 * POST /api/auth/resend-confirmation
 * Renvoie l’email de confirmation d’inscription (même canal SMTP que configuré dans le projet, ex. Brevo).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAnonAuthClient } from '@/lib/supabase-server';
import { checkAuthRateLimit } from '@/lib/rate-limit';

function siteUrlFromRequest(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const isLocalDev =
    !!host &&
    (host.includes('localhost') ||
      host.startsWith('127.0.0.1') ||
      /\.local(:\d+)?$/.test(host));
  if (isLocalDev && host) return `${proto}://${host}`;
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  if (host) return `${proto}://${host}`;
  return 'http://localhost:3000';
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
    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    ) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète.' },
        { status: 503 }
      );
    }

    const origin = siteUrlFromRequest(request);
    const anon = createAnonAuthClient();
    const { error } = await anon.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${origin}/account/login`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Impossible de renvoyer l’email.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message:
        'Si un compte non confirmé existe pour cet email, un nouveau message a été envoyé.',
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
