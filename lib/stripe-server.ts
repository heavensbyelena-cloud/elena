import Stripe from 'stripe';

/** Crypto Web API — requis pour vérifier les webhooks sur Cloudflare Workers. */
export const stripeWebCrypto = Stripe.createSubtleCryptoProvider();

/** Nettoie une clé copiée depuis le dashboard (espaces, guillemets). */
export function normalizeStripeSecretKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  return key || undefined;
}

function stripeKeyAccountId(key: string): string | null {
  const match = key.match(/^(?:sk|pk)_(?:live|test)_([A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}

export type StripeSecretKeyCheck =
  | { ok: true; mode: 'live' | 'test' }
  | { ok: false; message: string; code: string };

/** Vérifie le format de la clé secrète avant l’appel Stripe (sans exposer la clé). */
export function validateStripeSecretKey(
  secretKey: string | undefined,
  publicKey?: string
): StripeSecretKeyCheck {
  const key = normalizeStripeSecretKey(secretKey);
  if (!key) {
    return {
      ok: false,
      code: 'stripe_key_missing',
      message: 'Clé Stripe secrète absente sur le serveur (STRIPE_SECRET_KEY).',
    };
  }

  if (key.startsWith('pk_')) {
    return {
      ok: false,
      code: 'stripe_key_is_public',
      message:
        'STRIPE_SECRET_KEY contient une clé publique (pk_…). Collez la clé secrète sk_live_… depuis Stripe.',
    };
  }

  const mode = key.startsWith('sk_live_')
    ? 'live'
    : key.startsWith('sk_test_')
      ? 'test'
      : null;

  if (!mode) {
    return {
      ok: false,
      code: 'stripe_key_invalid_format',
      message:
        'STRIPE_SECRET_KEY invalide : elle doit commencer par sk_live_… (production) ou sk_test_… (test).',
    };
  }

  if (key.length < 80) {
    return {
      ok: false,
      code: 'stripe_key_truncated',
      message:
        'STRIPE_SECRET_KEY semble incomplète. Recopiez toute la clé secrète depuis Stripe (Révéler la clé).',
    };
  }

  if (/\s/.test(key)) {
    return {
      ok: false,
      code: 'stripe_key_whitespace',
      message: 'STRIPE_SECRET_KEY contient des espaces. Recopiez la clé sans espace.',
    };
  }

  const pub = normalizeStripeSecretKey(publicKey) ?? publicKey?.trim();
  if (pub) {
    if (pub.startsWith('sk_')) {
      return {
        ok: false,
        code: 'stripe_public_is_secret',
        message:
          'NEXT_PUBLIC_STRIPE_PUBLIC_KEY contient une clé secrète. Utilisez pk_live_… (clé publique).',
      };
    }
    const pubMode = pub.startsWith('pk_live_')
      ? 'live'
      : pub.startsWith('pk_test_')
        ? 'test'
        : null;
    if (pubMode && pubMode !== mode) {
      return {
        ok: false,
        code: 'stripe_key_mode_mismatch',
        message: `Clés Stripe incohérentes : la secrète est en mode ${mode} mais la publique en mode ${pubMode}.`,
      };
    }
    const secretAccount = stripeKeyAccountId(key);
    const publicAccount = stripeKeyAccountId(pub);
    if (secretAccount && publicAccount && secretAccount !== publicAccount) {
      return {
        ok: false,
        code: 'stripe_key_account_mismatch',
        message:
          'Les clés Stripe publique et secrète ne proviennent pas du même compte Stripe. Recopiez la paire depuis la même page Clés API.',
      };
    }
  }

  return { ok: true, mode };
}

/**
 * Client Stripe compatible Cloudflare Workers (fetch au lieu de node:https).
 * @see https://opennext.js.org/cloudflare/howtos/stripeAPI
 */
export function getStripeClient(): Stripe {
  const secretKey = normalizeStripeSecretKey(process.env.STRIPE_SECRET_KEY);
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY manquant');
  }

  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}
