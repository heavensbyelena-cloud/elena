/** Normalise un e-mail pour comparaison (commandes ↔ compte client). */
export function normalizeOrderEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function orderBelongsToUser(
  order: { user_id?: string | null; customer_email?: string | null },
  user: { id: string; email?: string | null }
): boolean {
  if (order.user_id && order.user_id === user.id) return true;
  const orderEmail = normalizeOrderEmail(order.customer_email);
  const userEmail = normalizeOrderEmail(user.email);
  return Boolean(orderEmail && userEmail && orderEmail === userEmail);
}

/** Rattache les commandes invitées (même e-mail) au compte connecté. */
export async function linkGuestOrdersToUser(
  admin: ReturnType<typeof import('@/lib/supabase-server').createAdminClient>,
  user: { id: string; email?: string | null }
): Promise<void> {
  const email = normalizeOrderEmail(user.email);
  if (!email) return;

  await admin
    .from('orders')
    .update({ user_id: user.id })
    .ilike('customer_email', email)
    .is('user_id', null);
}

export type OrderItemRow = {
  product_id?: string | number;
  product_name: string;
  price: number;
  qty: number;
  image_url?: string | null;
};

export function orderItemSummary(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return 'Aucun article';
  const names = items
    .slice(0, 2)
    .map((item) => {
      const row = item as OrderItemRow;
      const qty = Number(row.qty) > 1 ? ` ×${row.qty}` : '';
      return `${row.product_name ?? 'Article'}${qty}`;
    });
  const extra = items.length > 2 ? ` +${items.length - 2}` : '';
  return names.join(', ') + extra;
}
