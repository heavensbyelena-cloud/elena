import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';
import { requireAdminApi } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;

    const { status } = await request.json();
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('reviews').update({ status }).eq('id', id);
    if (error) {
      console.error('[PATCH /api/reviews/:id] Erreur Supabase:', error);
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/reviews/:id] Exception:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
