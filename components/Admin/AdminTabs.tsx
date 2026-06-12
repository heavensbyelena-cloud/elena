'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import AdminProductActions from '@/app/admin/products/AdminProductActions';
import AdminOrderStatus from '@/app/admin/orders/AdminOrderStatus';
import AdminReviewActions from '@/app/admin/reviews/AdminReviewActions';
import DeleteResineSubcatModal from '@/components/Admin/DeleteResineSubcatModal';
import AdminCategoryImages from '@/components/Admin/AdminCategoryImages';
import { formatPrice, translateStatus } from '@/lib/utils';
import { CATEGORIES, getDecorationSubcatLabel, isDecorationSlug } from '@/lib/categories';
import type { CategoryImageOverrides } from '@/lib/category-images';

type TabId = 'dashboard' | 'products' | 'orders' | 'reviews' | 'categories';

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#e8a040',
  paid: '#5a8a5a',
  processing: '#4a7ab5',
  shipped: '#7a5ab5',
  delivered: '#5a8a5a',
  cancelled: '#c05050',
};

const BASE_CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  ...CATEGORIES.filter(c => c.slug !== 'decoration').map(c => ({ value: c.slug, label: c.label })),
  { value: 'decoration', label: 'Décoration' },
];

const ORDER_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payées' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
];

interface AdminTabsProps {
  dashboard: {
    nbProducts: number;
    nbOrders: number;
    nbPending: number;
    recentOrders: Array<{
      id: string;
      subtotal: number;
      shipping_cost: number;
      total: number;
      status: string;
      created_at: string;
      customer_name: string | null;
    }>;
  };
  products: Array<{
    id: string;
    image_url: string | null;
    name: string;
    category: string;
    price: number;
    stock: number | null;
  }>;
  orders: Array<{
    id: string;
    customer_name: string | null;
    customer_email: string | null;
    subtotal?: number | null;
    shipping_cost?: number | null;
    total?: number | null;
    total_price?: number | null;
    shipping_address?: {
      first_name?: string;
      last_name?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country?: string;
      phone?: string;
    } | null;
    shipping_method?: 'home_delivery' | 'point_relay' | null;
    pickup_point?: {
      id?: string;
      name?: string;
      address?: string;
      city?: string;
      zipCode?: string;
    } | null;
    status: string;
    created_at: string;
    items: unknown[];
    discount_amount?: number | null;
    promo_code_id?: string | null;
    promo_codes?: { code: string } | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    author_name: string | null;
    status: string;
    created_at: string;
  }>;
  categoryImageOverrides: CategoryImageOverrides;
}

function stars(n: number) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

export default function AdminTabs({ dashboard, products, orders, reviews, categoryImageOverrides }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [decorationSubFilter, setDecorationSubFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ slug: string; label: string; count: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const decorationSubcats = useMemo(() => {
    const slugs = [...new Set(
      products.filter(p => p.category.startsWith('decoration-')).map(p => p.category)
    )].sort();
    return slugs.map(slug => ({ slug, label: getDecorationSubcatLabel(slug) }));
  }, [products]);

  const isDecorationFilterActive = productCategoryFilter === 'decoration';

  const filteredReviews = reviews.filter((r) => r.status === reviewFilter);
  const filteredProducts = useMemo(() => {
    if (productCategoryFilter === 'all') return products;
    if (productCategoryFilter === 'decoration') {
      const decoProducts = products.filter(p => isDecorationSlug(p.category));
      if (decorationSubFilter === 'all') return decoProducts;
      return decoProducts.filter(p => p.category === decorationSubFilter);
    }
    return products.filter(p => p.category === productCategoryFilter);
  }, [products, productCategoryFilter, decorationSubFilter]);

  const filteredOrders =
    orderStatusFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === orderStatusFilter);

  const tabStyle = (active: boolean) => ({
    padding: isMobile ? '8px 14px' : '8px 20px',
    background: active ? 'var(--noir)' : 'transparent',
    color: active ? 'var(--blanc)' : 'var(--gris)',
    border: `1px solid ${active ? 'var(--noir)' : 'var(--bordure)'}`,
    fontSize: isMobile ? '0.65rem' : '0.72rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s',
    flex: isMobile ? '1' : undefined,
  });

  const px = isMobile ? '16px' : '40px';
  const py = isMobile ? '24px' : '60px';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: `${py} ${px}` }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '24px' : '40px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 400, letterSpacing: '0.15em' }}>
          Administration
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/admin/promo"
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: 'var(--blanc)',
              background: 'var(--noir)',
              border: '1px solid var(--noir)',
              padding: '8px 16px',
              whiteSpace: 'nowrap',
            }}
          >
            Codes promo
          </Link>
          <Link href="/home" style={{ fontSize: '0.72rem', color: 'var(--gris)', textDecoration: 'none', letterSpacing: '0.12em' }}>
            ← Boutique
          </Link>
        </div>
      </div>

      {/* Onglets */}
      <nav style={{ display: 'flex', gap: '6px', marginBottom: isMobile ? '24px' : '40px' }}>
        {([
          { id: 'dashboard' as const, label: isMobile ? '🏠' : 'Dashboard' },
          { id: 'products' as const, label: isMobile ? '📦' : 'Produits' },
          { id: 'categories' as const, label: isMobile ? '🖼' : 'Catégories' },
          { id: 'orders' as const, label: isMobile ? '🧾' : 'Commandes' },
          { id: 'reviews' as const, label: isMobile ? '★' : 'Avis' },
        ]).map(({ id, label }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)} style={tabStyle(activeTab === id)} title={id}>
            {label}
          </button>
        ))}
      </nav>

      {/* ═══════════════ DASHBOARD ═══════════════ */}
      {activeTab === 'dashboard' && (
        <>
          {/* Cartes stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(3,1fr)', gap: isMobile ? '12px' : '24px', marginBottom: isMobile ? '32px' : '50px' }}>
            {[
              { icon: '◇', value: dashboard.nbProducts, label: 'Produits' },
              { icon: '⬡', value: dashboard.nbOrders, label: 'Commandes' },
              { icon: '★', value: dashboard.nbPending, label: isMobile ? 'Avis' : 'Avis en attente' },
            ].map(card => (
              <div key={card.label} style={{ background: 'var(--fond-casse)', border: '1px solid var(--bordure)', padding: isMobile ? '16px 12px' : '32px 28px' }}>
                <div style={{ fontSize: isMobile ? '1.2rem' : '2rem', color: 'var(--accent)', marginBottom: isMobile ? '6px' : '12px' }}>{card.icon}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 400, lineHeight: 1, marginBottom: '4px' }}>{card.value}</div>
                <div style={{ fontSize: isMobile ? '0.6rem' : '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gris)' }}>{card.label}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 400, letterSpacing: '0.1em', marginBottom: '16px' }}>
            Commandes récentes
          </h2>

          {/* Mobile : cartes */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dashboard.recentOrders.map((o) => {
                const total = o.total ?? (o.subtotal ?? 0) + (o.shipping_cost ?? 0);
                const color = ORDER_STATUS_COLORS[o.status] ?? 'var(--gris)';
                return (
                  <div key={o.id} style={{ border: '1px solid var(--bordure)', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--gris)' }}>#{String(o.id).slice(0, 8).toUpperCase()}</span>
                      <span style={{ padding: '2px 8px', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color, border: `1px solid ${color}` }}>
                        {translateStatus(o.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>{o.customer_name ?? '—'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--gris)' }}>
                      <span>{new Date(o.created_at).toLocaleDateString('fr-FR')}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--accent)', fontSize: '0.95rem' }}>{formatPrice(total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop : tableau */
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bordure)' }}>
                  {['ID', 'Client', 'Sous-total', 'Livraison', 'Total', 'Statut', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((o) => {
                  const subtotal = o.subtotal ?? 0;
                  const shipping = o.shipping_cost ?? 0;
                  const total = o.total ?? subtotal + shipping;
                  const color = ORDER_STATUS_COLORS[o.status] ?? 'var(--gris)';
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--bordure)' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--gris)' }}>{o.id ? String(o.id).slice(0, 8) : 'N/A'}</td>
                      <td style={{ padding: '14px 16px' }}>{o.customer_name ?? '—'}</td>
                      <td style={{ padding: '14px 16px', fontFamily: "'Cormorant Garamond', serif" }}>{formatPrice(subtotal)}</td>
                      <td style={{ padding: '14px 16px', fontFamily: "'Cormorant Garamond', serif" }}>{formatPrice(shipping)}</td>
                      <td style={{ padding: '14px 16px', fontFamily: "'Cormorant Garamond', serif" }}>{formatPrice(total)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 10px', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color, border: `1px solid ${color}`, whiteSpace: 'nowrap' }}>
                          {translateStatus(o.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--gris)', fontSize: '0.8rem' }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ═══════════════ PRODUITS ═══════════════ */}
      {activeTab === 'products' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 400 }}>
              Produits
            </h1>
            <Link href="/admin/products/new" className="btn-primary" style={{ fontSize: isMobile ? '0.7rem' : undefined }}>
              + Ajouter
            </Link>
          </div>

          {/* Filtres catégorie */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: isDecorationFilterActive && decorationSubcats.length > 0 ? '8px' : '16px' }}>
            {BASE_CATEGORY_FILTERS.map((f) => {
              const active = productCategoryFilter === f.value;
              const isDecorationBtn = f.value === 'decoration';
              const decorationCount = isDecorationBtn ? products.filter(p => isDecorationSlug(p.category)).length : 0;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => { setProductCategoryFilter(f.value); setDecorationSubFilter('all'); }}
                  style={{
                    padding: isMobile ? '5px 10px' : '6px 14px',
                    fontSize: isMobile ? '0.62rem' : '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    border: `1px solid ${active ? 'var(--noir)' : 'var(--bordure)'}`,
                    background: active ? 'var(--noir)' : 'transparent',
                    color: active ? 'var(--blanc)' : 'var(--gris)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {f.label}
                  {isDecorationBtn && decorationCount > 0 && (
                    <span style={{ fontSize: '0.58rem', background: active ? 'rgba(255,255,255,0.25)' : 'var(--accent)', color: 'var(--blanc)', borderRadius: '10px', padding: '1px 5px', fontWeight: 500 }}>
                      {decorationCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sous-filtres décoration */}
          {isDecorationFilterActive && decorationSubcats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid var(--accent)' }}>
              <button type="button" onClick={() => setDecorationSubFilter('all')} style={{ padding: '3px 10px', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', border: `1px solid ${decorationSubFilter === 'all' ? 'var(--accent)' : 'var(--bordure)'}`, background: 'transparent', color: decorationSubFilter === 'all' ? 'var(--accent)' : 'var(--gris)', cursor: 'pointer' }}>
                Toutes
              </button>
              {decorationSubcats.map(sub => {
                const count = products.filter(p => p.category === sub.slug).length;
                const active = decorationSubFilter === sub.slug;
                return (
                  <div key={sub.slug} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button type="button" onClick={() => setDecorationSubFilter(sub.slug)} style={{ padding: '3px 10px', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', border: `1px solid ${active ? 'var(--accent)' : 'var(--bordure)'}`, borderRight: 'none', background: 'transparent', color: active ? 'var(--accent)' : 'var(--gris)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {sub.label} <span style={{ opacity: 0.6 }}>({count})</span>
                    </button>
                    <button type="button" title={`Supprimer "${sub.label}"`} onClick={() => setDeleteModal({ slug: sub.slug, label: sub.label, count })} style={{ padding: '3px 7px', fontSize: '0.62rem', border: `1px solid ${active ? 'var(--accent)' : 'var(--bordure)'}`, background: 'transparent', color: '#c05050', cursor: 'pointer', lineHeight: 1, transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192,80,80,0.08)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {isDecorationFilterActive && decorationSubcats.length === 0 && (
            <div style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '2px solid var(--bordure)', fontSize: '0.78rem', color: 'var(--gris)', fontStyle: 'italic' }}>
              Aucun produit décoration — créez un produit avec une catégorie <code>decoration-xxx</code>.
            </div>
          )}

          {deleteModal && (
            <DeleteResineSubcatModal
              slug={deleteModal.slug}
              label={deleteModal.label}
              productCount={deleteModal.count}
              otherSubcats={decorationSubcats.filter(s => s.slug !== deleteModal.slug)}
              onSuccess={() => { setDeleteModal(null); setDecorationSubFilter('all'); window.location.reload(); }}
              onClose={() => setDeleteModal(null)}
            />
          )}

          {/* Mobile : cartes produit */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredProducts.map((p) => (
                <div key={p.id} style={{ border: '1px solid var(--bordure)', display: 'flex', gap: '12px', padding: '12px' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} style={{ width: 56, height: 56, objectFit: 'cover', flexShrink: 0, background: 'var(--accent-clair)' }} />
                  ) : (
                    <div style={{ width: 56, height: 56, background: 'var(--accent-clair)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gris)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{p.category}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                        <span>{p.price?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                        <span style={{ color: p.stock === 0 ? '#c05050' : 'var(--gris)' }}>Stock : {p.stock ?? '∞'}</span>
                      </div>
                      <AdminProductActions productId={p.id} />
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <p style={{ textAlign: 'center', padding: '32px', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif" }}>Aucun produit.</p>
              )}
            </div>
          ) : (
            /* Desktop : tableau */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bordure)' }}>
                    {['Image', 'Nom', 'Catégorie', 'Prix', 'Stock', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 400 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--bordure)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} style={{ width: 50, height: 50, objectFit: 'cover', background: 'var(--accent-clair)' }} />
                        ) : (
                          <div style={{ width: 50, height: 50, background: 'var(--accent-clair)' }} />
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: "'Cormorant Garamond', serif" }}>{p.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--gris)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.category}</td>
                      <td style={{ padding: '12px 16px' }}>{p.price?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                      <td style={{ padding: '12px 16px', color: p.stock === 0 ? '#c05050' : 'var(--gris)' }}>{p.stock ?? '∞'}</td>
                      <td style={{ padding: '12px 16px' }}><AdminProductActions productId={p.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif" }}>Aucun produit dans cette catégorie.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════ COMMANDES ═══════════════ */}
      {activeTab === 'orders' && (
        <>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 400, marginBottom: '16px' }}>
            Commandes
          </h1>

          {/* Filtres statut */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {ORDER_STATUS_FILTERS.map((f) => {
              const active = orderStatusFilter === f.value;
              return (
                <button key={f.value} type="button" onClick={() => setOrderStatusFilter(f.value)} style={{ padding: isMobile ? '5px 10px' : '6px 14px', fontSize: isMobile ? '0.62rem' : '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${active ? 'var(--noir)' : 'var(--bordure)'}`, background: active ? 'var(--noir)' : 'transparent', color: active ? 'var(--blanc)' : 'var(--gris)', cursor: 'pointer' }}>
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Mobile : cartes commande */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredOrders.map((o) => {
                const subtotal = o.subtotal ?? 0;
                const shipping = o.shipping_cost ?? 0;
                const total = o.total_price ?? o.total ?? subtotal + shipping;
                const color = ORDER_STATUS_COLORS[o.status] ?? 'var(--gris)';
                const isRelay = o.shipping_method === 'point_relay';
                return (
                  <div key={o.id} style={{ border: '1px solid var(--bordure)', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--gris)', marginBottom: '2px' }}>#{String(o.id).slice(0, 8).toUpperCase()}</div>
                        <div style={{ fontSize: '0.9rem' }}>{o.customer_name ?? '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gris)' }}>{o.customer_email}</div>
                      </div>
                      <span style={{ padding: '3px 8px', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color, border: `1px solid ${color}`, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px' }}>
                        {translateStatus(o.status)}
                      </span>
                    </div>
                    {/* Badge livraison */}
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.62rem', padding: '2px 8px', border: `1px solid ${isRelay ? '#7a5ab5' : '#4a7ab5'}`, color: isRelay ? '#7a5ab5' : '#4a7ab5', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {isRelay ? '📦 Point Relay' : '🏠 Domicile'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '10px', color: 'var(--gris)' }}>
                      <span>{new Date(o.created_at).toLocaleDateString('fr-FR')} · {Array.isArray(o.items) ? o.items.length : 0} article(s)</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--accent)', fontSize: '1rem' }}>{formatPrice(total)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <AdminOrderStatus orderId={o.id} currentStatus={o.status} />
                      <button type="button" onClick={() => setSelectedOrderId(String(o.id))} style={{ fontSize: '0.68rem', padding: '5px 12px', border: '1px solid var(--bordure)', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Détail
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredOrders.length === 0 && (
                <p style={{ textAlign: 'center', padding: '32px', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif" }}>Aucune commande.</p>
              )}
            </div>
          ) : (
            /* Desktop : tableau */
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bordure)' }}>
                    {['Commande #', 'Client', 'Email', 'Mode', 'Articles', 'Sous-total', 'Livraison', 'Total', 'Statut', 'Date', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gris)', fontWeight: 400, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => {
                    const subtotal = o.subtotal ?? 0;
                    const shipping = o.shipping_cost ?? 0;
                    const total = o.total_price ?? o.total ?? subtotal + shipping;
                    const color = ORDER_STATUS_COLORS[o.status] ?? 'var(--gris)';
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--bordure)' }}>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gris)' }}>{o.id ? String(o.id).slice(0, 8).toUpperCase() : 'N/A'}</td>
                        <td style={{ padding: '12px 14px' }}>{o.customer_name ?? '—'}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--gris)', fontSize: '0.8rem' }}>{o.customer_email}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {o.shipping_method === 'point_relay' ? (
                            <span style={{ fontSize: '0.62rem', padding: '2px 8px', border: '1px solid #7a5ab5', color: '#7a5ab5', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>📦 Point Relay</span>
                          ) : (
                            <span style={{ fontSize: '0.62rem', padding: '2px 8px', border: '1px solid #4a7ab5', color: '#4a7ab5', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>🏠 Domicile</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--gris)' }}>{Array.isArray(o.items) ? o.items.length : 0}</td>
                        <td style={{ padding: '12px 14px', fontFamily: "'Cormorant Garamond', serif" }}>{formatPrice(subtotal)}</td>
                        <td style={{ padding: '12px 14px', fontFamily: "'Cormorant Garamond', serif" }}>{formatPrice(shipping)}</td>
                        <td style={{ padding: '12px 14px', fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}>{formatPrice(total)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '3px 10px', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color, border: `1px solid ${color}`, whiteSpace: 'nowrap' }}>
                            {translateStatus(o.status)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--gris)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <AdminOrderStatus orderId={o.id} currentStatus={o.status} />
                            <button type="button" onClick={() => setSelectedOrderId(String(o.id))} style={{ fontSize: '0.72rem', padding: '4px 10px', border: '1px solid var(--bordure)', background: 'transparent', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Voir détail
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {orders.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif" }}>Aucune commande.</p>
              )}
            </div>
          )}

          {/* Modal détail commande */}
          {selectedOrderId && (() => {
            const order = orders.find((o) => String(o.id) === selectedOrderId);
            if (!order) return null;
            const subtotal = order.subtotal ?? 0;
            const shipping = order.shipping_cost ?? 0;
            const total = order.total_price ?? order.total ?? subtotal + shipping;
            const discountStored = Number(order.discount_amount ?? 0);
            const promoCode = order.promo_codes?.code ?? null;
            const inferredDiscount = Math.max(0, subtotal + shipping - total);
            const discountAmount = discountStored > 0.01 ? discountStored : (inferredDiscount > 0.01 ? inferredDiscount : 0);
            const statusLabel = translateStatus(order.status);
            const sc = ORDER_STATUS_COLORS[order.status] ?? 'var(--gris)';
            const addr = order.shipping_address ?? {};
            const isRelay = order.shipping_method === 'point_relay';
            const relay = order.pickup_point ?? {};

            return (
              <div onClick={() => setSelectedOrderId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: isMobile ? '0' : '20px' }}>
                <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--fond-carte)', border: isMobile ? 'none' : '1px solid var(--bordure-hover)', maxWidth: '680px', width: '100%', maxHeight: isMobile ? '100dvh' : '90vh', height: isMobile ? '100dvh' : undefined, overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
                  {/* En-tête modale */}
                  <div style={{ padding: isMobile ? '16px' : '24px 28px', borderBottom: '1px solid var(--bordure)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div>
                      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--texte)', marginBottom: '4px' }}>
                        #{String(order.id).slice(0, 8).toUpperCase()}
                      </h2>
                      <p style={{ fontSize: '0.75rem', color: 'var(--texte-muted)' }}>
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {order.customer_email && !isMobile && <> &nbsp;·&nbsp; {order.customer_email}</>}
                      </p>
                      {isMobile && order.customer_email && <p style={{ fontSize: '0.72rem', color: 'var(--texte-muted)' }}>{order.customer_email}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ padding: '4px 10px', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', border: `1px solid ${sc}`, color: sc, whiteSpace: 'nowrap' }}>
                        {statusLabel}
                      </span>
                      <button type="button" onClick={() => setSelectedOrderId(null)} style={{ border: '1px solid var(--bordure)', background: 'transparent', cursor: 'pointer', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--texte-muted)', padding: '5px 10px', transition: 'all 0.2s' }}>
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Adresse + Montants */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.3fr) minmax(0,1fr)', gap: 0, borderBottom: '1px solid var(--bordure)' }}>
                    <div style={{ padding: isMobile ? '16px' : '24px 28px', borderRight: isMobile ? 'none' : '1px solid var(--bordure)', borderBottom: isMobile ? '1px solid var(--bordure)' : 'none' }}>
                      {/* Badge mode de livraison */}
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.62rem', padding: '3px 10px', border: `1px solid ${isRelay ? '#7a5ab5' : '#4a7ab5'}`, color: isRelay ? '#7a5ab5' : '#4a7ab5', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {isRelay ? '📦 Point Mondial Relay' : '🏠 Livraison à domicile'}
                        </span>
                      </div>

                      {isRelay ? (
                        <>
                          <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '10px' }}>Point Relay sélectionné</p>
                          {relay.name ? (
                            <div style={{ fontSize: '0.86rem', color: 'var(--texte)', lineHeight: 1.8 }}>
                              <p style={{ fontWeight: 600 }}>{relay.name}</p>
                              {relay.id && <p style={{ fontSize: '0.75rem', color: 'var(--texte-muted)' }}>Code : {relay.id}</p>}
                              {relay.address && <p style={{ color: 'var(--texte-muted)' }}>{relay.address}</p>}
                              {(relay.zipCode || relay.city) && <p style={{ color: 'var(--texte-muted)' }}>{relay.zipCode} {relay.city}</p>}
                              {addr.phone && <p style={{ color: 'var(--texte-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Tél. client : {addr.phone}</p>}
                            </div>
                          ) : (
                            <p style={{ fontSize: '0.83rem', color: 'var(--texte-muted)' }}>Informations du point non disponibles.</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '10px' }}>Adresse de livraison</p>
                          {(addr.first_name || addr.last_name || addr.address) ? (
                            <div style={{ fontSize: '0.86rem', color: 'var(--texte)', lineHeight: 1.8 }}>
                              {(addr.first_name || addr.last_name) && <p style={{ fontWeight: 500 }}>{addr.first_name} {addr.last_name}</p>}
                              {addr.address && <p style={{ color: 'var(--texte-muted)' }}>{addr.address}</p>}
                              {(addr.postal_code || addr.city) && <p style={{ color: 'var(--texte-muted)' }}>{addr.postal_code} {addr.city}</p>}
                              {addr.country && <p style={{ color: 'var(--texte-muted)' }}>{addr.country}</p>}
                              {addr.phone && <p style={{ color: 'var(--texte-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Tél. : {addr.phone}</p>}
                            </div>
                          ) : (
                            <p style={{ fontSize: '0.83rem', color: 'var(--texte-muted)' }}>Aucune adresse renseignée.</p>
                          )}
                        </>
                      )}
                    </div>
                    <div style={{ padding: isMobile ? '16px' : '24px 28px' }}>
                      <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '10px' }}>Montants</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--texte-muted)' }}>
                          <span>Sous-total</span><span style={{ color: 'var(--texte)' }}>{formatPrice(subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--texte-muted)' }}>
                          <span>Livraison</span><span style={{ color: 'var(--texte)' }}>{shipping === 0 ? 'Offerte' : formatPrice(shipping)}</span>
                        </div>
                        {discountAmount > 0.01 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', fontSize: '0.86rem', color: 'var(--texte-muted)' }}>
                            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                              {promoCode ? (
                                <>
                                  Code promo
                                  <span style={{ fontSize: '0.58rem', padding: '2px 8px', border: '1px solid rgba(143,213,209,0.45)', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    {promoCode}
                                  </span>
                                </>
                              ) : (
                                'Réduction'
                              )}
                            </span>
                            <span style={{ color: '#7ab87a', flexShrink: 0 }}>−{formatPrice(discountAmount)}</span>
                          </div>
                        )}
                        <div style={{ borderTop: '1px solid var(--bordure)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
                          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--texte-muted)' }}>Total</span>
                          <div style={{ textAlign: 'right' }}>
                            {discountAmount > 0.01 && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--texte-muted)', textDecoration: 'line-through', marginBottom: '2px' }}>
                                {formatPrice(subtotal + shipping)}
                              </p>
                            )}
                            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', color: 'var(--accent)' }}>{formatPrice(total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Produits commandés */}
                  <div style={{ padding: isMobile ? '16px' : '24px 28px', flex: 1, overflowY: 'auto' }}>
                    <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--texte-muted)', marginBottom: '10px' }}>Produits commandés</p>
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {order.items.map((it: any, idx: number) => {
                          const lineTotal = (it.price ?? 0) * (it.qty ?? 0);
                          return (
                            <li key={`${it.product_id ?? idx}-${it.price ?? 0}-${it.qty ?? 0}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--bordure)', gap: '12px' }}>
                              <div>
                                <p style={{ fontSize: '0.88rem', color: 'var(--texte)', fontFamily: "'Cormorant Garamond', serif", marginBottom: '2px' }}>{it.product_name ?? 'Produit'}</p>
                                <p style={{ fontSize: '0.72rem', color: 'var(--texte-muted)' }}>{it.qty ?? 0} × {formatPrice(it.price ?? 0)}</p>
                              </div>
                              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', color: 'var(--accent)', flexShrink: 0 }}>{formatPrice(lineTotal)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '0.84rem', color: 'var(--texte-muted)' }}>Aucun article dans cette commande.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* ═══════════════ AVIS ═══════════════ */}
      {activeTab === 'categories' && (
        <AdminCategoryImages initialOverrides={categoryImageOverrides} isMobile={isMobile} />
      )}

      {activeTab === 'reviews' && (
        <>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 400, marginBottom: '20px' }}>
            Modération des avis
          </h1>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {(['pending', 'approved', 'rejected'] as const).map((val) => (
              <button key={val} type="button" onClick={() => setReviewFilter(val)} style={{ padding: isMobile ? '6px 14px' : '6px 18px', fontSize: isMobile ? '0.65rem' : '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', border: `1px solid ${reviewFilter === val ? 'var(--noir)' : 'var(--bordure)'}`, background: reviewFilter === val ? 'var(--noir)' : 'transparent', color: reviewFilter === val ? 'var(--blanc)' : 'var(--gris)', cursor: 'pointer', flex: isMobile ? '1' : undefined }}>
                {val === 'pending' ? 'En attente' : val === 'approved' ? 'Approuvés' : 'Refusés'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredReviews.map((r) => (
              <div key={r.id} style={{ border: '1px solid var(--bordure)', padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--accent)', fontSize: '0.88rem', marginBottom: '6px' }}>{stars(r.rating)}</div>
                  <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--texte)', lineHeight: 1.6, marginBottom: '8px' }}>&ldquo;{r.comment ?? ''}&rdquo;</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--gris)', letterSpacing: '0.08em' }}>
                    {r.author_name ?? 'Anonyme'} · {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <AdminReviewActions reviewId={r.id} currentStatus={r.status} />
                </div>
              </div>
            ))}
            {filteredReviews.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gris)', fontFamily: "'Cormorant Garamond', serif" }}>Aucun avis dans cette catégorie.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
