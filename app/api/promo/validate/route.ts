/**
 * POST /api/promo/validate — Valide un code promo pour l'utilisateur connecté
 */
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ok, err } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase-server';
import type { AppliedPromo } from '@/types';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return err('Non autorisé', 401);

  try {
    const body = await request.json();
    const codeInput = typeof body.code === 'string' ? body.code.trim() : '';
    const cartTotal = Number(body.cart_total);

    if (!codeInput) return err('Code requis', 400);
    if (Number.isNaN(cartTotal) || cartTotal < 0) return err('Montant du panier invalide', 400);

    const supabase = createAdminClient();

    const { data: promoRow, error: findError } = await (supabase as any)
      .from('promo_codes')
      .select('*')
      .ilike('code', codeInput)
      .eq('active', true)
      .maybeSingle();

    if (findError) return err(findError.message, 500);
    if (!promoRow) return err('Code invalide', 400);

    const promo = promoRow as {
      id: string;
      code: string;
      type: string;
      value: number;
      min_order: number | null;
      max_uses: number | null;
      max_uses_per_user: number | null;
      uses_count: number;
      is_personal: boolean;
      expires_at: string | null;
    };

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return err('Code expiré', 400);
    }

    if (promo.min_order != null && cartTotal < promo.min_order) {
      return err('Montant minimum non atteint', 400);
    }

    if (promo.max_uses != null && promo.uses_count >= promo.max_uses) {
      return err('Code invalide', 400);
    }

    if (promo.is_personal) {
      const { data: assignment } = await (supabase as any)
        .from('promo_code_users')
        .select('*')
        .eq('promo_code_id', promo.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!assignment) return err('Code non autorisé pour ce compte', 403);

      const assignmentRow = assignment as { max_uses: number; uses_count: number };
      if (assignmentRow.uses_count >= assignmentRow.max_uses) {
        return err('Code non autorisé pour ce compte', 403);
      }
    } else {
      const limitPerUser = promo.max_uses_per_user ?? 1;
      const { count: userUsageCount } = await (supabase as any)
        .from('promo_code_usages')
        .select('*', { count: 'exact', head: true })
        .eq('promo_code_id', promo.id)
        .eq('user_id', user.id);

      if ((userUsageCount ?? 0) >= limitPerUser) {
        return err(
          limitPerUser === 1
            ? 'Vous avez déjà utilisé ce code'
            : `Vous avez atteint la limite d'utilisation de ce code (${limitPerUser} fois max)`,
          400
        );
      }
    }

    const discountAmount = Math.round((cartTotal * promo.value) / 100 * 100) / 100;

    const result: AppliedPromo = {
      id: promo.id,
      code: promo.code,
      value: promo.value,
      discount_amount: discountAmount,
    };

    return ok(result);
  } catch {
    return err('Erreur lors de la validation du code', 500);
  }
}
