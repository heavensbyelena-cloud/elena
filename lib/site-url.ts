import type { NextRequest } from 'next/server';

/**
 * URL publique par défaut (CGV / checklist déploiement) si NEXT_PUBLIC_SITE_URL est absent.
 */
export const DEFAULT_PUBLIC_SITE_URL = 'https://www.heavensbyelena.com';

function normalizeSiteUrl(raw: string): string {
  return raw.replace(/\/$/, '');
}

function isLocalHost(host: string): boolean {
  return (
    host.includes('localhost') ||
    host.startsWith('127.0.0.1') ||
    /\.local(:\d+)?$/.test(host)
  );
}

function isLocalUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1');
}

/**
 * URL publique du site (Stripe success/cancel, emails, redirections Supabase).
 */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    const url = normalizeSiteUrl(raw);
    if (process.env.NODE_ENV === 'production' && isLocalUrl(url)) {
      return DEFAULT_PUBLIC_SITE_URL;
    }
    return url;
  }
  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_PUBLIC_SITE_URL;
  }
  return 'http://localhost:3000';
}

export type SiteUrlCheck = { ok: true } | { ok: false; reason: string };

/**
 * En production, vérifie que l’URL publique effective (env ou repli) est utilisable pour Stripe.
 */
export function checkProductionSiteUrl(): SiteUrlCheck {
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true };
  }
  const effective = getPublicSiteUrl();
  if (isLocalUrl(effective)) {
    return {
      ok: false,
      reason: 'URL publique du site invalide (localhost en production)',
    };
  }
  if (!effective.startsWith('https://')) {
    return {
      ok: false,
      reason: 'URL publique du site doit commencer par https:// en production',
    };
  }
  return { ok: true };
}

/**
 * URL de base pour emailRedirectTo (inscription, renvoi de confirmation).
 * En production : jamais de fallback localhost.
 */
export function siteUrlFromRequest(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const url = normalizeSiteUrl(fromEnv);
    if (process.env.NODE_ENV === 'production' && isLocalUrl(url)) {
      return DEFAULT_PUBLIC_SITE_URL;
    }
    return url;
  }

  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');

  if (host && !isLocalHost(host)) {
    return normalizeSiteUrl(`${proto}://${host}`);
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_PUBLIC_SITE_URL;
  }

  if (host && isLocalHost(host)) {
    return normalizeSiteUrl(`${proto}://${host}`);
  }

  return 'http://localhost:3000';
}
