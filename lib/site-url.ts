/**
 * URL publique du site (Stripe success/cancel, emails, redirections Supabase).
 */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return raw?.replace(/\/$/, '') || 'http://localhost:3000';
}

export type SiteUrlCheck = { ok: true } | { ok: false; reason: string };

/**
 * En production, refuse une config dangereuse (localhost ou HTTPS manquant).
 */
export function checkProductionSiteUrl(): SiteUrlCheck {
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true };
  }
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    return { ok: false, reason: 'NEXT_PUBLIC_SITE_URL est manquant' };
  }
  if (raw.includes('localhost') || raw.includes('127.0.0.1')) {
    return { ok: false, reason: 'NEXT_PUBLIC_SITE_URL ne doit pas pointer vers localhost en production' };
  }
  if (!raw.startsWith('https://')) {
    return { ok: false, reason: 'NEXT_PUBLIC_SITE_URL doit commencer par https:// en production' };
  }
  return { ok: true };
}
