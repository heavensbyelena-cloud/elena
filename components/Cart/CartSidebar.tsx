'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/utils';
import { isAtStockMax } from '@/lib/cart-stock';
import { useToast } from '@/context/ToastContext';

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
}

export default function CartSidebar() {
  const { items, total, count, isOpen, closeCart, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();

  // Fermer avec Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [closeCart]);

  function increaseQty(id: string, currentQty: number) {
    if (!updateQuantity(id, currentQty + 1)) {
      showToast('Stock maximum atteint pour cet article.');
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(26,26,26,0.4)',
          zIndex: 200,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sidebar */}
      <aside
        aria-label="Panier"
        style={{
          position: 'fixed', top: 0, right: 0,
          width: '400px', maxWidth: '95vw', height: '100vh',
          background: 'var(--fond-carte)',
          zIndex: 300,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: isOpen ? '-8px 0 60px rgba(0,0,0,0.6)' : 'none',
          borderLeft: '1px solid var(--bordure)',
        }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 28px 20px', borderBottom: '1px solid var(--bordure)' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', fontWeight: 400, letterSpacing: '0.15em', color: 'var(--texte)' }}>
            Mon Panier {count > 0 && <span style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>({count})</span>}
          </h2>
          <button onClick={closeCart} aria-label="Fermer" style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--texte-muted)', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Articles */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }} className="scrollbar-hide">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--texte-muted)' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', marginBottom: '8px' }}>Votre panier est vide</p>
              <p style={{ fontSize: '0.8rem' }}>Explorez nos créations</p>
              <Link href="/shop" onClick={closeCart} style={{ display: 'inline-block', marginTop: '24px' }} className="btn-primary">
                Voir la boutique
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: '14px', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--bordure)' }}>
                <div style={{ width: '70px', height: '70px', background: 'var(--accent-clair)', overflow: 'hidden', flexShrink: 0 }}>
                  <Image
                    src={item.image_url || 'https://placehold.co/70x70/F5E6E0/8A8A8A?text=Bijou'}
                    alt={item.name}
                    width={70} height={70}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '8px' }}>{fmt(item.price)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => updateQuantity(item.id, item.qty - 1)} style={{ width: '26px', height: '26px', background: 'transparent', border: '1px solid var(--bordure)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: '0.9rem', minWidth: '20px', textAlign: 'center', color: 'var(--texte)' }}>{item.qty}</span>
                    <button
                      onClick={() => increaseQty(item.id, item.qty)}
                      disabled={isAtStockMax(item.qty, item.stock)}
                      style={{ width: '26px', height: '26px', background: 'transparent', border: '1px solid var(--bordure)', cursor: isAtStockMax(item.qty, item.stock) ? 'not-allowed' : 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isAtStockMax(item.qty, item.stock) ? 0.4 : 1 }}
                    >+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} aria-label={`Supprimer ${item.name}`} style={{ background: 'none', border: 'none', fontSize: '0.9rem', color: 'var(--gris)', cursor: 'pointer', alignSelf: 'flex-start' }}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pied de page */}
        {items.length > 0 && (
          <div style={{ padding: '20px 28px 28px', borderTop: '1px solid var(--bordure)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Total</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem', color: 'var(--accent)' }}>{fmt(total)}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--texte-muted)', textAlign: 'center', marginBottom: '16px' }}>
              {total >= FREE_SHIPPING_THRESHOLD ? '✓ Livraison offerte' : `Plus que ${fmt(FREE_SHIPPING_THRESHOLD - total)} pour la livraison offerte`}
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              style={{ display: 'block', textAlign: 'center' }}
              className="btn-primary"
            >
              Passer la commande
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
