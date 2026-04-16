import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const db = createAdminClient();

    const body = await request.json().catch(() => ({}));
    const product_id = String(body.product_id ?? '').trim();
    const quantity = Number.isFinite(body.quantity) ? Number(body.quantity) : 1;

    if (!product_id || quantity <= 0) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // @ts-expect-error - RPC increment_cart_item non défini dans les types Database
    const { error } = await db.rpc('increment_cart_item', {
      p_user_id: user.id,
      p_product_id: product_id,
      p_quantity: quantity,
    });

    if (error) {
      // Fallback si la fonction RPC n'existe pas encore : lire la quantité existante puis l'additionner
      const { data: existing } = await (db.from('cart_items') as any)
        .select('quantity')
        .eq('user_id', user.id)
        .eq('product_id', product_id)
        .maybeSingle();

      const newQuantity = (existing?.quantity ?? 0) + quantity;

      const { error: upsertError } = await (db.from('cart_items') as any).upsert(
        {
          user_id: user.id,
          product_id,
          quantity: newQuantity,
        },
        { onConflict: 'user_id,product_id' }
      );

      if (upsertError) throw upsertError;
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

