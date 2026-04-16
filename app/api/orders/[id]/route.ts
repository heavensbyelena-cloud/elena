import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdminApi } from '@/lib/auth';
import { sendOrderDeliveredEmail, sendOrderShippedEmail } from '@/lib/email/order-emails';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminApi();
    if (auth instanceof NextResponse) return auth;

    const { id: rawId } = await params;
    const body = await request.json();
    const { status } = body;
    const allowed = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (typeof status !== 'string' || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const notesProvided = typeof body.notes === 'string';

    const admin = createAdminClient();
    const id = /^\d+$/.test(rawId) ? Number(rawId) : rawId;

    const { data: before, error: fetchErr } = await admin
      .from('orders')
      .select('id, status, customer_email, customer_name, notes')
      .eq('id', id as string & number)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!before) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const prev = (before as { status: string }).status;

    const updatePayload: Record<string, string | number | undefined> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notesProvided) {
      updatePayload.notes = (body.notes as string).trim();
    }

    const { error } = await admin
      .from('orders')
      .update(updatePayload as never)
      .eq('id', id as string & number);

    if (error) throw error;

    const notesAfter = notesProvided ? (body.notes as string).trim() : (before as { notes?: string | null }).notes;

    const row = {
      ...(before as {
        id: string | number;
        customer_email: string;
        customer_name?: string | null;
        notes?: string | null;
      }),
      status,
      notes: notesAfter,
    };

    if (status === 'shipped' && prev !== 'shipped') {
      await sendOrderShippedEmail(row);
    }
    if (status === 'delivered' && prev !== 'delivered') {
      await sendOrderDeliveredEmail(row);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
