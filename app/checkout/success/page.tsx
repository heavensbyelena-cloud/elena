'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice, translateStatus } from '@/lib/utils';
import type { OrderItemRow } from '@/lib/order-access';

type SuccessOrder = {
  id: string | number;
  status: string;
  items: OrderItemRow[];
  subtotal?: number | null;
  shipping_cost?: number | null;
  total_price?: number | null;
  total?: number | null;
  created_at?: string | null;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [order, setOrder] = useState<SuccessOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetch(`/api/checkout/order-by-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) setOrder(data.order as SuccessOrder);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const orderId = order?.id ? String(order.id) : null;
  const orderRef = orderId ? orderId.slice(0, 8).toUpperCase() : '—';
  const subtotal = order?.subtotal ?? 0;
  const shipping = order?.shipping_cost ?? 0;
  const total = order?.total_price ?? order?.total ?? subtotal + shipping;
  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: '60px 24px',
        gap: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3rem' }}>✦</div>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2rem',
          fontWeight: 400,
        }}
      >
        Paiement réussi !
      </h1>
      <p style={{ color: 'var(--gris)', fontSize: '1rem', lineHeight: 1.7 }}>
        Merci pour votre achat. Elena prépare vos bijoux avec soin. Un e-mail de confirmation vous a été envoyé.
      </p>

      <div
        style={{
          textAlign: 'left',
          border: '1px solid var(--bordure)',
          padding: '24px',
          background: 'var(--fond-carte, var(--blanc))',
        }}
      >
        <p style={{ fontSize: '0.72rem', letterSpacing: '0.15em', color: 'var(--gris)', marginBottom: '8px' }}>
          COMMANDE #{orderRef}
        </p>
        {loading ? (
          <p style={{ color: 'var(--gris)', fontSize: '0.9rem' }}>Chargement du récapitulatif…</p>
        ) : items.length > 0 ? (
          <>
            <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0 }}>
              {items.map((item, idx) => (
                <li
                  key={`${item.product_id ?? item.product_name}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--bordure)' : 'none',
                    fontSize: '0.92rem',
                  }}
                >
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem' }}>
                    {item.product_name} × {item.qty}
                  </span>
                  <span>{formatPrice(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>
            <div style={{ fontSize: '0.85rem', color: 'var(--gris)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Livraison</span>
                <span>{shipping === 0 ? 'Offerte' : formatPrice(shipping)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--bordure)',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.2rem',
                  color: 'var(--texte)',
                }}
              >
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              {order?.status && (
                <p style={{ marginTop: '8px', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Statut : {translateStatus(order.status)}
                </p>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--gris)', fontSize: '0.9rem' }}>
            Votre commande est enregistrée. Consultez votre e-mail ou votre espace client pour le détail.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
        {orderId && (
          <Link href={`/orders/${orderId}`} className="btn-primary">
            Voir ma commande
          </Link>
        )}
        <Link
          href="/account/dashboard"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            border: '1px solid var(--bordure)',
            textDecoration: 'none',
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--texte)',
          }}
        >
          Mes commandes
        </Link>
        <Link href="/shop" style={{ fontSize: '0.85rem', color: 'var(--gris)', alignSelf: 'center' }}>
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--gris)' }}>Chargement…</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
