import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';
import { clampToStock } from '@/lib/cart-stock';

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

    const { data: product, error: productError } = await (db.from('products') as any)
      .select('stock')
      .eq('id', product_id)
      .maybeSingle();

    if (productError) throw productError;

    const stock = product?.stock ?? null;

    const { data: existing } = await (db.from('cart_items') as any)
      .select('quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    const currentQty = Number(existing?.quantity ?? 0);
    const requestedQty = currentQty + quantity;
    const cappedQty = clampToStock(requestedQty, stock);

    if (cappedQty <= 0) {
      return NextResponse.json({ error: 'Produit en rupture de stock' }, { status: 400 });
    }

    if (cappedQty < requestedQty) {
      return NextResponse.json(
        { error: 'Stock insuffisant', max_quantity: cappedQty },
        { status: 400 }
      );
    }

    // @ts-expect-error - RPC increment_cart_item non défini dans les types Database
    const { error } = await db.rpc('increment_cart_item', {
      p_user_id: user.id,
      p_product_id: product_id,
      p_quantity: quantity,
    });

    if (error) {
      const { error: upsertError } = await (db.from('cart_items') as any).upsert(
        {
          user_id: user.id,
          product_id,
          quantity: cappedQty,
        },
        { onConflict: 'user_id,product_id' }
      );

      if (upsertError) throw upsertError;
    }

    return NextResponse.json({ ok: true, quantity: cappedQty }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
