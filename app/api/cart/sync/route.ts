import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';

interface IncomingItem {
  product_id: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Service role si défini (contourne RLS) ; sinon même client que la session (ex. local sans clé)
    const db =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
        ? createAdminClient()
        : supabase;

    const body = await request.json().catch(() => ({}));
    const rawItems: IncomingItem[] = Array.isArray(body.items) ? body.items : [];

    // Normaliser + filtrer les quantités invalides
    const mergedMap = new Map<string, number>();

    for (const it of rawItems) {
      const pid = String(it.product_id ?? '').trim();
      const qty = Number(it.quantity ?? 0);
      if (!pid || qty <= 0) continue;
      mergedMap.set(pid, (mergedMap.get(pid) ?? 0) + qty);
    }

    // Récupérer les éléments actuels côté Supabase
    const { data: existing, error: fetchError } = await db
      .from('cart_items')
      .select('product_id, quantity')
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;

    for (const row of existing ?? []) {
      const pid = String(row.product_id);
      const qty = Number(row.quantity ?? 0);
      if (!pid || qty <= 0) continue;
      mergedMap.set(pid, (mergedMap.get(pid) ?? 0) + qty);
    }

    const finalItems = Array.from(mergedMap.entries()).map(([product_id, quantity]) => ({
      user_id: user.id,
      product_id,
      quantity,
    }));

    // Réécrire complètement le panier utilisateur pour supprimer doublons/anciens
    const { error: deleteError } = await db
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    if (finalItems.length > 0) {
      const { error: insertError } = await db.from('cart_items').insert(finalItems);
      if (insertError) throw insertError;
    }

    // Produits : deux requêtes (évite les erreurs PostgREST sur le join `products!inner`)
    const { data: cartRows, error: cartReadError } = await db
      .from('cart_items')
      .select('product_id, quantity')
      .eq('user_id', user.id);

    if (cartReadError) throw cartReadError;

    if (!cartRows?.length) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const productIds = [...new Set(cartRows.map((r) => r.product_id))];
    const { data: productRows, error: productsError } = await db
      .from('products')
      .select('id, name, price, image_url')
      .in('id', productIds);

    if (productsError) throw productsError;

    const byId = new Map(
      (productRows ?? []).map((p: { id: string; name: string; price: number; image_url: string | null }) => [
        p.id,
        p,
      ])
    );

    const items = cartRows
      .map((row) => {
        const p = byId.get(row.product_id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          image_url: p.image_url,
          qty: row.quantity,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    return NextResponse.json({ items }, { status: 200 });
  } catch (e) {
    console.error('[api/cart/sync]', e);
    const detail = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e);
    return NextResponse.json(
      { error: 'Erreur serveur', detail: process.env.NODE_ENV === 'development' ? detail : undefined },
      { status: 500 }
    );
  }
}

