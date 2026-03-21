import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdminApi } from '@/lib/auth-api';

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
    const auth = await requireAdminApi(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const admin = createAdminClient();
    const { data, error } = await admin.from('products').update({
      name: body.name, description: body.description, price: parseFloat(body.price),
      category: body.category, badge: body.badge || null, stock: body.stock || null,
      image_url: body.image_url || null, updated_at: new Date().toISOString(),
    }).eq('id', id).select().single();

    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await requireAdminApi(_req);
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();
    const { error } = await admin.from('products').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
