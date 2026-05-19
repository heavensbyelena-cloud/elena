import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdminApi } from '@/lib/auth';
import { normalizeProductImages } from '@/lib/product-images';
import { normalizeMaterialsInput } from '@/lib/materials';
import { updateProductRow } from '@/lib/products-persistence';

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const admin = createAdminClient();
    const { data, error } = await admin.from('products').select('*').eq('id', id).single();
    if (error || !data) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    return NextResponse.json({ product: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const normalized = normalizeProductImages(
      Array.isArray(body.images) && body.images.length > 0
        ? body.images
        : body.image_url
          ? [body.image_url]
          : []
    );
    const admin = createAdminClient();
    const payload = {
      name: body.name,
      description: body.description,
      price: parseFloat(body.price),
      category: body.category,
      badge: body.badge || null,
      stock: body.stock || null,
      image_url: normalized.image_url,
      images: normalized.images.length > 0 ? normalized.images : null,
      materials: normalizeMaterialsInput(body.materials),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await updateProductRow(admin, id, payload);

    if (error) {
      return NextResponse.json(
        { error: 'Impossible de mettre à jour le produit', debug: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ product: data });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        debug: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();
    const { error } = await admin.from('products').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
