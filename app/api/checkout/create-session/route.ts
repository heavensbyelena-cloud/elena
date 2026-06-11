import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { devLog } from '@/lib/dev-log';
import { checkProductionSiteUrl, getPublicSiteUrl } from '@/lib/site-url';
import { normalizeProductId } from '@/lib/utils';
import {
  checkoutErrorResponse,
  createStripeCheckoutSession,
  lineItemsTotalCents,
  stripeProductImages,
  stripePaymentErrorMessage,
} from '@/lib/stripe-checkout';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

type AdminClient = ReturnType<typeof createAdminClient>;

async function validatePromoForCheckout(
  admin: AdminClient,
  promoId: string,
  cartSubtotal: number,
  claimedDiscount: number,
  userId: string | null
): Promise<{ ok: true; discount: number } | { ok: false; message: string }> {
  if (!userId) {
    return { ok: false, message: 'Connexion requise pour utiliser un code promo' };
  }

  const { data: promoRow, error } = await (admin as any)
    .from('promo_codes')
    .select('*')
    .eq('id', promoId)
    .eq('active', true)
    .maybeSingle();

  if (error || !promoRow) {
    return { ok: false, message: 'Code promo invalide' };
  }

  const promo = promoRow as {
    id: string;
    value: number;
    min_order: number | null;
    max_uses: number | null;
    uses_count: number;
    is_personal: boolean;
    expires_at: string | null;
  };

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { ok: false, message: 'Code promo expiré' };
  }

  if (promo.min_order != null && cartSubtotal < promo.min_order) {
    return { ok: false, message: 'Montant minimum non atteint' };
  }

  if (promo.max_uses != null && promo.uses_count >= promo.max_uses) {
    return { ok: false, message: 'Code promo invalide' };
  }

  const expectedDiscount =
    Math.round((cartSubtotal * Number(promo.value)) / 100 * 100) / 100;

  if (Math.abs(expectedDiscount - claimedDiscount) > 0.02) {
    return { ok: false, message: 'Montant de remise invalide' };
  }

  if (promo.is_personal) {
    const { data: assignment } = await (admin as any)
      .from('promo_code_users')
      .select('*')
      .eq('promo_code_id', promo.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!assignment) return { ok: false, message: 'Code non autorisé pour ce compte' };

    const a = assignment as { max_uses: number; uses_count: number };
    if (a.uses_count >= a.max_uses) {
      return { ok: false, message: 'Code non autorisé pour ce compte' };
    }
  } else {
    const { data: usage } = await (admin as any)
      .from('promo_code_usages')
      .select('id')
      .eq('promo_code_id', promo.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (usage) return { ok: false, message: 'Code déjà utilisé' };
  }

  return { ok: true, discount: expectedDiscount };
}

export async function POST(request: NextRequest) {
  devLog('[create-session] STRIPE_SECRET_KEY:', stripeSecretKey ? 'défini' : 'manquant');
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)' },
      { status: 500 }
    );
  }

  const siteCheck = checkProductionSiteUrl();
  if (!siteCheck.ok) {
    console.error('[create-session]', siteCheck.reason);
    return NextResponse.json(
      { error: 'Configuration serveur incomplète' },
      { status: 500 }
    );
  }

  const siteUrl = getPublicSiteUrl();

  try {
    const body = await request.json();
    const {
      items,
      customer_email,
      customer_name,
      shipping_address,
      shipping_method,
      pickup_point,
      subtotal,
      shipping_cost,
      total,
      promo_id,
      discount_amount,
    } = body;

    const discountRaw = Number(discount_amount ?? 0);
    const discount = Number.isFinite(discountRaw) ? Math.round(discountRaw * 100) / 100 : 0;
    const promoId =
      typeof promo_id === 'string' && promo_id.length > 0 ? promo_id : null;

    devLog('[create-session] Données reçues:', {
      itemsCount: items?.length,
      customer_email,
      total,
      siteUrl,
    });

    if (!items?.length || !customer_email) {
      return NextResponse.json(
        { error: 'Données manquantes (items, email)' },
        { status: 400 }
      );
    }

    const method = shipping_method ?? 'home_delivery';

    if (method === 'home_delivery' && !shipping_address) {
      return NextResponse.json(
        { error: 'Adresse de livraison manquante' },
        { status: 400 }
      );
    }

    if (method === 'point_relay' && !pickup_point?.id) {
      return NextResponse.json(
        { error: 'Point Mondial Relay non sélectionné' },
        { status: 400 }
      );
    }

    if (promoId && discount <= 0) {
      return NextResponse.json({ error: 'Remise code promo invalide' }, { status: 400 });
    }
    if (!promoId && discount > 0) {
      return NextResponse.json({ error: 'Montant total invalide' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = createAdminClient();

    // Chargement des prix réels depuis la base de données (sécurité anti-manipulation)
    const productIds = (items as Array<{ id: unknown }>)
      .map((i) => normalizeProductId(i.id))
      .filter(Boolean);
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Produits invalides' }, { status: 400 });
    }

    const { data: dbProducts, error: productsError } = await (admin as any)
      .from('products')
      .select('id, name, price, image_url, is_active, stock')
      .in('id', productIds);

    if (productsError || !dbProducts?.length) {
      return NextResponse.json(
        {
          error:
            'Un ou plusieurs articles de votre panier ne sont plus disponibles. Videz le panier et rajoutez vos produits depuis la boutique.',
        },
        { status: 400 }
      );
    }

    const productMap = new Map<
      string,
      { id: string; name: string; price: number; image_url: string; is_active: boolean; stock: number | null }
    >(
      dbProducts.map(
        (p: {
          id: unknown;
          name: string;
          price: number;
          image_url: string;
          is_active: boolean;
          stock: number | null;
        }) => [normalizeProductId(p.id), { ...p, id: normalizeProductId(p.id) }]
      )
    );

    // Vérifier que tous les produits existent et sont actifs
    for (const item of items as Array<{ id: unknown; qty: number }>) {
      const itemId = normalizeProductId(item.id);
      const dbProduct = productMap.get(itemId);
      if (!dbProduct) {
        return NextResponse.json(
          {
            error:
              'Un article de votre panier n\'est plus disponible. Videz le panier et rajoutez vos produits depuis la boutique.',
          },
          { status: 400 }
        );
      }
      if (!dbProduct.is_active) {
        return NextResponse.json({ error: `Produit non disponible : ${dbProduct.name}` }, { status: 400 });
      }
      if (dbProduct.stock !== null && dbProduct.stock < item.qty) {
        return NextResponse.json({ error: `Stock insuffisant pour : ${dbProduct.name}` }, { status: 400 });
      }
    }

    // Calcul du sous-total avec les prix de la base de données
    const computedSubtotal = (items as Array<{ id: unknown; qty: number }>).reduce(
      (sum, i) => sum + (productMap.get(normalizeProductId(i.id))?.price ?? 0) * i.qty,
      0
    );
    const ship = Number(shipping_cost ?? 0);
    const computedTotal =
      Math.round((computedSubtotal + ship - discount) * 100) / 100;
    const requestedTotal = Math.round((total ?? 0) * 100) / 100;

    if (promoId) {
      const v = await validatePromoForCheckout(
        admin,
        promoId,
        computedSubtotal,
        discount,
        user?.id ?? null
      );
      if (!v.ok) {
        return NextResponse.json({ error: v.message }, { status: 400 });
      }
    }

    if (Math.abs(computedTotal - requestedTotal) > 0.01) {
      return NextResponse.json(
        { error: 'Montant total invalide' },
        { status: 400 }
      );
    }

    if (computedTotal > 0 && computedTotal < 0.5) {
      return NextResponse.json(
        { error: 'Montant trop faible pour un paiement par carte (minimum 0,50 €).' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // line_items Stripe construits avec les prix de la base de données (pas ceux du client)
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = (items as Array<{ id: unknown; qty: number }>).map(
      (item) => {
        const dbProduct = productMap.get(normalizeProductId(item.id))!;
        const unitAmount = Math.round(Number(dbProduct.price) * 100);
        if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
          throw new Error(`INVALID_PRODUCT_PRICE:${dbProduct.name}`);
        }
        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: dbProduct.name,
              images: stripeProductImages(dbProduct.image_url),
            },
            unit_amount: unitAmount,
          },
          quantity: item.qty,
        };
      }
    );

    if (shipping_cost > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: Math.round(shipping_cost * 100),
        },
        quantity: 1,
      });
    }

    /** Stripe exige unit_amount ≥ 0 ; un coupon ponctuel applique la remise sur la session. */
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (promoId && discount > 0) {
      const itemsTotalCents = lineItemsTotalCents(line_items);
      const discountCents = Math.round(discount * 100);
      if (discountCents >= itemsTotalCents) {
        return NextResponse.json(
          { error: 'La remise promo est trop élevée pour cette commande.' },
          { status: 400 }
        );
      }

      const coupon = await stripe.coupons.create({
        amount_off: discountCents,
        currency: 'eur',
        duration: 'once',
        name: 'Code promo',
      });
      discounts = [{ coupon: coupon.id }];
    }

    const session = await createStripeCheckoutSession(
      stripe,
      {
        mode: 'payment',
        ...(discounts && discounts.length > 0 ? { discounts } : {}),
        customer_email: customer_email.trim(),
        metadata: {
          customer_name: (customer_name || '').slice(0, 500),
          shipping_address: JSON.stringify(shipping_address ?? {}).slice(0, 500),
          shipping_method: method,
          pickup_point: pickup_point ? JSON.stringify(pickup_point).slice(0, 500) : '',
          promo_id: promoId ?? '',
          discount_amount: String(discount),
        },
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout`,
      },
      line_items
    );

    if (!session.id || !session.url) {
      console.error('[create-session] Session sans id ou url');
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session Stripe' },
        { status: 500 }
      );
    }

    devLog('[create-session] Stripe Session créée:', { sessionId: session.id, url: session.url ? 'ok' : 'manquant' });

    // Commande enregistrée avec les prix de la base de données
    const orderItems = (items as Array<{ id: unknown; qty: number }>).map((i) => {
      const dbProduct = productMap.get(normalizeProductId(i.id))!;
      return {
        product_id: dbProduct.id,
        product_name: dbProduct.name,
        price: dbProduct.price,
        qty: i.qty,
        image_url: dbProduct.image_url,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: orderError } = await (admin as any).from('orders').insert([
      {
        user_id:         user?.id ?? null,
        customer_email:  customer_email.trim(),
        customer_name:   customer_name ?? null,
        items:           orderItems,
        shipping_address: shipping_address ?? {},
        shipping_method: method,
        pickup_point:    method === 'point_relay' ? (pickup_point ?? null) : null,
        subtotal:        subtotal ?? computedSubtotal,
        shipping_cost:   shipping_cost ?? 0,
        total_price:     requestedTotal,
        promo_code_id:   promoId,
        discount_amount: discount,
        status:          'pending',
        payment_id:      session.id,
      },
    ]);

    if (orderError) {
      console.error('[create-session] order insert:', orderError.message, orderError.code, orderError.details);
      return NextResponse.json(
        {
          error: stripePaymentErrorMessage(orderError),
          ...(process.env.CHECKOUT_VERBOSE_ERRORS === '1'
            ? { details: orderError.message, code: orderError.code }
            : {}),
        },
        { status: 500 }
      );
    }

    devLog('[create-session] Commande pending créée, retour url + sessionId');
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[create-session] Erreur:', err instanceof Error ? err.message : err);
    if (err instanceof Error && err.message.startsWith('INVALID_PRODUCT_PRICE:')) {
      const name = err.message.replace('INVALID_PRODUCT_PRICE:', '');
      return NextResponse.json(
        { error: `Prix invalide pour le produit : ${name}` },
        { status: 400 }
      );
    }
    const body = checkoutErrorResponse(err);
    return NextResponse.json(body, { status: 500 });
  }
}
