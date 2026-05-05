import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdminApi } from '@/lib/auth';

/**
 * POST /api/products/bulk
 *
 * Action "reassign" : change la catégorie de tous les produits d'un slug vers un autre
 *   { action: 'reassign', from: 'decoration-plateaux', to: 'decoration-bijoux' }
 *
 * Action "delete" : supprime tous les produits d'un slug donné
 *   { action: 'delete', category: 'decoration-plateaux' }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { action } = body;

    if (!action || !['reassign', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const admin = createAdminClient();

    if (action === 'reassign') {
      const { from, to } = body as { from: string; to: string };
      if (!from || !to) {
        return NextResponse.json({ error: 'Paramètres from/to manquants' }, { status: 400 });
      }
      const { data, error } = await admin
        .from('products')
        .update({ category: to, updated_at: new Date().toISOString() })
        .eq('category', from)
        .select('id');

      if (error) throw error;
      return NextResponse.json({ success: true, updated: data?.length ?? 0 });
    }

    if (action === 'delete') {
      const { category } = body as { category: string };
      if (!category) {
        return NextResponse.json({ error: 'Paramètre category manquant' }, { status: 400 });
      }
      const { data, error } = await admin
        .from('products')
        .delete()
        .eq('category', category)
        .select('id');

      if (error) throw error;
      return NextResponse.json({ success: true, deleted: data?.length ?? 0 });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (err) {
    console.error('[POST /api/products/bulk]', err);
    return NextResponse.json(
      { error: 'Erreur serveur', debug: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
