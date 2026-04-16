/**
 * GET /api/promo/[id] — Détail d'un code promo avec utilisateurs et usages (admin)
 * PATCH /api/promo/[id] — Modifie un code promo (admin)
 * DELETE /api/promo/[id] — Supprime un code promo (admin)
 */
import { NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { ok, err } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase-server';
import type { PromoCode } from '@/types';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: promo, error } = await admin
    .from('promo_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !promo) return err('Code promo non trouvé', 404);

  const { data: assignedUsers } = await admin
    .from('promo_code_users')
    .select('id, promo_code_id, user_id, max_uses, uses_count')
    .eq('promo_code_id', id);

  const userIds = [...new Set((assignedUsers ?? []).map((u: { user_id: string }) => u.user_id))];
  const profileMap: Record<string, { email: string }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email')
      .in('id', userIds);
    (profiles ?? []).forEach((p: { id: string; email: string }) => {
      profileMap[p.id] = { email: p.email };
    });
  }

  const promoWithUsers = {
    ...promo,
    assigned_users: (assignedUsers ?? []).map((u: { user_id: string; id: string; promo_code_id: string; max_uses: number; uses_count: number }) => ({
      ...u,
      profile: profileMap[u.user_id] ?? null,
    })),
  };

  const { data: usages } = await admin
    .from('promo_code_usages')
    .select('*')
    .eq('promo_code_id', id)
    .order('used_at', { ascending: false });

  return ok({ ...promoWithUsers, usages });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  try {
    const body = await request.json();
    const { code, type, value, min_order, max_uses, max_uses_per_user, is_personal, expires_at, active, user_ids, assigned_users } =
      body;

    const admin = createAdminClient();

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) updateData.code = String(code).trim().toUpperCase();
    if (type !== undefined) updateData.type = type === 'percent' ? 'percent' : 'percent';
    if (value !== undefined) {
      const v = Number(value);
      if (Number.isNaN(v) || v <= 0 || v > 100) return err('Valeur invalide', 400);
      updateData.value = v;
    }
    if (min_order !== undefined) updateData.min_order = min_order == null ? null : Number(min_order);
    if (max_uses !== undefined) updateData.max_uses = max_uses == null ? null : Number(max_uses);
    if (max_uses_per_user !== undefined) updateData.max_uses_per_user = max_uses_per_user == null ? null : Number(max_uses_per_user);
    if (is_personal !== undefined) updateData.is_personal = Boolean(is_personal);
    if (expires_at !== undefined) updateData.expires_at = expires_at || null;
    if (active !== undefined) updateData.active = Boolean(active);

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await admin.from('promo_codes').update(updateData).eq('id', id);

      if (updateError) {
        if (updateError.code === '23505') return err('Ce code existe déjà', 400);
        return err(updateError.message, 500);
      }
    }

    if (assigned_users !== undefined) {
      await admin.from('promo_code_users').delete().eq('promo_code_id', id);
      const personal = is_personal !== undefined ? Boolean(is_personal) : true;
      if (personal && Array.isArray(assigned_users) && assigned_users.length > 0) {
        const rows = assigned_users.map((a: { user_id: string; max_uses?: number }) => ({
          promo_code_id: id,
          user_id: a.user_id,
          max_uses: Math.max(1, Math.floor(Number(a.max_uses) || 1)),
        }));
        await admin.from('promo_code_users').insert(rows);
      }
    } else if (is_personal !== undefined && user_ids !== undefined) {
      await admin.from('promo_code_users').delete().eq('promo_code_id', id);

      if (is_personal && Array.isArray(user_ids) && user_ids.length > 0) {
        const userInserts = user_ids.map((uid: string) => ({
          promo_code_id: id,
          user_id: uid,
          max_uses: 1,
        }));
        await admin.from('promo_code_users').insert(userInserts);
      }
    }

    const { data: updatedPromo } = await admin
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .single();

    const { data: updatedAssigned } = await admin
      .from('promo_code_users')
      .select('id, promo_code_id, user_id, max_uses, uses_count')
      .eq('promo_code_id', id);

    const updatedUserIds = [...new Set((updatedAssigned ?? []).map((u: { user_id: string }) => u.user_id))];
    const updatedProfileMap: Record<string, { email: string }> = {};
    if (updatedUserIds.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, email').in('id', updatedUserIds);
      (profiles ?? []).forEach((p: { id: string; email: string }) => { updatedProfileMap[p.id] = { email: p.email }; });
    }

    return ok({
      ...updatedPromo,
      assigned_users: (updatedAssigned ?? []).map((u: { user_id: string; id: string; promo_code_id: string; max_uses: number; uses_count: number }) => ({
        ...u,
        profile: updatedProfileMap[u.user_id] ?? null,
      })),
    } as PromoCode);
  } catch {
    return err('Erreur lors de la mise à jour du code promo', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin.from('promo_codes').delete().eq('id', id);

  if (error) return err(error.message, 500);
  return ok({ deleted: true });
}
