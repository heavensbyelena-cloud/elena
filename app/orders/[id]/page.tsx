import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, formatDate, translateStatus } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

function statusColor(status: string): { bg: string; border: string; text: string } {
  switch (status) {
    case 'paid':
    case 'confirmed':    return { bg: 'rgba(90,138,90,0.12)',  border: 'rgba(90,138,90,0.45)',  text: '#7ab87a' };
    case 'shipped':      return { bg: 'rgba(143,213,209,0.1)', border: 'rgba(143,213,209,0.4)', text: 'var(--accent)' };
    case 'delivered':    return { bg: 'rgba(90,138,90,0.18)',  border: 'rgba(90,138,90,0.55)',  text: '#8acd8a' };
    case 'cancelled':    return { bg: 'rgba(192,80,80,0.1)',   border: 'rgba(192,80,80,0.45)',  text: '#d07070' };
    default:             return { bg: 'rgba(143,213,209,0.06)', border: 'var(--bordure-hover)', text: 'var(--texte-muted)' };
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px', fontSize: '0.92rem' }}>
      <span style={{ color: 'var(--texte-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--texte)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  const profile = profileData as { is_admin?: boolean } | null;

  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, customer_name, customer_email, items, shipping_address, subtotal, shipping_cost, total_price, total, discount_amount, promo_code_id, status, created_at, notes')
    .eq('id', Number(id))
    .maybeSingle();

  let promoCode: string | null = null;
  if (order?.promo_code_id) {
    const { data: promoRow } = await admin
      .from('promo_codes')
      .select('code')
      .eq('id', order.promo_code_id)
      .maybeSingle();
    promoCode = promoRow?.code ?? null;
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', color: 'var(--texte-muted)' }}>
          Commande introuvable.
        </p>
        <Link href="/account/dashboard" style={{ display: 'inline-block', marginTop: '24px', color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '0.1em', textDecoration: 'none' }}>
          ← Retour à mes commandes
        </Link>
      </div>
    );
  }

  if (!profile?.is_admin && order.user_id && order.user_id !== user.id) {
    redirect('/account/dashboard');
  }

  const subtotal        = order.subtotal ?? 0;
  const shipping        = order.shipping_cost ?? 0;
  const discountAmount  = (order as Record<string, unknown>).discount_amount as number ?? 0;
  const total           = order.total_price ?? order.total ?? subtotal + shipping;
  const statusLabel = translateStatus(order.status);
  const sc         = statusColor(order.status);
  const isAdmin    = !!profile?.is_admin;
  const orderIdStr = String(order.id ?? 'N/A').slice(0, 8).toUpperCase();

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 40px', background: 'var(--fond)' }}>

      {/* ── Retour ── */}
      <div style={{ marginBottom: '36px' }}>
        <Link
          href={isAdmin ? '/admin/orders' : '/account/dashboard'}
          style={{ color: 'var(--texte-muted)', fontSize: '0.78rem', letterSpacing: '0.12em', textDecoration: 'none', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          ← {isAdmin ? 'Retour aux commandes' : 'Retour à mes commandes'}
        </Link>
      </div>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid var(--bordure)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--texte)' }}>
            Commande #{orderIdStr}
          </h1>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            fontSize: '0.68rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            border: `1px solid ${sc.border}`,
            background: sc.bg,
            color: sc.text,
            whiteSpace: 'nowrap',
          }}>
            {statusLabel}
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--texte-muted)', lineHeight: 1.7 }}>
          Passée le {formatDate(order.created_at)}
          {order.customer_email && (
            <> &nbsp;·&nbsp; <span style={{ color: 'var(--texte)' }}>{order.customer_email}</span></>
          )}
        </p>
      </div>

      {/* ── Grille Adresse + Récap ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: '24px', marginBottom: '40px' }} className="order-detail-grid">

        {/* Adresse de livraison */}
        <div style={{ padding: '28px 32px', background: 'var(--fond-carte)', border: '1px solid var(--bordure)' }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '20px' }}>
            Adresse de livraison
          </p>
          {order.shipping_address ? (
            <div style={{ fontSize: '0.92rem', color: 'var(--texte)', lineHeight: 2 }}>
              <p style={{ fontWeight: 500, color: 'var(--texte)', marginBottom: '2px' }}>
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p style={{ color: 'var(--texte-muted)' }}>{order.shipping_address.address}</p>
              <p style={{ color: 'var(--texte-muted)' }}>
                {order.shipping_address.postal_code} {order.shipping_address.city}
              </p>
              <p style={{ color: 'var(--texte-muted)' }}>{order.shipping_address.country}</p>
              {order.shipping_address.phone && (
                <p style={{ marginTop: '8px', color: 'var(--texte-muted)', fontSize: '0.85rem' }}>
                  Tél. : {order.shipping_address.phone}
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.88rem', color: 'var(--texte-muted)' }}>Aucune adresse renseignée.</p>
          )}
        </div>

        {/* Récapitulatif financier */}
        <div style={{ padding: '28px 32px', background: 'var(--fond-carte)', border: '1px solid var(--bordure)' }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '20px' }}>
            Récapitulatif
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <InfoRow label="Sous-total" value={formatPrice(subtotal)} />
            {discountAmount > 0 && promoCode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px', fontSize: '0.92rem' }}>
                <span style={{ color: 'var(--texte-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Code promo
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(143,213,209,0.4)',
                    background: 'rgba(143,213,209,0.08)',
                    color: 'var(--accent)',
                  }}>
                    {promoCode}
                  </span>
                </span>
                <span style={{ color: '#7ab87a' }}>−{formatPrice(discountAmount)}</span>
              </div>
            )}
            <InfoRow label="Livraison"  value={shipping === 0 ? 'Offerte' : formatPrice(shipping)} />
            <div style={{ borderTop: '1px solid var(--bordure)', paddingTop: '14px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
              <span style={{ fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--texte-muted)' }}>Total</span>
              <div style={{ textAlign: 'right' }}>
                {discountAmount > 0 && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--texte-muted)', textDecoration: 'line-through', marginBottom: '2px' }}>
                    {formatPrice(subtotal + shipping)}
                  </p>
                )}
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.4rem', color: 'var(--accent)' }}>
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>
          {order.notes && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--bordure)' }}>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '8px' }}>Note</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--texte)', lineHeight: 1.6 }}>{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Produits commandés ── */}
      <div>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '20px' }}>
          Produits commandés
        </p>

        <div style={{ border: '1px solid var(--bordure)', background: 'var(--fond-carte)', overflow: 'hidden' }}>
          {order.items && order.items.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {order.items.map((item, idx) => {
                const lineTotal = item.price * item.qty;
                return (
                  <li
                    key={item.product_id + String(item.price) + String(item.qty) + idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px 28px',
                      gap: '20px',
                      borderBottom: idx < order.items.length - 1 ? '1px solid var(--bordure)' : 'none',
                    }}
                  >
                    {/* Image */}
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        style={{ width: '76px', height: '76px', objectFit: 'cover', border: '1px solid var(--bordure)', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: '76px', height: '76px', background: 'var(--fond-casse)', border: '1px solid var(--bordure)', flexShrink: 0 }} />
                    )}

                    {/* Nom + qté */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.08rem', color: 'var(--texte)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product_name}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--texte-muted)', letterSpacing: '0.04em' }}>
                        {item.qty} × {formatPrice(item.price)}
                      </p>
                    </div>

                    {/* Prix ligne */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', color: 'var(--accent)' }}>
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ padding: '36px 28px', color: 'var(--texte-muted)', fontSize: '0.92rem' }}>
              Aucun article dans cette commande.
            </p>
          )}

          {/* Pied — total final */}
          <div style={{ padding: '20px 28px', borderTop: '1px solid var(--bordure)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--fond-casse)' }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--texte-muted)' }}>
              {order.items?.length ?? 0} article{(order.items?.length ?? 0) > 1 ? 's' : ''}
            </span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: 'var(--accent)' }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .order-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
