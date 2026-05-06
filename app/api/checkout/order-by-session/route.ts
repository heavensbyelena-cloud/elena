import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { sendOrderConfirmationEmail, type OrderEmailRow } from '@/lib/email/order-emails';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id manquant' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: order, error } = await admin
      .from('orders')
      .select(
        'id, status, total_price, total, subtotal, shipping_cost, discount_amount, customer_email, customer_name, items, promo_code_id, user_id, shipping_address, created_at'
      )
      .eq('payment_id', sessionId)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    const row = order as {
      id: string | number;
      status: string;
      total_price: number | null;
      total?: number | null;
      subtotal?: number | null;
      shipping_cost?: number | null;
      discount_amount?: number | null;
      customer_email: string;
      customer_name?: string | null;
      items: unknown;
      promo_code_id?: string | null;
      user_id?: string | null;
      shipping_address?: Record<string, unknown> | null;
      created_at?: string | null;
    };

    // Marquer comme payée si ce n'est pas déjà fait (idempotent — une seule fois)
    if (row.status === 'pending') {
      await admin
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', row.id)
        .eq('status', 'pending');

      // Enregistrement de l'utilisation du code promo
      if (row.promo_code_id) {
        if (row.user_id) {
          await (admin as any)
            .from('promo_code_usages')
            .insert({ promo_code_id: row.promo_code_id, user_id: row.user_id });
        }

        // Incrément atomique du compteur global (lecture puis écriture)
        const { data: promoData } = await (admin as any)
          .from('promo_codes')
          .select('uses_count')
          .eq('id', row.promo_code_id)
          .single();

        if (promoData) {
          await (admin as any)
            .from('promo_codes')
            .update({ uses_count: (promoData.uses_count ?? 0) + 1 })
            .eq('id', row.promo_code_id);
        }
      }

      // Confirmation de commande (Resend) — une seule fois au passage pending → payée
      await sendOrderConfirmationEmail({
        id: row.id,
        customer_email: row.customer_email,
        customer_name: row.customer_name,
        total_price: row.total_price,
        total: row.total,
        items: row.items as OrderEmailRow['items'],
        shipping_address: row.shipping_address ?? null,
        subtotal: row.subtotal,
        shipping_cost: row.shipping_cost,
        discount_amount: row.discount_amount,
        created_at: row.created_at,
      });
    }

    return NextResponse.json({ order: { ...row, status: 'paid' } });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
