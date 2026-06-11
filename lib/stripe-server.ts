import Stripe from 'stripe';

/** Crypto Web API — requis pour vérifier les webhooks sur Cloudflare Workers. */
export const stripeWebCrypto = Stripe.createSubtleCryptoProvider();

/**
 * Client Stripe compatible Cloudflare Workers (fetch au lieu de node:https).
 * @see https://opennext.js.org/cloudflare/howtos/stripeAPI
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY manquant');
  }

  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}
