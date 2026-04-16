/**
 * POST /api/auth/register
 *
 * 1) auth.signUp (clé anon) → le serveur d’auth envoie l’email de confirmation (souvent via SMTP
 *    Brevo configuré dans le dashboard Supabase). auth.admin.createUser ne déclenche pas ce flux.
 * 2) upsert profiles avec la service role.
 *
 * Débogage : REGISTER_VERBOSE_ERRORS=1 dans .env.local → le JSON d’erreur inclut `details`.
 *
 * Sans SMTP (ex. Brevo) correctement configuré côté Supabase, signUp peut échouer : si l’erreur
 * concerne l’envoi d’email, on retombe
 * automatiquement sur auth.admin.createUser (email déjà confirmé) pour que l’inscription aboutisse.
 * Pour désactiver ce repli : REGISTER_DISABLE_EMAIL_FALLBACK=1
 * Pour n’utiliser que l’admin (jamais d’email) : REGISTER_AUTO_CONFIRM_EMAIL=1
 *
 * Dashboard Supabase : Authentication → URL Configuration (voir aussi
 * supabase/email-templates/BREVO_SMTP_SUPABASE.txt).
 * - Site URL : ex. http://localhost:3000 ou ton domaine
 * - Redirect URLs : inclure http://localhost:3000/** et https://tondomaine/**
 */
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { createAdminClient, createAnonAuthClient } from '@/lib/supabase-server';
import { checkAuthRateLimit } from '@/lib/rate-limit';

type ProfileErr = { message: string; code?: string; hint?: string };

/**
 * Après signUp, la ligne auth.users peut être visible avec un léger délai.
 * Sans attendre, l’INSERT dans profiles viole souvent profiles_id_fkey (FK vers auth.users).
 */
async function waitForAuthUserReady(
  admin: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const maxAttempts = 25;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (!error && data?.user?.id === userId) {
      if (attempt > 0) {
        console.info(
          `[register] auth.users visible après ${attempt + 1} tentative(s)`
        );
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 120 + attempt * 40));
  }
  console.warn(
    '[register] getUserById toujours vide après attente — sync profil quand même'
  );
}

function isFkProfileError(err: ProfileErr): boolean {
  return /profiles_id_fkey|foreign key constraint/i.test(err.message);
}

/**
 * Attente + sync ; en cas d’échec FK (délai réplication), une seconde tentative après 2 s.
 */
async function syncProfileForNewUserWithRetry(
  admin: SupabaseClient<Database>,
  userId: string,
  email: string,
  firstName: string
): Promise<{ error: ProfileErr | null }> {
  await waitForAuthUserReady(admin, userId);
  let result = await syncProfileForNewUser(admin, userId, email, firstName);
  if (result.error && isFkProfileError(result.error)) {
    console.warn('[register] FK sur profiles — nouvelle tentative après délai');
    await new Promise((r) => setTimeout(r, 2000));
    await waitForAuthUserReady(admin, userId);
    result = await syncProfileForNewUser(admin, userId, email, firstName);
  }
  return result;
}

/**
 * Synchronise public.profiles après signUp.
 * 1) RPC SQL `sync_profile_after_signup` (SECURITY DEFINER) — fiable si la migration est appliquée.
 * 2) Sinon repli PostgREST (upsert / insert minimal).
 */
async function syncProfileForNewUser(
  admin: SupabaseClient<Database>,
  userId: string,
  email: string,
  firstName: string
): Promise<{ error: ProfileErr | null }> {
  const fn = firstName || null;

  const { error: rpcErr } = await admin.rpc('sync_profile_after_signup', {
    p_user_id: userId,
    p_email: email,
    p_first_name: firstName,
  });

  if (!rpcErr) {
    return { error: null };
  }

  console.warn('[register] RPC sync_profile_after_signup:', rpcErr.message, rpcErr);

  const fallback = await syncProfileForNewUserFallback(admin, userId, email, fn);
  if (!fallback.error) {
    return { error: null };
  }

  const rpcMsg = rpcErr.message ?? '';
  const fbMsg = fallback.error.message ?? '';
  return {
    error: {
      message: `RPC: ${rpcMsg} | JS: ${fbMsg}`,
      code: (rpcErr as { code?: string }).code ?? fallback.error.code,
      hint: (rpcErr as { hint?: string }).hint ?? fallback.error.hint,
    },
  };
}

async function syncProfileForNewUserFallback(
  admin: SupabaseClient<Database>,
  userId: string,
  email: string,
  fn: string | null
): Promise<{ error: ProfileErr | null }> {
  const patchWithRole = {
    email,
    first_name: fn,
    is_admin: false as const,
    role: 'user' as const,
  };

  const patchNoRole = {
    email,
    first_name: fn,
    is_admin: false as const,
  };

  const minimalUpsert = {
    id: userId,
    email,
    first_name: fn,
    is_admin: false as const,
  };

  let { error: upErr } = await admin
    .from('profiles')
    .upsert(
      { ...minimalUpsert, role: 'user' as const },
      { onConflict: 'id' }
    );
  if (!upErr) return { error: null };
  console.warn('[register] upsert + role:', upErr.message);

  ({ error: upErr } = await admin
    .from('profiles')
    .upsert(minimalUpsert, { onConflict: 'id' }));
  if (!upErr) return { error: null };
  console.warn('[register] upsert minimal:', upErr.message);

  const { data: existing, error: selErr } = await admin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (selErr) {
    return { error: selErr };
  }

  if (existing) {
    let { error } = await admin
      .from('profiles')
      .update(patchWithRole)
      .eq('id', userId);
    if (!error) return { error: null };
    ({ error } = await admin
      .from('profiles')
      .update(patchNoRole)
      .eq('id', userId));
    return { error: error ?? null };
  }

  const insertFull = {
    id: userId,
    email,
    first_name: fn,
    last_name: null as string | null,
    is_admin: false as const,
    role: 'user' as const,
  };

  let { error: insErr } = await admin.from('profiles').insert(insertFull);
  if (!insErr) return { error: null };

  if (insErr.code === '23505' || /duplicate key/i.test(insErr.message)) {
    let { error: up } = await admin
      .from('profiles')
      .update(patchWithRole)
      .eq('id', userId);
    if (!up) return { error: null };
    ({ error: up } = await admin
      .from('profiles')
      .update(patchNoRole)
      .eq('id', userId));
    return { error: up ?? null };
  }

  const { error: ins2 } = await admin.from('profiles').insert({
    id: userId,
    email,
    first_name: fn,
    last_name: null,
    is_admin: false,
  });

  if (!ins2) return { error: null };

  const { error: ins3 } = await admin.from('profiles').insert({
    id: userId,
    email,
    is_admin: false,
  });

  return { error: ins3 ?? ins2 };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function siteUrlFromRequest(request: NextRequest): string {
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';

  /** En local, utiliser l’hôte de la requête pour emailRedirectTo (sinon NEXT_PUBLIC_SITE_URL prod casse les tests). */
  const isLocalDev =
    !!host &&
    (host.includes('localhost') ||
      host.startsWith('127.0.0.1') ||
      /\.local(:\d+)?$/.test(host));

  if (isLocalDev && host) {
    return `${proto}://${host}`;
  }

  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  if (host) return `${proto}://${host}`;
  return 'http://localhost:3000';
}

function verboseErrors(): boolean {
  return process.env.REGISTER_VERBOSE_ERRORS === '1';
}

/** Erreurs GoTrue liées à l’envoi d’email (SMTP non configuré, quota, etc.). */
function isEmailDeliveryError(message: string): boolean {
  const m = (message || '').toLowerCase();
  if (
    /already registered|invalid email|invalid login|wrong password|user not found/i.test(m)
  ) {
    return false;
  }
  return /smtp|send(ing)?|confirmation.*email|deliver|mail provider|postmark|mailgun|sendgrid|ses|could not send|unable to send|failed to send|error sending|email rate|mail quota|mail server|transactional/i.test(
    m
  );
}

/**
 * Création compte via API admin : email marqué confirmé, aucun mail envoyé.
 * Utilisé si REGISTER_AUTO_CONFIRM_EMAIL=1 ou en secours si signUp échoue sur l’email.
 */
async function registerViaAdminAutoConfirm(
  email: string,
  password: string,
  first_name: string,
  reason: 'env' | 'email_fallback'
): Promise<NextResponse> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: first_name || null },
  });

  if (error) {
    const msg = (error as Error).message ?? '';
    if (/already|registered|duplicate|exists/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            'Cet email est déjà enregistré. Essaie de te connecter, ou utilise « mot de passe oublié » sur la page de connexion si besoin.',
        },
        { status: 409 }
      );
    }
    console.error('[register] admin createUser:', error);
    return NextResponse.json(
      {
        error: 'Création du compte impossible.',
        ...(verboseErrors() ? { details: msg } : {}),
      },
      { status: 500 }
    );
  }

  if (!data.user) {
    return NextResponse.json({ error: 'Réponse serveur inattendue.' }, { status: 500 });
  }

  const { error: profileError } = await syncProfileForNewUserWithRetry(
    admin,
    data.user.id,
    email,
    first_name
  );

  if (profileError) {
    console.error('[register] sync profil (admin):', profileError);
    const showTech =
      verboseErrors() || process.env.NODE_ENV === 'development';
    const isFk = isFkProfileError(profileError);
    return NextResponse.json(
      {
        error: isFk
          ? 'Compte créé mais la fiche client n’a pas pu être liée (délai base de données). Réessaie dans 10 secondes ou connecte-toi : le profil peut se compléter tout seul.'
          : 'Compte créé mais la fiche client n’a pas pu être enregistrée. Essaie de te connecter.',
        ...(showTech
          ? {
              details: profileError.message,
              code: profileError.code,
              hint: profileError.hint,
            }
          : {}),
      },
      { status: 500 }
    );
  }

  const message =
    reason === 'env'
      ? 'Compte créé. Tu peux te connecter tout de suite (inscription sans email de confirmation).'
      : 'Compte créé. L’email de confirmation n’a pas pu être envoyé, mais ton compte est actif : tu peux te connecter tout de suite.';

  return NextResponse.json(
    {
      message,
      needsEmailConfirmation: false,
      usedAutoConfirm: true,
    },
    { status: 201 }
  );
}

/** Message affiché au client (sans fuite technique sauf mode verbose). */
function mapSignUpError(message: string): string {
  const m = message || '';
  if (/already registered|already been registered|User already registered|duplicate/i.test(m)) {
    return 'Cet email est déjà utilisé.';
  }
  if (/Database error saving new user|database error/i.test(m)) {
    return 'Erreur côté base (souvent un trigger sur auth.users ou la table profiles). Ouvre les logs Auth dans le dashboard Supabase.';
  }
  if (/confirm.*email|confirmation email|sending.*email|smtp|mail/i.test(m)) {
    return 'L’envoi de l’email a échoué. Vérifie le SMTP (ex. Brevo) dans Authentication → Emails du projet, ou désactive temporairement « Confirm email » pour tester.';
  }
  if (/rate|too many/i.test(m)) {
    return 'Trop de tentatives. Réessayez dans quelques minutes.';
  }
  if (/password/i.test(m) && /weak|short|length|policy/i.test(m)) {
    return 'Mot de passe refusé (longueur ou complexité).';
  }
  return m.length > 0 && m.length < 220 ? m : "Inscription impossible. Réessaie ou contacte le support.";
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
    const first_name =
      typeof body.first_name === 'string' ? body.first_name.trim() : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mot de passe trop court (6 caractères minimum)' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète (URL du projet).' },
        { status: 503 }
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète (clé anon).' },
        { status: 503 }
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      console.error('[register] SUPABASE_SERVICE_ROLE_KEY manquant');
      return NextResponse.json(
        { error: 'Inscription indisponible (configuration serveur).' },
        { status: 503 }
      );
    }

    /** Inscription uniquement par API admin (pas d’email de confirmation). */
    if (process.env.REGISTER_AUTO_CONFIRM_EMAIL === '1') {
      return registerViaAdminAutoConfirm(email, password, first_name, 'env');
    }

    const origin = siteUrlFromRequest(request);
    const emailRedirectTo = `${origin}/account/login`;
    if (process.env.NODE_ENV === 'development') {
      console.info('[register] emailRedirectTo =', emailRedirectTo);
    }

    const anon = createAnonAuthClient();
    const { data: signUpData, error: signUpError } = await anon.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: first_name || undefined },
        emailRedirectTo,
      },
    });

    if (signUpError) {
      console.error('[register] signUp:', signUpError.message, signUpError);

      const fallbackDisabled =
        process.env.REGISTER_DISABLE_EMAIL_FALLBACK === '1';
      if (
        !fallbackDisabled &&
        isEmailDeliveryError(signUpError.message)
      ) {
        console.warn(
          '[register] échec envoi email → secours admin (email_confirm: true)'
        );
        return registerViaAdminAutoConfirm(
          email,
          password,
          first_name,
          'email_fallback'
        );
      }

      const mapped = mapSignUpError(signUpError.message);
      return NextResponse.json(
        {
          error: mapped,
          ...(verboseErrors()
            ? {
                details: signUpError.message,
                code: (signUpError as { code?: string }).code,
              }
            : {}),
        },
        { status: 400 }
      );
    }

    const user = signUpData.user;
    if (!user) {
      return NextResponse.json(
        {
          error:
            'Inscription incomplète (réponse serveur sans utilisateur). Réessaie ou vérifie si cet email existe déjà.',
          ...(verboseErrors() ? { details: 'signUpData.user is null' } : {}),
        },
        { status: 422 }
      );
    }

    const admin = createAdminClient();

    const { error: profileError } = await syncProfileForNewUserWithRetry(
      admin,
      user.id,
      email,
      first_name
    );

    if (profileError) {
      console.error('[register] sync profil:', profileError);
      const showTech =
        verboseErrors() || process.env.NODE_ENV === 'development';
      const isFk = isFkProfileError(profileError);
      return NextResponse.json(
        {
          error: isFk
            ? 'Compte créé mais la fiche client n’a pas pu être liée (délai base de données). Réessaie dans 10 secondes ou connecte-toi : le profil peut se compléter tout seul.'
            : 'Compte créé mais la fiche client n’a pas pu être enregistrée. Essaie de te connecter ; sinon contacte le support.',
          ...(showTech
            ? {
                details: profileError.message,
                code: profileError.code,
                hint: profileError.hint,
              }
            : {}),
        },
        { status: 500 }
      );
    }

    const needsEmailConfirmation = signUpData.session == null;

    const message = needsEmailConfirmation
      ? 'Compte créé. Vérifie ta boîte email (et les spams) : un lien de confirmation vient de t’être envoyé.'
      : 'Compte créé. Tu peux te connecter sans confirmer ton email : la confirmation par email est désactivée dans les réglages d’authentification du projet.';

    return NextResponse.json(
      {
        message,
        needsEmailConfirmation,
        usedAutoConfirm: false,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[register] catch:', err);
    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la création du compte.',
        ...(verboseErrors() ? { details: msg } : {}),
      },
      { status: 500 }
    );
  }
}
