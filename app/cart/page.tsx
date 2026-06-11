'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import PromoInput from '@/components/Cart/PromoInput';
import { calcShipping, FREE_SHIPPING_THRESHOLD } from '@/lib/utils';
import { isAtStockMax } from '@/lib/cart-stock';
import { useToast } from '@/context/ToastContext';

function fmt(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'; }

export default function CartPage() {
  const { items, total, appliedPromo, updateQuantity, removeFromCart, clearCart } = useCart();
  const { showToast } = useToast();
  const shipping = calcShipping(total);
  const discount = appliedPromo?.discount_amount ?? 0;
  const grandTotal = Math.max(0, total + shipping - discount);

  function increaseQty(id: string, currentQty: number) {
    if (!updateQuantity(id, currentQty + 1)) {
      showToast('Stock maximum atteint pour cet article.');
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px', gap: '20px' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.6rem', color: 'var(--gris)' }}>Votre panier est vide</p>
        <Link href="/shop" className="btn-primary">Découvrir la boutique</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 40px' }}>
      <h1 className="section-title" style={{ marginBottom: '50px' }}>Mon Panier</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '60px', alignItems: 'start' }} className="cart-layout">

        {/* Articles */}
        <div>
          {items.map(item => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: '20px', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--bordure)' }}>
              <div style={{ width: 90, height: 90, background: 'var(--accent-clair)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <Image src={item.image_url || 'https://placehold.co/90x90/F5E6E0/8A8A8A?text=Bijou'} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="90px" />
              </div>
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', marginBottom: '6px' }}>{item.name}</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--gris)', marginBottom: '14px' }}>{fmt(item.price)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => updateQuantity(item.id, item.qty - 1)} style={{ width: 28, height: 28, border: '1px solid var(--bordure)', background: 'transparent', cursor: 'pointer', fontSize: '1rem' }}>−</button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                  <button
                    onClick={() => increaseQty(item.id, item.qty)}
                    disabled={isAtStockMax(item.qty, item.stock)}
                    style={{ width: 28, height: 28, border: '1px solid var(--bordure)', background: 'transparent', cursor: isAtStockMax(item.qty, item.stock) ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: isAtStockMax(item.qty, item.stock) ? 0.4 : 1 }}
                  >+</button>
                </div>
                {item.stock != null && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--gris)', marginTop: '6px' }}>
                    {item.stock === 0 ? 'Rupture de stock' : `${item.stock} en stock`}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', marginBottom: '12px' }}>{fmt(item.price * item.qty)}</p>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'var(--gris)', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}

          <button onClick={clearCart} style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--gris)', cursor: 'pointer', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'underline' }}>
            Vider le panier
          </button>
        </div>

        {/* Récapitulatif */}
        <div style={{ background: 'var(--fond-casse)', padding: '32px', border: '1px solid var(--bordure)' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.2rem', fontWeight: 400, letterSpacing: '0.15em', marginBottom: '24px' }}>Récapitulatif</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.88rem', color: 'var(--gris)' }}>
            <span>Sous-total</span><span>{fmt(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '0.88rem', color: 'var(--gris)' }}>
            <span>Livraison</span><span>{shipping === 0 ? 'Offerte' : fmt(shipping)}</span>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <PromoInput />
          </div>
          {shipping > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '16px' }}>
              Plus que {fmt(FREE_SHIPPING_THRESHOLD - total)} pour la livraison offerte
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bordure)', paddingTop: '16px', marginBottom: '24px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }}>Total</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.3rem' }}>{fmt(grandTotal)}</span>
          </div>
          <Link href="/checkout" className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '15px' }}>
            Passer la commande
          </Link>
          <Link href="/shop" style={{ display: 'block', textAlign: 'center', marginTop: '14px', fontSize: '0.75rem', color: 'var(--gris)', letterSpacing: '0.1em', textDecoration: 'underline' }}>
            Continuer mes achats
          </Link>
        </div>
      </div>

      <style>{`@media(max-width:768px){ .cart-layout{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}
