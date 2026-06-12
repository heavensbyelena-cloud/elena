import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { fetchCategoryImageOverrides } from '@/lib/category-images';
import { CATEGORY_SLUGS } from '@/lib/categories';

export async function GET() {
  try {
    const overrides = await fetchCategoryImageOverrides();
    return NextResponse.json({ overrides });
  } catch (err) {
    console.error('[category-images GET]', err);
    return NextResponse.json({ overrides: {} });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';

    if (!slug || !CATEGORY_SLUGS.includes(slug)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL de photo manquante' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('category_images')
      .upsert({ slug, image_url: imageUrl, updated_at: new Date().toISOString() }, { onConflict: 'slug' });

    if (error) {
      console.error('[category-images PUT]', error);
      return NextResponse.json({ error: 'Impossible de sauvegarder la photo' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, slug, image_url: imageUrl });
  } catch (err) {
    console.error('[category-images PUT]', err);
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const slug = request.nextUrl.searchParams.get('slug')?.trim() ?? '';
  if (!slug || !CATEGORY_SLUGS.includes(slug)) {
    return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('category_images').delete().eq('slug', slug);
    if (error) {
      console.error('[category-images DELETE]', error);
      return NextResponse.json({ error: 'Impossible de réinitialiser la photo' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    console.error('[category-images DELETE]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
