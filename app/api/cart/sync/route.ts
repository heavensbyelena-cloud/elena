import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

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
    const { data: existing, error: fetchError } = await supabase
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
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    if (finalItems.length > 0) {
      const { error: insertError } = await supabase.from('cart_items').insert(finalItems);
      if (insertError) throw insertError;
    }

    // Retourner le panier complet avec les infos produits pour le front
    const { data: withProducts, error: joinError } = await supabase
      .from('cart_items')
      .select(
        'quantity, products!inner(id, name, price, image_url)'
      )
      .eq('user_id', user.id);

    if (joinError) throw joinError;

    const items =
      withProducts?.map((row: any) => ({
        id: row.products.id as string,
        name: row.products.name as string,
        price: row.products.price as number,
        image_url: row.products.image_url as string,
        qty: row.quantity as number,
      })) ?? [];

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

