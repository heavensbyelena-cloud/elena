import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase-server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  console.log('[create-session] STRIPE_SECRET_KEY:', stripeSecretKey ? 'défini' : 'manquant');
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: 'Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      items,
      customer_email,
      customer_name,
      shipping_address,
      subtotal,
      shipping_cost,
      total,
    } = body;

    console.log('[create-session] Données reçues:', {
      itemsCount: items?.length,
      customer_email,
      total,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    });

    if (!items?.length || !customer_email || !shipping_address) {
      return NextResponse.json(
        { error: 'Données manquantes (items, email, adresse)' },
        { status: 400 }
      );
    }

    // Validation des montants côté serveur (sécurité)
    const computedSubtotal = items.reduce(
      (sum: number, i: { price: number; qty: number }) => sum + i.price * i.qty,
      0
    );
    const computedTotal = Math.round((computedSubtotal + (shipping_cost ?? 0)) * 100) / 100;
    const requestedTotal = Math.round((total ?? 0) * 100) / 100;
    if (Math.abs(computedTotal - requestedTotal) > 0.01) {
      return NextResponse.json(
        { error: 'Montant total invalide' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: { name: string; price: number; qty: number; image_url?: string }) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            images: item.image_url ? [item.image_url] : undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      })
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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      customer_email: customer_email.trim(),
      metadata: {
        customer_name: (customer_name || '').slice(0, 500),
        shipping_address: JSON.stringify(shipping_address).slice(0, 500),
      },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
    });

    if (!session.id || !session.url) {
      console.error('[create-session] Session sans id ou url', session);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la session Stripe' },
        { status: 500 }
      );
    }

    console.log('[create-session] Stripe Session créée:', { sessionId: session.id, url: session.url ? 'ok' : 'manquant' });

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = createAdminClient();

    const orderItems = items.map(
      (i: { id: string; name: string; price: number; qty: number; image_url?: string }) => ({
        product_id: i.id,
        product_name: i.name,
        price: i.price,
        qty: i.qty,
        image_url: i.image_url,
      })
    );

    // user_id en BIGINT en base : on n'envoie pas l'UUID. Passer à une colonne UUID pour lier l'utilisateur.
    await admin.from('orders').insert([
      {
        user_id: null,
        customer_email: customer_email.trim(),
        customer_name: customer_name ?? null,
        items: orderItems,
        shipping_address,
        subtotal: subtotal ?? computedSubtotal,
        shipping_cost: shipping_cost ?? 0,
        total_price: requestedTotal,
        status: 'pending',
        payment_id: session.id,
      },
    ]);

    console.log('[create-session] Commande pending créée, retour url + sessionId');
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[create-session] Erreur:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    );
  }
}
