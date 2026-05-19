'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import type { Product } from '@/types';
import { getPrimaryImageUrl } from '@/lib/product-images';

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const thumbUrl = getPrimaryImageUrl(product);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      id: String(product.id),
      name: product.name,
      price: product.price,
      image_url: thumbUrl,
    });
    showToast(`${product.name} ajouté au panier ✦`);
  }

  return (
    <article className="product-card">
      <Link href={`/product/${product.id}`}>
        <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: 'var(--fond-carte)', position: 'relative' }}>
          <Image
            src={thumbUrl || 'https://placehold.co/400x400/1A1A1A/2DA89D?text=Bijou'}
            alt={product.name}
            fill
            style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            sizes="(max-width:768px) 50vw, 25vw"
            unoptimized={!thumbUrl || thumbUrl.includes('placehold.co')}
          />
        </div>
      </Link>

      <div style={{ padding: '22px 18px', textAlign: 'center' }}>
        {product.badge && (
          <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {product.badge.split(' / ').map(b => (
              <span key={b} className="product-badge">{b.trim()}</span>
            ))}
          </div>
        )}
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', marginBottom: '6px' }}>
          <Link href={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'var(--texte)' }}>
            {product.name}
          </Link>
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--accent)', marginBottom: '14px' }}>{fmt(product.price)}</p>
        <button onClick={handleAdd} className="btn-primary" style={{ width: '100%', padding: '11px' }}>
          Ajouter au panier
        </button>
      </div>
    </article>
  );
}
