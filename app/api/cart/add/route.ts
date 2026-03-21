import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const product_id = String(body.product_id ?? '').trim();
    const quantity = Number.isFinite(body.quantity) ? Number(body.quantity) : 1;

    if (!product_id || quantity <= 0) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // @ts-expect-error - RPC increment_cart_item non défini dans les types Database
    const { error } = await supabase.rpc('increment_cart_item', {
      p_user_id: user.id,
      p_product_id: product_id,
      p_quantity: quantity,
    });

    if (error) {
      // Fallback si la fonction RPC n'existe pas encore : upsert simple
      const { error: upsertError } = await (supabase.from('cart_items') as any).upsert(
        {
          user_id: user.id,
          product_id,
          quantity,
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

