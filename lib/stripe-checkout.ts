import Stripe from 'stripe';

/** URLs d’images acceptées par Stripe Checkout (HTTPS public). */
export function stripeProductImages(imageUrl: unknown): string[] | undefined {
  if (typeof imageUrl !== 'string') return undefined;
  const url = imageUrl.trim();
  if (!url.startsWith('https://')) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return undefined;
    return [parsed.toString()];
  } catch {
    return undefined;
  }
}

export function isStripeImageError(err: unknown): boolean {
  if (!(err instanceof Stripe.errors.StripeError)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('image') ||
    msg.includes('url') ||
    err.code === 'url_invalid' ||
    err.code === 'parameter_invalid_empty'
  );
}

export function stripePaymentErrorMessage(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) {
    if (
      err.type === 'StripeAuthenticationError' ||
      err.code === 'api_key_expired' ||
      err.code === 'invalid_api_key'
    ) {
      return 'Configuration Stripe incorrecte sur le serveur (clé secrète). Contactez le support.';
    }
    if (err.code === 'amount_too_small') {
      return 'Le montant est trop faible pour un paiement par carte (minimum 0,50 €).';
    }
    if (err.code === 'rate_limit') {
      return 'Trop de tentatives de paiement. Réessayez dans quelques instants.';
    }
    if (err.code === 'email_invalid') {
      return 'Adresse e-mail invalide. Vérifiez votre email.';
    }
    if (err.type === 'StripeConnectionError') {
      return 'Connexion à Stripe impossible. Réessayez dans quelques instants.';
    }
    if (isStripeImageError(err)) {
      return 'Le paiement n’a pas pu démarrer (image produit). Réessayez.';
    }
    if (err.type === 'StripeInvalidRequestError' && err.message) {
      return `Paiement refusé par Stripe : ${err.message}`;
    }
    return 'Le paiement n’a pas pu être initialisé. Vérifiez vos informations ou réessayez.';
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: unknown }).message);
    if (/orders|insert|violates|foreign key/i.test(msg)) {
      return 'La commande n’a pas pu être enregistrée. Réessayez ou contactez le support.';
    }
  }

  return 'Erreur lors de la création du paiement';
}

export function lineItemsTotalCents(
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
): number {
  return lineItems.reduce((sum, item) => {
    const unit = item.price_data?.unit_amount ?? 0;
    const qty = item.quantity ?? 1;
    return sum + unit * qty;
  }, 0);
}

/** Crée la session ; en cas d’échec lié aux images, réessaie sans images. */
export async function createStripeCheckoutSession(
  stripe: Stripe,
  params: Stripe.Checkout.SessionCreateParams,
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.create({
      ...params,
      line_items: lineItems,
    });
  } catch (err) {
    if (!isStripeImageError(err)) throw err;

    const withoutImages = lineItems.map((item) => {
      if (!item.price_data?.product_data) return item;
      return {
        ...item,
        price_data: {
          ...item.price_data,
          product_data: {
            ...item.price_data.product_data,
            images: undefined,
          },
        },
      };
    });

    return stripe.checkout.sessions.create({
      ...params,
      line_items: withoutImages,
    });
  }
}

function verboseCheckoutErrors(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.CHECKOUT_VERBOSE_ERRORS === '1'
  );
}

export function checkoutErrorResponse(
  err: unknown
): { error: string; details?: string; code?: string } {
  const body: { error: string; details?: string; code?: string } = {
    error: stripePaymentErrorMessage(err),
  };
  if (err instanceof Stripe.errors.StripeError) {
    body.code = err.code ?? err.type;
  }
  if (verboseCheckoutErrors() && err instanceof Error) {
    body.details = err.message;
  }
  return body;
}

export { verboseCheckoutErrors };
