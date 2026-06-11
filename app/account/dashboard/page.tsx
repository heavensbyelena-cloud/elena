import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, translateStatus } from '@/lib/utils';
import { linkGuestOrdersToUser, orderItemSummary } from '@/lib/order-access';

const STATUS_COLORS: Record<string, string> = {
  pending: '#e8a040',
  paid: '#5a8a5a',
  processing: '#4a7ab5',
  shipped: '#7a5ab5',
  delivered: '#5a8a5a',
  cancelled: '#c05050',
};

interface UserOrderRow {
  id: string;
  status: string;
  created_at: string;
  items: unknown[];
  subtotal?: number | null;
  shipping_cost?: number | null;
  total_price?: number | null;
  total?: number | null;
}

interface ProfileWithName {
  first_name?: string | null;
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login');

  const admin = createAdminClient();
  await linkGuestOrdersToUser(admin, user);

  const email = (user.email ?? '').trim().toLowerCase();
  const { data: ordersByUser } = await admin
    .from('orders')
    .select('id, status, created_at, items, subtotal, shipping_cost, total_price, total, customer_email, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: ordersByEmail } = email
    ? await admin
        .from('orders')
        .select('id, status, created_at, items, subtotal, shipping_cost, total_price, total, customer_email, user_id')
        .ilike('customer_email', email)
        .order('created_at', { ascending: false })
    : { data: [] as UserOrderRow[] };

  const ordersMap = new Map<string, UserOrderRow>();
  for (const o of [...(ordersByUser ?? []), ...(ordersByEmail ?? [])]) {
    ordersMap.set(String(o.id), o as UserOrderRow);
  }
  const orders = [...ordersMap.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user.id).single();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 40px' }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.15em', marginBottom: '8px' }}>
        Bonjour, {(profile as ProfileWithName | null)?.first_name ?? 'chère cliente'} ✦
      </h1>
      <p style={{ color: 'var(--gris)', fontSize: '0.88rem', marginBottom: '40px' }}>{user.email}</p>

      {/* Nav compte */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', borderBottom: '1px solid var(--bordure)', paddingBottom: '20px' }}>
        {[
          { label: 'Mes commandes', href: '/account/dashboard', active: true },
          { label: 'Mon profil',    href: '/account/profile' },
        ].map(l => (
          <Link key={l.label} href={l.href} style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: l.active ? 'var(--noir)' : 'var(--gris)', textDecoration: 'none', borderBottom: l.active ? '1px solid var(--noir)' : '1px solid transparent', paddingBottom: '4px' }}>
            {l.label}
          </Link>
        ))}
      </div>

      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '24px' }}>
        Mes commandes
      </h2>

      {!orders || orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gris)' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', marginBottom: '20px' }}>Vous n&apos;avez pas encore de commande.</p>
          <Link href="/shop" className="btn-primary">Découvrir la boutique</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(orders as UserOrderRow[] | null ?? []).map((order) => {
            const color = STATUS_COLORS[order.status] ?? 'var(--gris)';
            const statusLabel = translateStatus(order.status);
            const subtotal = order.subtotal ?? 0;
            const shipping = order.shipping_cost ?? 0;
            const total = order.total_price ?? order.total ?? subtotal + shipping;

            return (
              <div
                key={order.id}
                style={{
                  border: '1px solid var(--bordure)',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '0.72rem',
                      letterSpacing: '0.15em',
                      color: 'var(--gris)',
                      marginBottom: '4px',
                    }}
                  >
                    COMMANDE #{(order.id ? order.id.slice(0, 8) : 'N/A').toUpperCase()}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '1rem',
                      marginBottom: '4px',
                    }}
                  >
                    {orderItemSummary(order.items)}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gris)' }}>
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '180px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      fontSize: '0.68rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color,
                      border: `1px solid ${color}`,
                      marginBottom: '8px',
                    }}
                  >
                    {statusLabel}
                  </span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gris)', marginBottom: '4px' }}>
                    <div>Sous-total: {formatPrice(subtotal)}</div>
                    <div>Livraison: {formatPrice(shipping)}</div>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: '1.05rem',
                      fontWeight: 500,
                    }}
                  >
                    Total: {formatPrice(total)}
                  </p>
                  <Link
                    href={`/orders/${order.id}`}
                    style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      fontSize: '0.72rem',
                      padding: '4px 10px',
                      border: '1px solid var(--bordure)',
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Voir détail
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
