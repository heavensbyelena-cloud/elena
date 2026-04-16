'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);

  // Vider le panier dès l'arrivée sur la page succès
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Récupérer le numéro de commande si on a un session_id
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/checkout/order-by-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => data?.order?.id && setOrderId(data.order.id))
      .catch(() => {});
  }, [sessionId]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
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
      <p style={{ color: 'var(--gris)', fontSize: '1rem', maxWidth: '400px', lineHeight: 1.7 }}>
        Merci pour votre achat. Elena prépare vos bijoux avec soin.
      </p>
      <p style={{ fontSize: '0.9rem', color: 'var(--gris)' }}>
        Numéro de commande :{' '}
        <strong>{orderId ? String(orderId).slice(0, 8) : 'N/A'}</strong>
      </p>
      <Link href="/shop" className="btn-primary" style={{ marginTop: '16px' }}>
        Retour à la boutique
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--gris)' }}>Chargement…</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
