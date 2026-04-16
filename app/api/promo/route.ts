/**
 * GET /api/promo — Liste tous les codes promo (admin), ou recherche clients (?search=email)
 * POST /api/promo — Crée un code promo (admin)
 */
import { NextRequest } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { ok, err } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';
import type { PromoCode } from '@/types';

type PromoRow = Database['public']['Tables']['promo_codes']['Row'];

/** Le générique Database ne résout pas toujours insert() sur ces tables — on cible le flux promo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminAny = { from: (t: string) => any };

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const admin = createAdminClient();
  const search = request.nextUrl.searchParams.get('search')?.trim();

  if (search && search.length >= 2) {
    const { data: users, error: searchError } = await admin
      .from('profiles')
      .select('id, email')
      .ilike('email', `%${search}%`)
      .limit(15);

    if (searchError) return err(searchError.message, 500);
    return ok({ users: users ?? [] });
  }

  const { data: promoCodes, error } = await admin
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return err(error.message, 500);
  if (!promoCodes || promoCodes.length === 0) return ok([] as PromoCode[]);

  // Fetch assigned users separately to avoid FK relationship dependency
  const promoIds = promoCodes.map((p: { id: string }) => p.id);
  const { data: assignedUsers } = await admin
    .from('promo_code_users')
    .select('id, promo_code_id, user_id, max_uses, uses_count')
    .in('promo_code_id', promoIds);

  // Fetch profiles for assigned users
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

  const result = promoCodes.map((promo: { id: string }) => ({
    ...promo,
    assigned_users: (assignedUsers ?? [])
      .filter((u: { promo_code_id: string }) => u.promo_code_id === promo.id)
      .map((u: { user_id: string; id: string; promo_code_id: string; max_uses: number; uses_count: number }) => ({
        ...u,
        profile: profileMap[u.user_id] ?? null,
      })),
  }));

  return ok(result as PromoCode[]);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { code, type, value, min_order, max_uses, max_uses_per_user, is_personal, expires_at, user_ids, assigned_users } =
      body;

    const codeStr = typeof code === 'string' ? code.trim().toUpperCase() : '';
    if (!codeStr) return err('Code requis', 400);

    const valueNum = Number(value);
    if (Number.isNaN(valueNum) || valueNum <= 0 || valueNum > 100) {
      return err('Valeur invalide (doit être entre 1 et 100)', 400);
    }

    const admin = createAdminClient();
    const db = admin as unknown as AdminAny;

    // Ligne complète (table à jour avec toutes les colonnes)
    const fullRow = {
      code: codeStr,
      type: 'percent' as const,
      value: valueNum,
      min_order: min_order != null ? Number(min_order) : null,
      max_uses: max_uses != null ? Number(max_uses) : null,
      max_uses_per_user: max_uses_per_user != null ? Number(max_uses_per_user) : 1,
      is_personal: Boolean(is_personal),
      expires_at: expires_at || null,
      active: true,
    };

    let { data: promo, error } = await db.from('promo_codes').insert(fullRow).select('*').single();

    if (error) {
      console.error('[POST /api/promo] insert error:', JSON.stringify(error));
      if (error.code === '23505') return err('Ce code existe déjà', 400);
      return err(error.message, 500);
    }

    const row = promo as PromoRow | null;
    if (!row?.id) {
      return err('Échec de la création du code promo (aucune ligne retournée)', 500);
    }

    if (is_personal) {
      const fromAssigned = Array.isArray(assigned_users)
        ? assigned_users.map((a: { user_id: string; max_uses?: number }) => ({
            promo_code_id: row.id,
            user_id: a.user_id,
            max_uses: Math.max(1, Math.floor(Number(a.max_uses) || 1)),
          }))
        : [];
      const fromLegacy =
        !assigned_users && Array.isArray(user_ids)
          ? user_ids.map((uid: string) => ({
              promo_code_id: row.id,
              user_id: uid,
              max_uses: 1,
            }))
          : [];
      const inserts = fromAssigned.length > 0 ? fromAssigned : fromLegacy;
      if (inserts.length > 0) {
        await db.from('promo_code_users').insert(inserts);
      }
    }

    const { data: createdAssigned } = await admin
      .from('promo_code_users')
      .select('id, promo_code_id, user_id, max_uses, uses_count')
      .eq('promo_code_id', row.id);

    const createdUserIds = [...new Set((createdAssigned ?? []).map((u: { user_id: string }) => u.user_id))];
    const createdProfileMap: Record<string, { email: string }> = {};
    if (createdUserIds.length > 0) {
      const { data: profiles } = await admin.from('profiles').select('id, email').in('id', createdUserIds);
      (profiles ?? []).forEach((p: { id: string; email: string }) => { createdProfileMap[p.id] = { email: p.email }; });
    }

    return ok({
      ...row,
      assigned_users: (createdAssigned ?? []).map((u: { user_id: string; id: string; promo_code_id: string; max_uses: number; uses_count: number }) => ({
        ...u,
        profile: createdProfileMap[u.user_id] ?? null,
      })),
    }, 201);
  } catch (e) {
    console.error('[POST /api/promo]', e);
    const detail = e instanceof Error ? e.message : 'Erreur lors de la création du code promo';
    return err(process.env.NODE_ENV === 'development' ? detail : 'Erreur lors de la création du code promo', 500);
  }
}
