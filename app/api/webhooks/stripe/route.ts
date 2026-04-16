import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase-server';
import { sendOrderConfirmationEmail, type OrderEmailRow } from '@/lib/email/order-emails';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripeSecretKey || !webhookSecret) {
    console.error('[webhook/stripe] STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET manquant');
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    } as unknown as ConstructorParameters<typeof Stripe>[1]);

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook/stripe] Signature invalide:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const admin = createAdminClient();

      const { data: order } = await admin
        .from('orders')
        .select('id, status, total_price, customer_email, customer_name, items, promo_code_id, user_id')
        .eq('payment_id', session.id)
        .maybeSingle();

      if (!order) {
        console.error('[webhook/stripe] Commande introuvable pour session:', session.id);
        return NextResponse.json({ received: true });
      }

      const row = order as {
        id: string;
        status: string;
        total_price: number | null;
        customer_email: string;
        customer_name: string | null;
        items: unknown;
        promo_code_id: string | null;
        user_id: string | null;
      };

      if (row.status !== 'pending') {
        // Déjà traité (idempotence)
        return NextResponse.json({ received: true });
      }

      // Mise à jour atomique : uniquement si le statut est encore 'pending'
      const { error: updateError } = await admin
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', row.id)
        .eq('status', 'pending');

      if (updateError) {
        console.error('[webhook/stripe] Erreur mise à jour commande:', updateError.message);
        return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
      }

      // Enregistrement utilisation code promo
      if (row.promo_code_id) {
        if (row.user_id) {
          await (admin as any)
            .from('promo_code_usages')
            .insert({ promo_code_id: row.promo_code_id, user_id: row.user_id });
        }

        const { data: promoData } = await (admin as any)
          .from('promo_codes')
          .select('uses_count')
          .eq('id', row.promo_code_id)
          .single();

        if (promoData) {
          await (admin as any)
            .from('promo_codes')
            .update({ uses_count: (promoData.uses_count ?? 0) + 1 })
            .eq('id', row.promo_code_id);
        }
      }

      // Email de confirmation
      await sendOrderConfirmationEmail({
        id: row.id,
        customer_email: row.customer_email,
        customer_name: row.customer_name,
        total_price: row.total_price,
        items: row.items as OrderEmailRow['items'],
      });

      console.log('[webhook/stripe] Commande confirmée:', row.id);
    } catch (err) {
      console.error('[webhook/stripe] Erreur traitement:', err);
      return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
