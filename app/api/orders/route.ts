import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth';
import { devLog } from '@/lib/dev-log';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const supabase = await createServerSupabaseClient();
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (user.role !== 'admin' && !user.is_admin) query = query.eq('user_id', user.id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ orders: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur', orders: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  devLog('[POST /api/orders] Env:', {
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ? 'défini' : 'manquant',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'défini' : 'manquant',
  });

  try {
    const body = await request.json();
    const { items, shipping_address, customer_email, customer_name, subtotal, shipping_cost, total } = body;

    devLog('[POST /api/orders] Données reçues:', {
      itemsCount: items?.length ?? 0,
      items: items?.slice(0, 2),
      customer_email,
      customer_name,
      subtotal,
      shipping_cost,
      total,
      shipping_address: shipping_address ? { ...shipping_address } : null,
    });

    if (!items?.length || !customer_email || !shipping_address) {
      devLog('[POST /api/orders] Validation échouée: données manquantes');
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    devLog('[POST /api/orders] User:', user ? { id: user.id, email: user.email } : 'non connecté');

    const admin = createAdminClient();
    const totalPrice = total ?? 0;
    const payload = {
      user_id: user?.id ?? null,
      customer_email,
      customer_name: customer_name ?? null,
      items,
      shipping_address,
      subtotal: subtotal ?? 0,
      shipping_cost: shipping_cost ?? 0,
      total_price: totalPrice,
      status: 'pending',
      payment_id: null,
    };
    devLog('[POST /api/orders] Insert Supabase payload:', JSON.stringify(payload, null, 2));

    const { data, error } = await admin.from('orders').insert([payload]).select().single();

    if (error) {
      console.error('[POST /api/orders] Erreur Supabase:', error.message, error.code, error.details);
      throw error;
    }
    devLog('[POST /api/orders] Commande créée:', data?.id);
    return NextResponse.json({ order: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[POST /api/orders] Erreur:', message, stack);
    return NextResponse.json(
      { error: 'Erreur serveur', details: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
