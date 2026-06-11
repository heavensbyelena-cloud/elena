import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminOrderStatus from './AdminOrderStatus';
import { formatPrice, translateStatus } from '@/lib/utils';

// Couleurs par statut pour le badge d'état
const STATUS_COLORS: Record<string, string> = {
  pending: '#e8a040',
  paid: '#5a8a5a',
  processing: '#4a7ab5',
  shipped: '#7a5ab5',
  delivered: '#5a8a5a',
  cancelled: '#c05050',
};

interface AdminOrderRow {
  id: string;
  customer_name: string | null;
  customer_email: string;
  status: string;
  created_at: string;
  items: unknown[];
  subtotal?: number | null;
  shipping_cost?: number | null;
  total_price?: number | null;
  total?: number | null;
}

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login');
  const { data: profileData } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  const profile = profileData as { is_admin?: boolean } | null;
  if (!profile?.is_admin) redirect('/');

  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, customer_email, status, created_at, items, subtotal, shipping_cost, total_price, total')
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 40px' }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, marginBottom: '30px' }}>Commandes</h1>

      <nav style={{ display: 'flex', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[{ label: 'Dashboard', href: '/admin' },{ label: 'Produits', href: '/admin/products' },{ label: 'Commandes', href: '/admin/orders', active: true },{ label: 'Avis', href: '/admin/reviews' }].map(l => (
          <Link key={l.label} href={l.href} style={{ padding: '8px 20px', background: l.active ? 'var(--noir)' : 'transparent', color: l.active ? 'var(--blanc)' : 'var(--gris)', border: '1px solid ' + (l.active ? 'var(--noir)' : 'var(--bordure)'), fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bordure)' }}>
              {[
                'Commande #',
                'Client',
                'Email',
                'Articles',
                'Sous-total',
                'Livraison',
                'Total',
                'Statut',
                'Date',
                'Actions',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: '0.68rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--gris)',
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders as AdminOrderRow[] | null ?? []).map((o) => {
              const subtotal = o.subtotal ?? 0;
              const shipping = o.shipping_cost ?? 0;
              const total = o.total_price ?? o.total ?? subtotal + shipping;
              const color = STATUS_COLORS[o.status] ?? 'var(--gris)';
              const statusLabel = translateStatus(o.status);

              return (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--bordure)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gris)' }}>
                    {o.id != null ? String(o.id).slice(0, 8).toUpperCase() : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>{o.customer_name ?? '—'}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--gris)', fontSize: '0.8rem' }}>
                    {o.customer_email}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--gris)' }}>
                    {(o.items as unknown[]).length}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: "'Cormorant Garamond', serif" }}>
                    Sous-total: {formatPrice(subtotal)}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: "'Cormorant Garamond', serif" }}>
                    Livraison: {formatPrice(shipping)}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>
                    Total: {formatPrice(total)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        fontSize: '0.65rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color,
                        border: `1px solid ${color}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      color: 'var(--gris)',
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(o.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <AdminOrderStatus orderId={o.id} currentStatus={o.status} />
                      <Link
                        href={`/orders/${o.id}`}
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 10px',
                          border: '1px solid var(--bordure)',
                          textDecoration: 'none',
                          background: 'transparent',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        Voir détail
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif" }}>Aucune commande.</p>
        )}
      </div>
    </div>
  );
}
