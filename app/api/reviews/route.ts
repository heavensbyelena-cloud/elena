import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('reviews')
      .select('id, rating, comment, author_name, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;
    if (error) throw error;

    const reviews = data ?? [];
    const avg = reviews.length ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length : 0;

    return NextResponse.json({ reviews, average: avg, total: reviews.length });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur', reviews: [], average: 0, total: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { rating, comment, author_name, product_id } = await request.json();

    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'Note invalide (1-5)' }, { status: 400 });
    if (!comment || comment.trim().length < 5) return NextResponse.json({ error: 'Commentaire trop court' }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin.from('reviews').insert([{
      rating: parseInt(rating),
      comment: comment.trim().slice(0, 1000),
      author_name: author_name?.trim().slice(0, 50) || null,
      product_id: product_id || null,
      status: 'pending',
    }]).select().single();

    if (error) {
      console.error('[POST /api/reviews] Erreur Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }
    return NextResponse.json({ review: data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/reviews] Exception:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
