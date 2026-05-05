import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdminApi } from '@/lib/auth';
import { devLog } from '@/lib/dev-log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    devLog('[GET /api/products] Requête:', {
      category: category ?? 'tous',
      limit,
      query: `SELECT id, name, price, badge, category, image_url, stock, is_active FROM products WHERE is_active = true${category ? ` AND category = '${category}'` : ''} ORDER BY created_at DESC LIMIT ${limit}`,
    });

    // Utiliser createAdminClient pour la lecture publique : bypass RLS, tous les produits actifs sont visibles.
    // (createServerSupabaseClient + anon peut renvoyer [] si RLS n'autorise pas SELECT aux anonymes.)
    const admin = createAdminClient();
    let query = admin
      .from('products')
      .select('id, name, price, badge, category, image_url, stock, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/products] Erreur Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    const list = data ?? [];
    devLog('[GET /api/products] Produits reçus:', list.length, 'entrée(s)', list.length ? list.map((p: { id: string; name: string; category: string }) => ({ id: p.id, name: p.name, category: p.category })) : '(tableau vide)');

    return NextResponse.json({ products: list });
  } catch (err) {
    console.error('[GET /api/products] Exception:', err);
    return NextResponse.json({ error: 'Erreur serveur', products: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { name, description, price, category, badge, stock, image_url } = body;

    devLog('[POST /api/products] Données reçues:', {
      name,
      description: description ? '(présent)' : '(vide)',
      price,
      category,
      badge: badge ?? '(vide)',
      stock: stock ?? '(vide)',
      image_url: image_url ? `${image_url.slice(0, 50)}...` : '(vide)',
    });

    if (!name || !price || !category) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    devLog('[POST /api/products] Variables d’environnement utilisées:', {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'défini' : 'manquant',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'défini' : 'manquant',
    });

    const admin = createAdminClient();
    const payload = {
      name,
      description: description || null,
      price: parseFloat(String(price)),
      category,
      badge: badge || null,
      stock: stock != null && stock !== '' ? parseInt(String(stock), 10) : null,
      image_url: image_url || null,
      is_active: true,
    };
    devLog('[POST /api/products] Payload insert:', payload);

    const { data, error } = await admin.from('products').insert([payload]).select().single();

    if (error) {
      console.error('[POST /api/products] Erreur Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/products] Exception:', err);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        ...(process.env.NODE_ENV === 'development'
          ? { debug: err instanceof Error ? err.message : String(err) }
          : {}),
      },
      { status: 500 }
    );
  }
}
